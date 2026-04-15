# 🧱 CIY — CRAFT IT YOURSELF
## Master Plan & Complete Roadmap
### The AI Platform for Minecraft Plugin Developers

---

## 🎯 VISION

CIY is the world's first AI-powered Minecraft plugin generation platform.
Like CreativeMode.net but for Bukkit/Paper plugins — and much more powerful.

**One sentence:** "Describe your Minecraft plugin in plain English. CIY builds it instantly."

**The bigger picture:** CIY becomes the GitHub + Cursor + Unity Asset Store of Minecraft plugin development. Every plugin developer, server owner, and Minecraft enthusiast uses CIY to build, share, discover, and monetize plugins.

---

## 🗺️ PHASES OVERVIEW

```
PHASE 1 — MVP (Week 1-2)        → Launch something real
PHASE 2 — Polish (Week 3-4)     → Make it actually work great
PHASE 3 — Community (Month 2)   → Add social features
PHASE 4 — Monetize (Month 3)    → Pro tier + marketplace
PHASE 5 — Platform (Month 4-6)  → Full developer ecosystem
PHASE 6 — Empire (Month 6+)     → Dominate the Minecraft dev space
```

---

## 📦 PHASE 1 — MVP

### Goal
Ship a working product. User describes plugin → AI generates code → User downloads zip.

### Features
- Landing page
- Plugin generator (describe → generate → download)
- Code viewer with syntax highlighting
- ZIP download of all files
- Basic explore page (static examples to start)

### Tech Stack
- **Frontend:** Next.js 14 + Tailwind CSS
- **AI:** Gemini 2.0 Flash API
- **Hosting:** Vercel (free tier)
- **Domain:** ciy.gg or ciy.dev

### Files Generated Per Plugin
1. `MainPlugin.java` — Main plugin class
2. `plugin.yml` — Plugin metadata
3. `pom.xml` — Maven build file
4. `config.yml` — Configuration file
5. Any additional classes (listeners, commands, managers)
6. `SETUP.md` — Setup instructions

### Success Metric
100 plugins generated in first week.

---

## 🔧 PHASE 2 — POLISH

### Goal
Make generations actually work perfectly. Fix bugs, improve quality.

### Features
- User accounts (Supabase auth)
- Save generated plugins to profile
- Generation history
- Improve AI prompt based on user feedback
- Add "regenerate" and "improve" buttons
- Plugin rating system (did it work? thumbs up/down)
- Better error handling and loading states
- Mobile optimization

### Tech Stack Additions
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth (Google + GitHub login)
- **Storage:** Supabase Storage (store generated files)

### Database Schema (Phase 2)
```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT,
  username TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP,
  plan TEXT DEFAULT 'free'
);

-- Generated Plugins  
CREATE TABLE plugins (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  name TEXT,
  description TEXT,
  files JSONB,
  downloads INT DEFAULT 0,
  rating_up INT DEFAULT 0,
  rating_down INT DEFAULT 0,
  is_public BOOLEAN DEFAULT true,
  mc_version TEXT,
  tags TEXT[],
  created_at TIMESTAMP
);

-- Generation Logs
CREATE TABLE generations (
  id UUID PRIMARY KEY,
  user_id UUID,
  prompt TEXT,
  tokens_used INT,
  success BOOLEAN,
  created_at TIMESTAMP
);
```

### Success Metric
500 registered users. 80% positive ratings on generated plugins.

---

## 👥 PHASE 3 — COMMUNITY

### Goal
Make CIY a place people come back to daily.

### Features

