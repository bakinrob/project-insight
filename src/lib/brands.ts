export type BrandTier = "luxury" | "mainstream";

export interface BrandProfile {
  tone: string;
  designDirection: string;
  homepagePriorities: string[];
  servicePagePriorities: string[];
  financePagePriorities: string[];
  avoid: string[];
  improve: string[];
}

export interface BrandConfig {
  name: string;
  tier: BrandTier;
  primary: string;
  secondary: string;
  accent: string;
  fontHeading: string;
  fontBody: string;
  ctaStyle: "aggressive" | "refined" | "balanced";
  ctaText: string;
  cardDensity: "high" | "medium" | "low";
  borderRadius: string;
  logoUrl?: string;
  profile: BrandProfile;
}

export const brands: Record<string, BrandConfig> = {
  honda: {
    name: "Honda",
    tier: "mainstream",
    primary: "#CC0000",
    secondary: "#000000",
    accent: "#CC0000",
    fontHeading: "Inter",
    fontBody: "Inter",
    ctaStyle: "aggressive",
    ctaText: "Get Your ePrice",
    cardDensity: "high",
    borderRadius: "0.5rem",
    profile: {
      tone: "reliable, practical, family-friendly, modern",
      designDirection: "clean retail energy with high trust and clear conversion paths",
      homepagePriorities: ["inventory discovery", "service booking", "dealer trust", "special offers"],
      servicePagePriorities: ["appointment CTA", "maintenance credibility", "service menu", "hours and contact"],
      financePagePriorities: ["payment confidence", "credit assistance", "trade-in visibility"],
      avoid: ["overly luxury styling", "dark editorial layouts", "excessive animation"],
      improve: ["cleaner information hierarchy", "sharper CTA placement", "stronger trust sections"],
    },
  },
  toyota: {
    name: "Toyota",
    tier: "mainstream",
    primary: "#EB0A1E",
    secondary: "#282830",
    accent: "#EB0A1E",
    fontHeading: "Inter",
    fontBody: "Inter",
    ctaStyle: "aggressive",
    ctaText: "Check Availability",
    cardDensity: "high",
    borderRadius: "0.5rem",
    profile: {
      tone: "dependable, practical, broad-market, efficiency-focused",
      designDirection: "structured high-volume dealership UI with strong inventory and offer visibility",
      homepagePriorities: ["inventory pathways", "specials", "trade-in", "service retention"],
      servicePagePriorities: ["easy booking", "ownership value", "care plan confidence"],
      financePagePriorities: ["offers", "payment support", "application confidence"],
      avoid: ["overly experimental composition", "luxury serif-heavy styling", "thin CTA contrast"],
      improve: ["more polished spacing", "cleaner content blocks", "better mobile scannability"],
    },
  },
  mitsubishi: {
    name: "Mitsubishi",
    tier: "mainstream",
    primary: "#E60012",
    secondary: "#1A1A1A",
    accent: "#E60012",
    fontHeading: "Inter",
    fontBody: "Inter",
    ctaStyle: "balanced",
    ctaText: "Explore Offers",
    cardDensity: "medium",
    borderRadius: "0.25rem",
    profile: {
      tone: "confident, straightforward, value-oriented",
      designDirection: "bold but structured dealership UI with compact sections and strong offer framing",
      homepagePriorities: ["offers", "inventory paths", "warranty/value messaging", "service"],
      servicePagePriorities: ["clear service options", "ease of booking", "ownership support"],
      financePagePriorities: ["promotions", "credit support", "trade-in"],
      avoid: ["overly soft layouts", "editorial luxury treatments", "generic SaaS composition"],
      improve: ["clearer hero messaging", "better section rhythm", "stronger conversion emphasis"],
    },
  },
  mazda: {
    name: "Mazda",
    tier: "mainstream",
    primary: "#910A2A",
    secondary: "#1A1A2E",
    accent: "#910A2A",
    fontHeading: "Inter",
    fontBody: "Inter",
    ctaStyle: "balanced",
    ctaText: "Build & Price",
    cardDensity: "medium",
    borderRadius: "0.375rem",
    profile: {
      tone: "refined, driver-focused, premium-leaning",
      designDirection: "mainstream-premium feel with elegant spacing and restrained surfaces",
      homepagePriorities: ["model discovery", "brand experience", "dealer trust", "inventory pathways"],
      servicePagePriorities: ["owner confidence", "service care", "booking ease"],
      financePagePriorities: ["ownership confidence", "specials", "trade-in support"],
      avoid: ["cheap retail density", "flashy badges everywhere", "messy card stacks"],
      improve: ["premium composition", "calmer pacing", "more intentional section transitions"],
    },
  },
  acura: {
    name: "Acura",
    tier: "luxury",
    primary: "#1A1A1A",
    secondary: "#2D2D2D",
    accent: "#C4A35A",
    fontHeading: "Playfair Display",
    fontBody: "Inter",
    ctaStyle: "refined",
    ctaText: "Configure Yours",
    cardDensity: "low",
    borderRadius: "0.125rem",
    profile: {
      tone: "premium, elevated, composed, performance-luxury",
      designDirection: "luxury dealership experience with more breathing room and image-led framing",
      homepagePriorities: ["brand experience", "model discovery", "luxury trust", "lead capture"],
      servicePagePriorities: ["premium care", "ownership reassurance", "concierge-like clarity"],
      financePagePriorities: ["premium lease/finance framing", "trade-up confidence"],
      avoid: ["discount-retail aesthetics", "crowded inventory-heavy hero sections", "loud promotional styling"],
      improve: ["elevated typography", "clean luxury spacing", "more premium section sequencing"],
    },
  },
  bmw: {
    name: "BMW",
    tier: "luxury",
    primary: "#1C69D4",
    secondary: "#000000",
    accent: "#1C69D4",
    fontHeading: "Playfair Display",
    fontBody: "Inter",
    ctaStyle: "refined",
    ctaText: "Configure Your BMW",
    cardDensity: "low",
    borderRadius: "0rem",
    profile: {
      tone: "performance-luxury, technical, premium",
      designDirection: "image-forward premium layout with clear model and ownership pathways",
      homepagePriorities: ["model exploration", "brand prestige", "inventory entry points", "service"],
      servicePagePriorities: ["ownership support", "premium servicing", "clear booking"],
      financePagePriorities: ["lease/finance sophistication", "trade-up support"],
      avoid: ["cluttered retail cards", "generic local-business styling"],
      improve: ["stronger premium polish", "cleaner cinematic presentation", "focused CTA hierarchy"],
    },
  },
  mercedes: {
    name: "Mercedes-Benz",
    tier: "luxury",
    primary: "#000000",
    secondary: "#1A1A1A",
    accent: "#C4A35A",
    fontHeading: "Playfair Display",
    fontBody: "Inter",
    ctaStyle: "refined",
    ctaText: "Explore Models",
    cardDensity: "low",
    borderRadius: "0rem",
    profile: {
      tone: "luxury, understated, elegant, prestige-led",
      designDirection: "understated high-end dealership experience with strong visual calm",
      homepagePriorities: ["brand prestige", "model discovery", "dealer trust", "appointment pathways"],
      servicePagePriorities: ["care sophistication", "owner loyalty", "service booking"],
      financePagePriorities: ["premium ownership framing", "high-trust lead capture"],
      avoid: ["busy promotional density", "aggressive retail sale messaging"],
      improve: ["quiet luxury spacing", "more composed surfaces", "better content restraint"],
    },
  },
  ford: {
    name: "Ford",
    tier: "mainstream",
    primary: "#003478",
    secondary: "#1A1A1A",
    accent: "#003478",
    fontHeading: "Inter",
    fontBody: "Inter",
    ctaStyle: "aggressive",
    ctaText: "Get a Quote",
    cardDensity: "high",
    borderRadius: "0.5rem",
    profile: {
      tone: "strong, practical, dependable, broad-market",
      designDirection: "durable dealership UI with clear utility and offer visibility",
      homepagePriorities: ["inventory", "offers", "service", "dealer trust"],
      servicePagePriorities: ["easy booking", "maintenance support", "clear offers"],
      financePagePriorities: ["payment confidence", "rebates", "trade-in"],
      avoid: ["overly boutique styling", "thin visual hierarchy"],
      improve: ["clearer utility", "better section grouping", "stronger retail clarity"],
    },
  },
  chevrolet: {
    name: "Chevrolet",
    tier: "mainstream",
    primary: "#CF9A1C",
    secondary: "#1A1A1A",
    accent: "#CF9A1C",
    fontHeading: "Inter",
    fontBody: "Inter",
    ctaStyle: "aggressive",
    ctaText: "Shop Now",
    cardDensity: "high",
    borderRadius: "0.375rem",
    profile: {
      tone: "bold, accessible, retail-focused",
      designDirection: "high-clarity dealership layout with strong model and offer merchandising",
      homepagePriorities: ["inventory", "specials", "truck/SUV pathways", "service"],
      servicePagePriorities: ["quick maintenance access", "clear offers", "hours"],
      financePagePriorities: ["payments", "credit support", "trade-in"],
      avoid: ["soft luxury styling", "understated CTA treatment"],
      improve: ["better merchandising discipline", "clearer above-the-fold action", "cleaner visual rhythm"],
    },
  },
  lexus: {
    name: "Lexus",
    tier: "luxury",
    primary: "#1A1A1A",
    secondary: "#0D0D0D",
    accent: "#B8860B",
    fontHeading: "Playfair Display",
    fontBody: "Inter",
    ctaStyle: "refined",
    ctaText: "Experience More",
    cardDensity: "low",
    borderRadius: "0rem",
    profile: {
      tone: "quiet luxury, hospitality-driven, refined",
      designDirection: "elevated premium dealership UI with restrained surfaces and experience-first pacing",
      homepagePriorities: ["brand experience", "model exploration", "dealer trust", "contact"],
      servicePagePriorities: ["guest care", "ownership reassurance", "appointment ease"],
      financePagePriorities: ["premium ownership support", "soft conversion framing"],
      avoid: ["retail clutter", "hard-sell promotion blocks", "dense inventory-led layouts"],
      improve: ["premium whitespace", "luxury composure", "clear but quiet conversion pathways"],
    },
  },
};

export const brandKeys = Object.keys(brands);
