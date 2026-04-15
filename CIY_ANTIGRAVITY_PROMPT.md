# CIY — ANTIGRAVITY BUILD PROMPT
## Paste this ENTIRE prompt into Antigravity

---

Build a complete website called CIY (Craft It Yourself).
This is an AI-powered Minecraft plugin generator — like CreativeMode.net but for Bukkit/Paper server plugins.

---

## BRAND

Name: CIY — Craft It Yourself
Tagline: "Create Minecraft plugins without coding"
Logo: Pixelated diamond icon + "CIY" text in green

## DESIGN SYSTEM

Colors:
- Background: #0a0a0a
- Surface (cards): #111111
- Border: #1a1a1a
- Primary green: #22c55e
- Primary hover: #16a34a
- Text primary: #ffffff
- Text secondary: #888888
- Code background: #0d0d0d
- Amber accent: #f59e0b

Fonts:
- Headings: "Press Start 2P" from Google Fonts (pixel/minecraft style)
- Body: "Inter" from Google Fonts
- Code: "JetBrains Mono" from Google Fonts

Style: Dark, clean, modern — like Vercel but with Minecraft DNA. Smooth animations everywhere. Green glows on hover. Subtle grid pattern on hero background.

---

## TECH STACK

- Next.js 14 with App Router
- Tailwind CSS
- Shadcn/ui components
- highlight.js for syntax highlighting
- JSZip for zip file downloads
- Framer Motion for animations
- Google Generative AI SDK (@google/generative-ai)

---

## FILE STRUCTURE

```
ciy/
├── app/
│   ├── page.jsx              (landing page)
│   ├── create/page.jsx       (generator page)
│   ├── explore/page.jsx      (browse page)
│   ├── layout.jsx            (root layout)
│   └── api/
│       └── generate/
│           └── route.js      (Gemini API route)
├── components/
│   ├── Navbar.jsx
│   ├── Footer.jsx
│   ├── PluginCard.jsx
│   ├── CodeViewer.jsx
│   ├── GeneratorChat.jsx
│   └── LoadingAnimation.jsx
├── lib/
│   └── systemPrompt.js       (master AI prompt)
├── public/
│   └── (static assets)
├── .env.local
└── package.json
```

---

## PAGE 1: LANDING PAGE (/)

### Navbar
- Fixed top, blur backdrop, subtle border bottom
- Left: Diamond pixel icon (green, 24px) + "CIY" in Press Start 2P font, green
- Center links: "Home" "Explore" "How it Works"
- Right: "Start Building →" button — green background, white text, rounded
- Mobile: hamburger menu

