

# Dealership Website Migration Tool - MVP Build Plan

## What We're Building

A web app where Fadi pastes dealership URLs, selects an OEM brand, and the tool scrapes the old site then uses AI to regenerate premium React/Tailwind pages following that brand's design system. The AI uses your uploaded design intelligence files (automotive.md, animation-motion.md, surfaces-effects.md, SKILL.md workflow) as its "component buffet" reference -- not rigid templates, but high-quality code patterns it adapts per site.

## Architecture

```text
┌─────────────────────────────────────┐
│           Dashboard UI              │
│  URL input → Brand selector → Go   │
│  Progress → Preview → Export        │
└──────────────┬──────────────────────┘
               │
    ┌──────────▼──────────┐
    │  Firecrawl Scraper  │  Edge function
    │  (scrape + branding)│
    └──────────┬──────────┘
               │
    ┌──────────▼──────────┐
    │   AI Code Generator │  Edge function
    │  Lovable AI Gateway │
    │  + design reference │
    │  + brand config     │
    └──────────┬──────────┘
               │
    ┌──────────▼──────────┐
    │  Live Preview +     │
    │  HTML/Code Export    │
    └─────────────────────┘
```

## Key Files from Your Uploads We'll Embed

- **automotive.md** -- OEM color systems, inventory card anatomy, VDP layout, filter patterns, luxury vs mainstream rules. This is the core vertical intelligence.
- **animation-motion.md** -- Framer Motion scroll reveals, staggered children, spring presets. Used selectively for premium feel.
- **surfaces-effects.md** -- Glassmorphism, gradient borders, noise textures, glow effects. Applied based on brand tier (luxury vs mainstream).
- **SKILL.md workflow** -- The AI prompt follows this: classify business → determine operating mode → design thesis → generate. Not all steps are explicit to the user, but the AI system prompt encodes this thinking.
- **globals.css** -- ThemeProvider variable structure (--brand-primary, --brand-accent, etc.) for runtime brand switching.

Files we skip: saas.md, b2b-services.md, barbershop-salon.md, restaurant-food.md, portfolio-agency.md, etc. -- not relevant to automotive dealerships.

## Implementation Plan

### Phase 1: Dashboard UI
- **Index page**: Dark, professional dashboard with a text area for pasting URLs (one per line), an OEM brand dropdown (Honda, Mitsubishi, Acura, Mazda, Toyota, Ford, BMW, etc.), and a "Generate" button.
- **Brand configs**: JSON objects per OEM with colors, fonts, and design tier (luxury/mainstream) based on automotive.md intelligence.
- **Progress view**: Shows scraping status per URL, then generation status.
- **Preview panel**: Renders the AI-generated code in an iframe or inline preview with a "Copy Code" / "Download HTML" button.

### Phase 2: Firecrawl Scraping Pipeline
- Connect Firecrawl connector for API key.
- Edge function `firecrawl-scrape` that accepts a URL and returns markdown content, links, metadata (title, description), and branding (colors, fonts, logos).
- Frontend calls this per URL, stores results in state.

### Phase 3: AI Code Generation Engine
- Enable Lovable Cloud for edge functions + AI gateway.
- Edge function `generate-dealer-page` that receives:
  1. Scraped content (markdown, images, SEO tags)
  2. Selected brand config (colors, fonts, tier)
  3. System prompt containing embedded excerpts from automotive.md (card anatomy, VDP layout, filter patterns, OEM rules), animation-motion.md (scroll reveals, spring presets), and surfaces-effects.md (glassmorphism, gradient borders for luxury tier).
- The system prompt instructs the AI to generate a complete React component with Tailwind CSS that fits the scraped content into a dealership layout, adapting structure to the content (not rigid), applying the brand's exact colors/fonts, and using premium techniques appropriate to the tier.
- Returns generated React/JSX code.

### Phase 4: Preview & Export
- Render the generated code in a sandboxed preview.
- "Copy Code" button for each generated page.
- "Download All" as ZIP with all pages + a shared globals.css using the ThemeProvider variable structure.

## Technical Details

**Brand Config Example:**
```text
honda: {
  name: "Honda",
  tier: "mainstream",
  primary: "#CC0000",
  secondary: "#000000",
  accent: "#CC0000",
  fontHeading: "Inter",
  fontBody: "Inter",
  ctaStyle: "aggressive",  // "Get Your ePrice"
  cardDensity: "high"      // 3-4 per row, price dominant
}

bmw: {
  name: "BMW",
  tier: "luxury",
  primary: "#1C69D4",
  secondary: "#000000",
  accent: "#1C69D4",
  fontHeading: "Playfair Display",
  fontBody: "Inter",
  ctaStyle: "refined",     // "Configure Your BMW"
  cardDensity: "low"       // 2 per row, image-focused
}
```

**Dependencies to add:** framer-motion, react-markdown, remark-gfm

**Connectors needed:** Firecrawl (for scraping), Lovable Cloud (for edge functions + AI gateway)

## What Gets Built (File Structure)

- `src/pages/Index.tsx` -- Main dashboard
- `src/components/UrlInput.tsx` -- URL paste area + brand selector
- `src/components/ScrapeProgress.tsx` -- Per-URL progress indicators
- `src/components/PagePreview.tsx` -- Generated page preview + code view
- `src/components/ExportButton.tsx` -- Copy/download functionality
- `src/lib/brands.ts` -- OEM brand configurations
- `src/lib/design-intelligence.ts` -- Embedded excerpts from your MD files as system prompt content
- `src/lib/api/firecrawl.ts` -- Firecrawl API client
- `supabase/functions/firecrawl-scrape/index.ts` -- Scraping edge function
- `supabase/functions/generate-dealer-page/index.ts` -- AI generation edge function

