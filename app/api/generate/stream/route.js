import { getGenerationPrompt, formatZipContext } from '@/lib/masterPrompts';
import { AI_PROVIDERS, ALLOWED_VERSIONS, ALLOWED_COMPLEXITY } from '@/lib/providers';
import { sanitizeZipFiles } from '@/lib/server/zipSanitizer';
import { callAIStream, pickKeyFor } from '@/lib/server/aiClient';
import { limit } from '@/lib/server/rateLimit';
import { applyIPGuard } from '@/lib/server/routeGuard';
import { captureServerError } from '@/lib/server/sentry';
import {
  verifyToken, signToken, spendCredit, availableCredits,
  toClientUsage, COMPLEXITY_TO_TIER,
} from '@/lib/server/session';
import { applyWatermarks } from '@/lib/server/watermarker';
import { parseGeneratedCode } from '@/lib/server/parseGeneratedCode';

export const runtime = 'nodejs';        // provider SDKs are not Edge-compatible
export const dynamic = 'force-dynamic'; // never cache a stream
export const maxDuration = 300;          // hard cap: 5 minutes per stream

const MAX_DESCRIPTION_LEN = 5000;
const ALLOWED_VERSIONS_SET = new Set(ALLOWED_VERSIONS);
const ALLOWED_COMPLEXITY_SET = new Set(ALLOWED_COMPLEXITY);

const STREAM_TIMEOUT_MS = 5 * 60 * 1000; // must match maxDuration

// SSE helper — serialize any JSON payload as one event.
function sseEvent(encoder, eventName, data) {
  return encoder.encode(`event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`);
}