### Hero Section
- Full viewport height
- Background: #0a0a0a with subtle green grid lines (CSS background-image grid)
- Floating minecraft block particles animation (CSS keyframes, 8-10 blocks floating at different speeds and positions, use emoji 🧱 or simple squares)
- Center content:
  - Small pill badge above heading: "✨ Powered by Gemini AI" — green border, dark bg
  - Main heading (Press Start 2P, 48px desktop / 24px mobile):
    "Create Minecraft Plugins Without Coding"
  - Subheading (Inter, 20px, #888888):
    "Describe your plugin in plain English. CIY builds complete, production-ready code instantly using AI."
  - Two CTA buttons side by side:
    1. "Start Building →" — green filled, large, rounded-lg, shadow glow effect on hover
    2. "Explore Plugins" — outlined green border, same size
  - Below buttons: small text "#22c55e color: "No account needed • Free forever • Instant download"

### Stats Bar
- 3 columns with animated count-up numbers:
  - "2,847" — "Plugins Generated"
  - "15,241" — "Total Downloads"  
  - "100%" — "Free to Use"
- Subtle separator lines between stats
- Green number color

### How It Works Section
- Section title: "How It Works" (Press Start 2P, smaller)
- 3 cards in a row with connecting arrows between them:

  Card 1 — "1. Describe"
  Icon: 💬 (large, green background circle)
  Title: "Describe Your Plugin"
  Text: "Tell CIY what you want in plain English. No technical knowledge needed — just describe what it should do."

  Card 2 — "2. Generate"  
  Icon: ⚡
  Title: "AI Builds It"
  Text: "Our AI writes complete Java code, plugin.yml, pom.xml, and config files. Production-ready in seconds."

  Card 3 — "3. Download"
  Icon: 📦
  Title: "Download & Install"
  Text: "Get all your files as a ZIP. Drop the JAR in your plugins folder and you're done."

- Cards: dark surface (#111111), green top border accent, rounded-xl, hover lift animation

### Example Prompts Section
- Title: "What Can You Build?"
- Subtitle: "Click any example to try it"
- Grid of 8 clickable prompt chips (rounded pills, dark bg, green border on hover):
  - "A /heal command with cooldown"
  - "Custom crate reward system"
  - "BedWars minigame"
  - "Token economy with GUI shop"
  - "Staff mode with vanish"
  - "Custom enchantments"
  - "Player levels and XP"
  - "Auction house"
- Clicking any chip redirects to /create with that prompt pre-filled

### Community Plugins Section
- Title: "Made with CIY"
- Subtitle: "Plugins built by the community"
- Grid of 6 PluginCard components (2 rows of 3):

  Plugin 1:
  - Name: "HealCommand Pro"
  - Description: "Complete heal, feed, and repair commands with configurable cooldowns and permission nodes"
  - Tags: ["Commands", "Admin", "Utility"]
  - Downloads: 1,247
  - Version: "1.21.4"

  Plugin 2:
  - Name: "CrateRewards"
  - Description: "Animated virtual crate system with tiered rarities, custom rewards, and particle effects"
  - Tags: ["Crates", "Economy", "Fun"]
  - Downloads: 892

  Plugin 3:
  - Name: "BedWars Pro"
  - Description: "Full BedWars minigame with shop, team upgrades, map rotation, and stats tracking"
  - Tags: ["Minigame", "PvP", "Teams"]
  - Downloads: 2,103

  Plugin 4:
  - Name: "TokenShop"
  - Description: "Complete token economy with GUI shop, daily rewards, and leaderboards"
  - Tags: ["Economy", "Shop", "GUI"]
  - Downloads: 654

  Plugin 5:
  - Name: "StaffMode"
  - Description: "Complete staff management with vanish, freeze, spy mode, and punishment tools"
  - Tags: ["Admin", "Moderation", "Staff"]
  - Downloads: 1,891

  Plugin 6:
  - Name: "CustomEnchants"
  - Description: "20+ custom enchantments including lifesteal, explosive arrows, and time freeze"
  - Tags: ["Enchants", "RPG", "Combat"]
  - Downloads: 743

- "View All Plugins →" button below grid, outlined style

### Final CTA Section
- Dark green gradient background (subtle)
- Large text: "Ready to build your plugin?"
- Subtext: "Join thousands of server owners and developers using CIY"
- "Start Building For Free →" big green button
- No account required note below

### Footer
- Dark background, top border
- Left: CIY logo + tagline
- Center links: Explore, Create, How it Works, Discord, GitHub
- Right: "Made with ❤️ for the Minecraft community"
- Bottom: "© 2026 CIY — Craft It Yourself • Not affiliated with Mojang or Microsoft"

---

## PAGE 2: GENERATOR (/create)

### Layout
Split screen layout:
- LEFT PANEL (38% width, fixed sidebar on desktop)
- RIGHT PANEL (62% width, scrollable)
- On mobile: stacked vertically, left on top

### LEFT PANEL — Input

Header:
- "Build Your Plugin" title (Press Start 2P, small)
- Subtitle: "Describe what you want in plain English"

Quick Prompts:
- Label: "✨ Try an example:"
- 4 clickable chips that fill the textarea:
  - "Make a /heal command with 30s cooldown"
  - "Create a GUI crate system"
  - "Build a token economy plugin"
  - "Add custom enchantments"

Main Textarea:
- Large textarea, dark bg (#0d0d0d), green focus border
- Placeholder: "Describe your plugin...\n\nExample: Create a /heal command that heals the player to full health, with a configurable cooldown per player. Add a permission node 'myplugin.heal' and make all messages configurable in config.yml"
- Min height: 200px
- Character count shown bottom right

Options Row:
- Minecraft Version dropdown: 1.21.4 (default), 1.21, 1.20.6, 1.20.4, 1.20.1, 1.19.4
- Complexity dropdown: 
  - "Simple" (single class, basic features)
  - "Medium" (multiple classes, config driven)
  - "Advanced" (full architecture, database, async)

Generate Button:
- Full width
- "⚡ Generate Plugin" text
- Green background
- Large, rounded-lg
- Disabled + loading state during generation

Loading State (shows instead of button during generation):
- Progress bar (green, animated)
- Cycling messages every 1.5 seconds:
  "🔍 Analyzing your request..."
  "📝 Writing plugin architecture..."
  "☕ Generating Java code..."
  "📋 Creating plugin.yml..."
  "🔧 Building pom.xml..."
  "⚙️ Writing config files..."
  "✅ Almost done..."

Tips Section (below button):
- "💡 Tips for better results:"
- 3 bullet points:
  - "Be specific about commands and permissions"
  - "Mention if you need database storage"
  - "List all features you want included"

### RIGHT PANEL — Code Viewer

Empty State (before generation):
- Centered content
- Large 🧱 emoji or pixel art
- "Your plugin will appear here"
- Subtitle: "Describe your plugin and click Generate"
- Subtle dashed border box

After Generation:

Top Bar:
- Plugin name (extracted from generation) in green
- "✅ Generated successfully" badge
- "Download All Files (.zip)" button — green, right aligned
- Small note: "Compiled JAR not included — build with Maven"

File Tabs:
- Horizontal scrollable tab bar
- One tab per generated file
- Active tab: green underline
- Tab names: "plugin.yml" | "pom.xml" | "MainPlugin.java" | "config.yml" | "SETUP.md" | (any extra files)

Code Display:
- Dark code block (#0d0d0d background)
- Syntax highlighting via highlight.js
  - Java: java highlighting
  - YAML: yaml highlighting
  - XML: xml highlighting
  - Markdown: plaintext
- Line numbers on left
- "Copy" button top right of each file
- Smooth scroll if code is long

Setup Instructions Panel:
- Below code tabs
- Collapsible section "📋 Setup Instructions"
- Shows SETUP.md content rendered as markdown
- Numbered steps with green numbers

Share Section:
- "Share this plugin" 
- Copy link button
- Tweet button: "I just built a Minecraft plugin with @CIYcraft in seconds! 🎮⚡"

---

## PAGE 3: EXPLORE (/explore)

### Header
- Title: "Explore Plugins"
- Subtitle: "Browse plugins built by the CIY community"
- "Build Your Own →" button right aligned

### Search & Filters
- Search bar (full width): "Search plugins..." with search icon
- Filter pills below (horizontally scrollable):
  "All" (active/green) | "Commands" | "Economy" | "Minigames" | "Admin" | "RPG" | "Protection" | "Fun" | "Chat" | "Utilities"

### Sort Options
- Right side: "Sort by" dropdown
- Options: Newest, Most Downloaded, Most Popular

### Plugin Grid
- 3 columns desktop, 2 tablet, 1 mobile
- 12 plugin cards (2 pages × 6, with pagination)
- Same PluginCard component as homepage

### Plugin Card Component (PluginCard.jsx)
Each card shows:
- Plugin name (white, semibold)
- Description (gray, 2 lines max, ellipsis)
- Tags row (green pills, small text, max 3 shown)
- Bottom row:
  - MC version badge (dark, small)
  - Download count with ⬇️ icon
  - "View Code →" button (text button, green)
- Card: dark surface, border, rounded-xl
- Hover: lift up + border brightens + subtle green glow

### Pagination
- Page numbers at bottom
- Previous / Next buttons

---

## API ROUTE (/api/generate/route.js)

Create this API route that:

1. Accepts POST request with body: { description, version, complexity }
2. Validates inputs
3. Calls Gemini API with the master system prompt
4. Parses the response into individual files
5. Returns JSON: { files: { "plugin.yml": "...", "pom.xml": "...", "MainPlugin.java": "...", "config.yml": "...", "SETUP.md": "..." }, pluginName: "..." }

The system prompt to use in the API call:

```javascript
const SYSTEM_PROMPT = `You are CIY — an expert Minecraft Paper/Bukkit plugin developer. Generate complete, production-ready Minecraft plugins from descriptions.

TARGET: Paper ${version} | Java 21 | Maven

ALWAYS GENERATE ALL FILES:
1. Main Java class + any additional classes needed
2. plugin.yml  
3. pom.xml
4. config.yml
5. SETUP.md with numbered installation steps

CRITICAL RULES:
- NEVER block the main thread — use CompletableFuture for all database/file I/O
- NEVER hardcode values — everything configurable in config.yml
- ALWAYS use Adventure API: Component.text() not legacy §color codes
- ALWAYS handle exceptions with plugin.getLogger().severe()
- ALWAYS check permissions before command execution
- ALWAYS use api-version: '1.21' in plugin.yml
- ALWAYS include Paper API repository and dependency in pom.xml
- Code MUST compile first try — no placeholder methods

Paper API:
Repository: https://repo.papermc.io/repository/maven-public/
Dependency: io.papermc.paper:paper-api:${version}-R0.1-SNAPSHOT:provided

OUTPUT FORMAT — use EXACTLY this structure, no exceptions:

=== plugin.yml ===
[full plugin.yml content]
=== END ===

=== pom.xml ===
[full pom.xml content]
=== END ===

=== src/main/java/com/ciy/plugin/MainClass.java ===
[full Java file content]
=== END ===

=== src/main/resources/config.yml ===
[full config.yml content]
=== END ===

=== SETUP.md ===
# Setup Instructions
[numbered steps]
=== END ===

Complexity level for this generation: ${complexity}
- Simple: single class, basic implementation
- Medium: multiple classes, full config, clean architecture  
- Advanced: managers, async patterns, database, full production quality

User request: ${description}`
```

Parse the response by splitting on `=== ` and `=== END ===` markers.

Handle errors:
- API key missing: return 500 with helpful message
- Gemini error: return 500 with error details
- Parse error: return 500 with raw response

Rate limiting:
- Add simple in-memory rate limit: max 3 requests per IP per minute
- Return 429 if exceeded with message "Please wait before generating again"

---

## ZIP DOWNLOAD FUNCTIONALITY

In the CodeViewer component, implement download:

```javascript
import JSZip from 'jszip'

const downloadZip = async (files, pluginName) => {
  const zip = new JSZip()
  
  // Add each file to zip maintaining folder structure
  Object.entries(files).forEach(([path, content]) => {
    zip.file(path, content)
  })
  
  // Add a README
  zip.file('README.txt', `${pluginName} - Generated by CIY (Craft It Yourself)
  
Visit ciy.gg to generate more plugins!

HOW TO BUILD:
1. Install Java 21 and Maven
2. Run: mvn clean package
3. Find your JAR in target/ folder
4. Drop JAR in your server's plugins/ folder
5. Restart server

Generated on: ${new Date().toLocaleDateString()}`)
  
  const blob = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${pluginName.replace(/\s+/g, '-')}-CIY.zip`
  a.click()
  URL.revokeObjectURL(url)
}
```

---

## ANIMATIONS

Add these CSS animations:

1. Floating blocks in hero (minecraft blocks drifting up slowly)
2. Fade-in-up on scroll for all sections (Intersection Observer)
3. Shimmer loading effect on cards while generating
4. Count-up animation on stats numbers
5. Typing cursor animation in textarea placeholder
6. Green pulse on generate button
7. Confetti or particle burst when generation completes

---

## ENVIRONMENT VARIABLES

Create .env.local with:
```
GEMINI_API_KEY=your_gemini_api_key_here
```

---

## PACKAGE.JSON DEPENDENCIES

```json
{
  "dependencies": {
    "next": "14.2.0",
    "react": "^18",
    "react-dom": "^18",
    "@google/generative-ai": "^0.21.0",
    "jszip": "^3.10.1",
    "highlight.js": "^11.9.0",
    "framer-motion": "^11.0.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0"
  }
}
```

---

## IMPORTANT NOTES

1. The generate button calls /api/generate with the description, version, and complexity
2. Show loading animation during API call (takes 5-15 seconds)
3. Parse the returned files and display in tabs
4. Download button creates a real downloadable ZIP
5. All example plugins on explore page are hardcoded static data for now
6. Clicking example prompt chips on homepage redirects to /create?prompt=... and pre-fills the textarea
7. Mobile must work perfectly — most users will share on phone
8. Add meta tags for SEO: title, description, og:image
9. Page title: "CIY — Create Minecraft Plugins Without Coding"
10. Make it FAST — optimize images, lazy load below fold content

Build this complete, fully functional, beautiful website.