#### Browse & Discover
- Full explore page with search and filters
- Trending plugins (most downloaded this week)
- New plugins (latest)
- Categories: Commands, Economy, Minigames, Admin, RPG, Protection, Fun
- Plugin detail page with full code preview
- One-click remix (fork someone's plugin and modify it)

#### Social Features
- User profiles with plugin portfolios
- Follow other creators
- Comment on plugins
- Share plugins on social media
- "Plugin of the Week" featured section
- Leaderboard of top creators

#### Community Tools
- Plugin collections (curated lists)
- "I use this" button (show which servers use a plugin)
- Request board (users request plugins, developers build them)

### Success Metric
2,000 registered users. 50+ plugins shared publicly daily.

---

## 💰 PHASE 4 — MONETIZE

### Goal
Make CIY sustainable and profitable.

### Revenue Streams

#### 1. CIY Pro ($7/month or $60/year)
- Unlimited generations (free = 5/day)
- Priority generation (faster response)
- Private plugins (not shared publicly)
- Advanced complexity plugins
- Custom branding on generated plugins
- Download stats and analytics
- Early access to new features

#### 2. Plugin Marketplace
- Developers sell premium plugins
- CIY takes 15% commission
- Buyers get source code + jar
- Subscription bundles (all plugins for $X/month)

#### 3. CIY Teams ($25/month per team)
- For server networks and studios
- Shared plugin library
- Team member management
- Priority support

#### 4. CIY Enterprise (custom pricing)
- White label for large Minecraft networks
- Custom AI model fine-tuning
- Dedicated support
- SLA guarantees

### Revenue Projections
```
Month 1:  100 Pro users × $7 = $700/month
Month 3:  500 Pro users × $7 = $3,500/month
Month 6:  2,000 Pro users × $7 = $14,000/month
Month 12: 5,000 Pro users × $7 = $35,000/month
+ Marketplace commission
+ Teams revenue
```

### Success Metric
$5,000 MRR by end of month 4.

---

## 🚀 PHASE 5 — PLATFORM

### Goal
CIY becomes the complete developer platform for Minecraft plugins.

### Features

#### CIY Studio (Web IDE)
- Full browser-based code editor (Monaco editor — same as VS Code)
- Edit generated code directly in browser
- AI assistant in the editor (ask questions, fix bugs, add features)
- One-click deploy to test server
- Integrated Maven build system

#### CIY Docs AI
- Ask any question about Bukkit/Paper/Spigot API
- AI that knows every API, every version
- Code examples for every method
- "How do I..." answered instantly
- Version diff checker (what changed between 1.20 and 1.21?)

#### CIY Templates
- Professional plugin templates built by experts
- Start from a template, customize with AI
- Categories: Economy, Minigame, RPG, etc.
- Community-submitted templates

#### CIY Test Server
- One-click test your plugin on a real server
- Cloud-hosted Paper servers
- Automatic plugin upload and restart
- Live logs in browser
- Free 30 minutes per day, Pro = unlimited

#### CIY API
- REST API for developers to integrate CIY generation
- Generate plugins programmatically
- Webhook notifications
- SDK for Node.js, Python, Java

#### CIY VS Code Extension
- AI plugin assistant inside VS Code
- Knows your entire codebase
- Same generation quality as the web app
- Works offline with smaller models

### Success Metric
10,000 monthly active users. $50,000 MRR.

---

## 👑 PHASE 6 — EMPIRE

### Goal
CIY is THE platform for everything Minecraft development.

### Features

#### Beyond Plugins
- Minecraft mod generation (Fabric, Forge, NeoForge)
- BungeeCord/Velocity plugin generation
- Bedrock addon generation
- Resource pack AI assistant
- Datapack generator

#### CIY Academy
- Video courses on plugin development
- AI-assisted learning paths
- Certificates of completion
- "CIY Certified Developer" badge
- Beginner to expert tracks

#### CIY Jobs Board
- Server networks hiring plugin developers
- Developers find work
- CIY takes placement fee
- Verified CIY Certified developers

#### CIY Network
- Connect your Minecraft server to CIY
- Auto-update plugins from CIY
- Server analytics integration
- Plugin health monitoring

#### CIY AI Models
- Fine-tuned models specifically for Minecraft plugin development
- Trained on millions of real plugin codebases
- Best-in-class generation quality
- Available via API

### Success Metric
100,000 monthly active users. Market leader in Minecraft dev tools.

---

## 🏗️ TECHNICAL ARCHITECTURE

### Frontend
```
Next.js 14 (App Router)
├── Tailwind CSS (styling)
├── Shadcn/ui (components)
├── Monaco Editor (code viewer/editor)
├── Highlight.js (syntax highlighting)
├── JSZip (zip file creation)
├── Framer Motion (animations)
└── Zustand (state management)
```

### Backend
```
Next.js API Routes
├── /api/generate     — Plugin generation
├── /api/plugins      — CRUD for plugins
├── /api/users        — User management
├── /api/marketplace  — Marketplace operations
└── /api/billing      — Stripe integration
```

### Database
```
Supabase (PostgreSQL)
├── users
├── plugins
├── generations
├── marketplace_listings
├── purchases
├── ratings
├── comments
├── follows
└── collections
```

### AI Stack
```
Phase 1-3: Gemini 2.0 Flash (cheap, fast, good)
Phase 4+:  Gemini 2.5 Pro (better quality for Pro users)
Phase 6:   Fine-tuned custom model (best quality)
```

### Infrastructure
```
Vercel          — Frontend hosting + Edge functions
Supabase        — Database + Auth + Storage
Cloudflare      — CDN + DDoS protection
Stripe          — Payments
Resend          — Transactional email
Upstash Redis   — Rate limiting + caching
```

---

## 🎨 BRAND & DESIGN

### Colors
```
Background:     #0a0a0a (near black)
Surface:        #111111 (cards)
Border:         #222222 (subtle borders)
Primary:        #22c55e (green — Minecraft grass)
Primary Dark:   #16a34a (hover states)
Text Primary:   #ffffff
Text Secondary: #888888
Accent:         #f59e0b (amber — for highlights)
Error:          #ef4444 (red)
```

### Typography
```
Headings:  "Press Start 2P" (pixel font — Minecraft feel)
Body:      "Inter" (clean, readable)
Code:      "JetBrains Mono" (developer font)
```

### Logo
- Pixelated diamond/block icon
- "CIY" in Press Start 2P font
- Green color
- Works at all sizes

### Voice & Tone
- Friendly but technical
- Empowering ("You built that!")
- Never condescending
- Minecraft references where appropriate
- Brief and clear

---

## 📣 MARKETING STRATEGY

### Phase 1 — Launch
- Post on Reddit: r/admincraft, r/spigot, r/Minecraft
- Post on SpigotMC forums
- Share in Minecraft Discord servers
- Post on Twitter/X with demo video
- Submit to Product Hunt

### Phase 2 — Growth
- YouTube tutorials ("Build a Minecraft plugin in 30 seconds")
- TikTok/Reels showing plugin generation in real time
- Blog posts: "How to create Minecraft plugins without Java knowledge"
- SEO: target "minecraft plugin creator", "bukkit plugin generator"
- Partner with Minecraft YouTubers

### Phase 3 — Scale
- Affiliate program (30% commission)
- Plugin development competitions
- Partner with Minecraft server hosting companies
- Sponsor Minecraft events and conventions

---

## 🔑 KEY DIFFERENTIATORS FROM CREATIVEMODE

| Feature | CreativeMode | CIY |
|---------|-------------|-----|
| Target | Beginners | Everyone |
| Output | Mods (Fabric/Forge) | Plugins (Paper/Spigot) |
| Complexity | Simple items/blocks | Full server systems |
| Developer tools | None | AI copilot, docs, IDE |
| Marketplace | No | Yes |
| Test server | No | Yes (Phase 5) |
| API | No | Yes (Phase 5) |
| VS Code extension | No | Yes (Phase 5) |

---

## ⚠️ RISKS & MITIGATION

| Risk | Likelihood | Mitigation |
|------|-----------|-----------|
| Generated code doesn't compile | High | Strong system prompt + testing |
| API costs too high | Medium | Rate limiting + Pro tier |
| Competitor copies idea | Medium | Move fast, build community moat |
| Mojang/Microsoft legal issues | Low | No trademark infringement |
| AI model quality drops | Low | Support multiple models |

---

## 📅 WEEK BY WEEK ROADMAP

### Week 1
- [ ] Buy domain (ciy.gg)
- [ ] Create Supabase project
- [ ] Create Vercel account  
- [ ] Build MVP with Antigravity
- [ ] Connect Gemini API
- [ ] Test generation quality
- [ ] Deploy to Vercel
- [ ] Share on Reddit/Discord

### Week 2
- [ ] Fix bugs from initial feedback
- [ ] Improve system prompt quality
- [ ] Add loading animations
- [ ] Mobile optimization
- [ ] Add 20 example plugins to explore page
- [ ] Basic SEO setup

### Week 3
- [ ] Add user accounts (Supabase auth)
- [ ] Save plugins to profile
- [ ] Generation history
- [ ] Rating system (did it work?)
- [ ] Improve UI based on feedback

### Week 4
- [ ] Full explore page with search
- [ ] Plugin detail pages
- [ ] Remix functionality
- [ ] User profiles
- [ ] Share to Twitter button

### Month 2
- [ ] Pro tier launch
- [ ] Stripe integration
- [ ] Private plugins
- [ ] Priority generation
- [ ] Email notifications
- [ ] Analytics dashboard

### Month 3
- [ ] Plugin marketplace
- [ ] CIY Docs AI
- [ ] Plugin templates
- [ ] VS Code extension (basic)
- [ ] Public API (beta)

---

## 💡 THE MASTER SYSTEM PROMPT

This is the core AI prompt that powers all plugin generation.
It lives in `/api/generate/route.js` and is never shown to users.

```
You are CIY — an expert Minecraft Paper/Bukkit plugin developer 
with 10+ years of experience. You generate complete, 
production-ready Minecraft plugins from natural language descriptions.

TARGET: Paper 1.21.4 | Java 21 | Maven

ALWAYS GENERATE ALL OF THESE FILES:
1. Main Java class (and any additional classes needed)
2. plugin.yml
3. pom.xml  
4. config.yml
5. SETUP.md with clear installation instructions

STRICT RULES (never violate):
1. Never block main thread — use CompletableFuture for all I/O
2. Never hardcode values — everything goes in config.yml
3. Always use Paper Adventure API for messages (Component not §codes)
4. Always handle exceptions with proper logging
5. Always check permissions before executing commands
6. Always use EventPriority on event handlers
7. Always call saveDefaultConfig() in onEnable
8. Always list all commands and permissions in plugin.yml
9. Always use provided scope for Paper API in pom.xml
10. Code must compile and run first try — no placeholder methods

PAPER API (always use these):
Repository: https://repo.papermc.io/repository/maven-public/
Dependency: io.papermc.paper:paper-api:1.21.4-R0.1-SNAPSHOT

OUTPUT FORMAT — use exactly this structure:
=== plugin.yml ===
[content]
=== END ===

=== pom.xml ===
[content]  
=== END ===

=== src/main/java/[package]/[ClassName].java ===
[content]
=== END ===

=== src/main/resources/config.yml ===
[content]
=== END ===

=== SETUP.md ===
[numbered setup steps]
=== END ===
```

---

## 🎮 EXAMPLE GENERATIONS (Test These First)

### Simple: /heal command
```
Input: "Add a /heal command that heals the player, 
with a 30 second cooldown and permission node"

Expected output:
- HealPlugin.java (main class + command + listener)
- plugin.yml (with heal command and permission)
- pom.xml (Paper API dependency)
- config.yml (cooldown value, messages)
- SETUP.md
```

### Medium: Crate system
```
Input: "Create a crate system where players can right-click 
special chests to win random rewards. Admin can set rewards 
with /crate setreward. Rewards have different rarities."

Expected output:
- CratePlugin.java
- CrateManager.java
- CrateListener.java  
- CrateCommand.java
- plugin.yml
- pom.xml
- config.yml (with example rewards)
- SETUP.md
```

### Complex: Economy system
```
Input: "Build a full economy plugin with /balance, /pay, 
/baltop commands. Players earn money by killing mobs. 
SQLite database for storage. Vault integration."

Expected output:
- EconomyPlugin.java
- EconomyManager.java
- DatabaseManager.java
- EconomyListener.java
- EconomyCommands.java
- VaultHook.java
- plugin.yml
- pom.xml (with Vault softdepend)
- config.yml
- schema.sql
- SETUP.md
```

---

## 📊 SUCCESS METRICS BY PHASE

| Phase | Users | Generations | MRR | Timeline |
|-------|-------|-------------|-----|----------|
| 1 MVP | 100 | 500 | $0 | Week 2 |
| 2 Polish | 500 | 5,000 | $0 | Week 4 |
| 3 Community | 2,000 | 25,000 | $0 | Month 2 |
| 4 Monetize | 5,000 | 75,000 | $5k | Month 3 |
| 5 Platform | 10,000 | 200,000 | $25k | Month 6 |
| 6 Empire | 100,000 | 2,000,000 | $100k+ | Month 12 |

---

*CIY — Craft It Yourself*
*Built by CireeXCreations*
*Version 1.0 — April 2026*