export async function POST(req) {
  const guard = await applyIPGuard(req, 'generate:ip', { max: 3, windowMs: 60_000 });
  if (guard) return guard;

  let body;
  try { body = await req.json(); }
  catch { return Response.json({ success: false, error: 'Invalid JSON body.' }, { status: 400 }); }

  const { description, version, complexity, provider, token, files: zipFiles } = body || {};

  if (typeof description !== 'string' || typeof provider !== 'string' || typeof token !== 'string') {
    return Response.json({ success: false, error: 'Missing or invalid required fields.' }, { status: 400 });
  }
  const trimmedDesc = description.trim();
  if (!trimmedDesc || trimmedDesc.length > MAX_DESCRIPTION_LEN) {
    return Response.json({ success: false, error: 'Invalid description.' }, { status: 400 });
  }

  let payload;
  try { payload = verifyToken(token); }
  catch {
    return Response.json(
      { success: false, error: 'Session expired — please sign in again.', code: 'session_expired' },
      { status: 401 }
    );
  }

  // Per-user rate limit: 5/min, 60/hour. Catches session-token sharing abuse.
  const uid = payload.uid;
  const userMin = await limit('generate:uid:min', uid, { windowMs: 60_000, max: 5 });
  if (!userMin.ok) {
    return Response.json({ success: false, error: 'Slow down — 5 generations per minute max.' }, { status: 429 });
  }
  const userHour = await limit('generate:uid:hour', uid, { windowMs: 3_600_000, max: 60 });
  if (!userHour.ok) {
    return Response.json({ success: false, error: 'Hourly generation limit reached.' }, { status: 429 });
  }

  const safeVersion    = ALLOWED_VERSIONS_SET.has(version)      ? version    : '1.21.4';
  const safeComplexity = ALLOWED_COMPLEXITY_SET.has(complexity) ? complexity : 'Medium';
  const tier           = COMPLEXITY_TO_TIER[safeComplexity] || 'normal';

  if (availableCredits(payload, tier) <= 0) {
    return Response.json(
      { success: false, error: `No ${tier} credits remaining.`, code: 'no_credits' },
      { status: 402 }
    );
  }

  const provConfig = AI_PROVIDERS.find(p => p.id === provider);
  if (!provConfig) {
    return Response.json({ success: false, error: 'Invalid AI provider.' }, { status: 400 });
  }

  // Premium Gating: OmniAgent (Hybrid Engine) is Crafter & Master tiers only
  if (provider === 'hybrid' && payload.plan !== 'crafter' && payload.plan !== 'master') {
    return Response.json(
      { success: false, error: 'The CIY OmniAgent (Hybrid Engine) is exclusive to Crafter and Master plans.', code: 'premium_only' },
      { status: 403 }
    );
  }
  const key = pickKeyFor(provider);
  const isSandbox = !key;

  let cleanZip = null;
  try {
    cleanZip = sanitizeZipFiles(zipFiles);
  } catch (err) {
    if (err.message && err.message.startsWith('INVALID_ZIP:')) {
      return Response.json({ success: false, error: err.message.replace('INVALID_ZIP: ', '') }, { status: 400 });
    }
  }
  const zipContext = cleanZip ? formatZipContext(cleanZip) : '';
  const { cached: systemCached, dynamic: systemDynamic } =
    getGenerationPrompt(safeVersion, safeComplexity, trimmedDesc, zipContext);

  const encoder = new TextEncoder();
  const abort   = req.signal;

  const stream = new ReadableStream({
    async start(controller) {
      let closed  = false;
      const safeClose = () => { if (!closed) { closed = true; try { controller.close(); } catch {} } };
      const send = (event, data) => {
        if (closed) return;
        try { controller.enqueue(sseEvent(encoder, event, data)); }
        catch { closed = true; }
      };

      // Hard wall: close the stream after STREAM_TIMEOUT_MS no matter what.
      const timeoutId = setTimeout(() => {
        if (!closed) {
          send('error', { error: 'Generation timed out.' });
          safeClose();
        }
      }, STREAM_TIMEOUT_MS);

      // Client closed the connection — abort upstream work.
      const onAbort = () => {
        clearTimeout(timeoutId);
        safeClose();
      };
      try { abort?.addEventListener('abort', onAbort); } catch {}

      try {
        send('start', { tier, provider, model: isSandbox ? 'sandbox-model' : provConfig.model });

        let finalMeta = null;

        if (isSandbox) {
          const mockCode = `=== plugin.yml ===
name: HealPlugin
version: 1.0.0
main: gg.craftityourself.heal.HealPlugin
api-version: '1.21'
commands:
  heal:
    description: Heals the player to full health.
    permission: ciy.heal
    usage: /<command>
permissions:
  ciy.heal:
    description: Allows players to heal themselves.
    default: op
=== END ===

=== pom.xml ===
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>
  <groupId>gg.craftityourself</groupId>
  <artifactId>healplugin</artifactId>
  <version>1.0.0</version>
  <properties>
    <maven.compiler.source>21</maven.compiler.source>
    <maven.compiler.target>21</maven.compiler.target>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
  </properties>
  <repositories>
    <repository>
      <id>papermc</id>
      <url>https://repo.papermc.io/repository/maven-public/</url>
    </repository>
  </repositories>
  <dependencies>
    <dependency>
      <groupId>io.papermc.paper</groupId>
      <artifactId>paper-api</artifactId>
      <version>1.21.4-R0.1-SNAPSHOT</version>
      <scope>provided</scope>
    </dependency>
  </dependencies>
  <build>
    <plugins>
      <plugin>
        <groupId>org.apache.maven.plugins</groupId>
        <artifactId>maven-compiler-plugin</artifactId>
        <version>3.11.0</version>
        <configuration>
          <release>21</release>
        </configuration>
      </plugin>
    </plugins>
  </build>
</project>
=== END ===

=== src/main/java/gg/craftityourself/heal/HealPlugin.java ===
package gg.craftityourself.heal;

import org.bukkit.command.Command;
import org.bukkit.command.CommandExecutor;
import org.bukkit.command.CommandSender;
import org.bukkit.entity.Player;
import org.bukkit.plugin.java.JavaPlugin;
import org.bukkit.configuration.file.FileConfiguration;
import net.kyori.adventure.text.Component;
import net.kyori.adventure.text.minimessage.MiniMessage;
import java.util.HashMap;
import java.util.UUID;

public final class HealPlugin extends JavaPlugin implements CommandExecutor {

    private final HashMap<UUID, Long> cooldowns = new HashMap<>();

    @Override
    public void onEnable() {
        saveDefaultConfig();
        getCommand("heal").setExecutor(this);
        getLogger().info("HealPlugin has been successfully loaded!");
    }

    @Override
    public boolean onCommand(CommandSender sender, Command command, String label, String[] args) {
        if (!(sender instanceof Player)) {
            sender.sendMessage(Component.text("Only players can execute this command!"));
            return true;
        }

        Player player = (Player) sender;
        if (!player.hasPermission("ciy.heal")) {
            String noPermissionMsg = getConfig().getString("messages.no-permission", "<red>You do not have permission!</red>");
            player.sendMessage(MiniMessage.miniMessage().deserialize(noPermissionMsg));
            return true;
        }

        long cooldownTime = getConfig().getLong("cooldown-seconds", 30) * 1000L;
        long now = System.currentTimeMillis();

        if (cooldowns.containsKey(player.getUniqueId())) {
            long timeLeft = cooldowns.get(player.getUniqueId()) + cooldownTime - now;
            if (timeLeft > 0) {
                String cooldownMsg = getConfig().getString("messages.cooldown", "<red>Please wait <gold>{seconds}s</gold> before healing again!</red>");
                cooldownMsg = cooldownMsg.replace("{seconds}", String.valueOf(timeLeft / 1000));
                player.sendMessage(MiniMessage.miniMessage().deserialize(cooldownMsg));
                return true;
            }
        }

        player.setHealth(player.getMaxHealth());
        player.setFoodLevel(20);
        cooldowns.put(player.getUniqueId(), now);

        String successMsg = getConfig().getString("messages.success", "<green>You have been fully healed and fed!</green>");
        player.sendMessage(MiniMessage.miniMessage().deserialize(successMsg));
        return true;
    }
}
=== END ===

=== src/main/resources/config.yml ===
# HealPlugin configuration

cooldown-seconds: 30

messages:
  no-permission: "<red>★ <bold>CIY</bold> | You do not have permission to execute this command!</red>"
  cooldown: "<red>★ <bold>CIY</bold> | Please wait <gold>{seconds}</gold> seconds before using /heal again!</red>"
  success: "<green>★ <bold>CIY</bold> | You have been fully healed and fed! Go conquer the wild.</green>"
=== END ===

=== SETUP.md ===
# HealPlugin Setup Guide

Follow these steps to deploy your compiled Minecraft plugin:

1. **Build the ZIP/JAR**: Click \"Compile JAR\" or \"Download ZIP\".
2. **Move to Server**: Upload \`HealPlugin.jar\` to your server's \`plugins/\` directory.
3. **Restart Server**: Run \`/reload\` or restart your Paper server to load the plugin.
4. **Grant Permissions**: Assign \`ciy.heal\` to player groups to let them use the \`/heal\` command.
=== END ===`;

          // Chunk stream simulation
          const chunkSize = 40;
          for (let i = 0; i < mockCode.length; i += chunkSize) {
            if (abort?.aborted || closed) break;
            const textChunk = mockCode.slice(i, i + chunkSize);
            send('chunk', { text: textChunk });
            await new Promise(r => setTimeout(r, 45));
          }

          finalMeta = {
            text: mockCode,
            provider: 'sandbox',
            model: 'sandbox-model',
            rounds: 1,
            truncated: false,
          };
        } else {
          const iter = callAIStream({
            provider, providerKey: key, tier, systemCached, systemDynamic,
            userMessage: 'Generate the requested plugin.',
          });

          for await (const chunk of iter) {
            if (abort?.aborted || closed) break;
            if (chunk.done) { finalMeta = chunk.meta; break; }
            send('chunk', { text: chunk.text });
          }
        }

        if (abort?.aborted || closed) return;
        if (!finalMeta) throw new Error('stream ended without final meta');

        let { files, pluginName } = parseGeneratedCode(finalMeta.text || '');
        if (Object.keys(files).length === 0) {
          send('error', { error: 'AI did not produce files in the expected format. Please try again.' });
          return;
        }

        // Apply watermarks for non-Master plan users
        files = applyWatermarks(files, payload.plan);

        const nextPayload = spendCredit(payload, tier);
        const newToken    = signToken(nextPayload);

        send('done', {
          data:  { files, pluginName },
          token: newToken,
          usage: toClientUsage(nextPayload),
          meta: {
            provider:  finalMeta.provider,
            model:     finalMeta.model,
            rounds:    finalMeta.rounds,
            truncated: finalMeta.truncated,
          },
        });
      } catch (err) {
        captureServerError(err, { where: 'generate:stream', uid, provider });
        send('error', { error: 'Generation failed. Please try again.' });
      } finally {
        clearTimeout(timeoutId);
        try { abort?.removeEventListener('abort', onAbort); } catch {}
        safeClose();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type':  'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection':    'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
