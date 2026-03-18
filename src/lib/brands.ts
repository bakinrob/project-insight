import type { DiscoveryPageType } from "@/lib/dealer-workflow";

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

export interface OemTokens {
  bgPrimary: string;
  bgSurface: string;
  textPrimary: string;
  textSecondary: string;
  brandPrimary: string;
  brandAccent: string;
  borderSubtle: string;
  trust: string;
}

export interface OemPageSchema {
  pageType: Extract<DiscoveryPageType, "homepage" | "service" | "specials" | "financing" | "contact" | "about">;
  sectionOrder: string[];
  primaryCtas: string[];
  requiredKeywords: string[];
  requiredElements: string[];
  compositionNotes: string[];
  avoid: string[];
}

export interface OemPack {
  name: string;
  tokens: OemTokens;
  voice: string[];
  globalRules: string[];
  mobileRules: string[];
  antiPatterns: string[];
  improvementRules: string[];
  pageSchemas: Partial<Record<DiscoveryPageType, OemPageSchema>>;
  verificationRules: string[];
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
  oemPack: OemPack;
}

const sharedAutomotiveRules = [
  "Preserve dealership-native navigation and retail flow.",
  "Keep new inventory, used inventory, service, specials, and financing easy to reach.",
  "Place the strongest CTA above the fold and repeat it near trust content.",
  "Keep content blocks scannable and dealer-platform-friendly instead of editorial.",
  "Use real dealership content and imagery; never invent model claims.",
];

const sharedMobileRules = [
  "Prioritize tap targets and a sticky action path for call, schedule, or pricing.",
  "Collapse dense content into clean stacked cards and utility rows on mobile.",
  "Avoid horizontal overflow, wide promo banners, and complex side-by-side text blocks on small screens.",
];

function createDefaultPageSchema(
  pageType: OemPageSchema["pageType"],
  sectionOrder: string[],
  primaryCtas: string[],
  requiredKeywords: string[],
  compositionNotes: string[],
): OemPageSchema {
  return {
    pageType,
    sectionOrder,
    primaryCtas,
    requiredKeywords,
    requiredElements: ["Visible CTA above the fold", "Trust signal within one scroll", "Structured supporting section"],
    compositionNotes,
    avoid: [
      "Do not use generic SaaS hero composition.",
      "Do not hide the main action inside oversized decorative blocks.",
      "Do not drift into luxury/editorial pacing for mainstream OEMs.",
    ],
  };
}

function createDefaultOemPack(config: Omit<BrandConfig, "oemPack">, overrides?: Partial<OemPack>): OemPack {
  const defaultSchemas: Partial<Record<DiscoveryPageType, OemPageSchema>> = {
    homepage: createDefaultPageSchema(
      "homepage",
      ["hero", "quick-actions", "inventory-paths", "trust", "service-cta"],
      [config.ctaText, "Schedule Service"],
      ["inventory", "service", "specials"],
      [
        "Lead with a dealership-native hero and strong utility paths.",
        "Use quick actions before deeper brand-story content.",
      ],
    ),
    service: createDefaultPageSchema(
      "service",
      ["utility-intro", "service-menu", "value-props", "hours-contact", "booking-cta"],
      ["Schedule Service", "Contact Service"],
      ["service", "maintenance", "appointment"],
      [
        "Feature an appointment CTA immediately.",
        "Keep service offers and amenities visible without looking like inventory cards.",
      ],
    ),
    specials: createDefaultPageSchema(
      "specials",
      ["breadcrumb", "offer-stack", "service-cta", "trust-help", "bottom-cta"],
      ["View Offers", "Schedule Service"],
      ["special", "offer", "coupon"],
      [
        "Offer cards should be retail-clear and not feel like pricing tables.",
        "Keep a service-retention CTA visible above the fold.",
      ],
    ),
    financing: createDefaultPageSchema(
      "financing",
      ["confidence-intro", "finance-options", "trade-in-support", "lead-form", "faq"],
      ["Apply for Financing", "Value Your Trade"],
      ["finance", "payment", "credit"],
      [
        "Emphasize finance confidence and support over generic contact copy.",
        "Keep trade-in and payment pathways adjacent to finance CTAs.",
      ],
    ),
    contact: createDefaultPageSchema(
      "contact",
      ["contact-hero", "hours-directions", "team-help", "contact-cta"],
      ["Get Directions", "Contact Us"],
      ["contact", "hours", "directions"],
      [
        "Contact pages should prioritize location, hours, and immediate dealership help.",
      ],
    ),
    about: createDefaultPageSchema(
      "about",
      ["story", "dealer-differentiators", "team-trust", "cta"],
      ["Contact Us", config.ctaText],
      ["about", "dealership", "team"],
      [
        "About pages should still feel like dealership pages, not agency storytelling pages.",
      ],
    ),
  };

  return {
    name: `${config.name} OEM Pack`,
    tokens: {
      bgPrimary: "#f7f7f8",
      bgSurface: "#ffffff",
      textPrimary: config.secondary,
      textSecondary: "#4b5563",
      brandPrimary: config.primary,
      brandAccent: config.accent,
      borderSubtle: "rgba(17, 24, 39, 0.08)",
      trust: "#0f9d58",
    },
    voice: [
      config.profile.tone,
      config.profile.designDirection,
    ],
    globalRules: sharedAutomotiveRules,
    mobileRules: sharedMobileRules,
    antiPatterns: [
      ...config.profile.avoid,
      "Do not generate a generic landing page that could belong to any industry.",
      "Do not let merchandising or CTA styling drift away from dealership expectations.",
    ],
    improvementRules: config.profile.improve,
    pageSchemas: defaultSchemas,
    verificationRules: [
      "Must include a clear H1 and an above-the-fold CTA.",
      "Must feel like a dealership page for the detected page type.",
      "Must use OEM color tokens and avoid generic SaaS or luxury drift.",
    ],
    ...overrides,
  };
}

const toyotaOemPack: OemPack = {
  name: "Toyota OEM Pack",
  tokens: {
    bgPrimary: "#f6f6f7",
    bgSurface: "#ffffff",
    textPrimary: "#111827",
    textSecondary: "#4b5563",
    brandPrimary: "#EB0A1E",
    brandAccent: "#EB0A1E",
    borderSubtle: "rgba(17, 24, 39, 0.08)",
    trust: "#0f9d58",
  },
  voice: [
    "Dependable, practical, efficient, broad-market, offer-aware.",
    "Toyota pages should feel like high-volume retail dealership pages, not luxury editorials.",
  ],
  globalRules: [
    ...sharedAutomotiveRules,
    "Use a Toyota dealership header/navigation pattern with high-clarity inventory and service pathways.",
    "Use Toyota red decisively for primary CTA moments, not as constant decoration.",
    "Favor clean white/light surfaces with dark text and retail-strong content blocks.",
    "Keep specials, service, and finance content conversion-oriented and operationally clear.",
  ],
  mobileRules: [
    ...sharedMobileRules,
    "Ensure the main CTA and quick actions remain visible early on mobile Toyota pages.",
    "Use compact dealership-friendly stacking rather than wide editorial spacing on small screens.",
  ],
  antiPatterns: [
    "No gradient-blob hero layouts.",
    "No generic SaaS dashboards, glassmorphism, or product-marketing metaphors.",
    "No luxury/editorial drift with oversized whitespace and weak action placement.",
    "No hiding service specials or finance actions behind abstract content blocks.",
    "No generic AI page sections that ignore dealership utility paths.",
  ],
  improvementRules: [
    "Use cleaner spacing and stronger section rhythm than the source page.",
    "Strengthen CTA hierarchy without losing Toyota dealership familiarity.",
    "Keep trust, reviews, hours, and service ownership messaging close to decision points.",
    "Improve mobile scannability and card structure while preserving Toyota retail clarity.",
  ],
  pageSchemas: {
    homepage: {
      pageType: "homepage",
      sectionOrder: ["hero", "quick-actions", "inventory-paths", "specials-strip", "why-choose-us", "reviews", "service-retention-cta"],
      primaryCtas: ["Check Availability", "Schedule Service"],
      requiredKeywords: ["inventory", "service", "specials", "reviews"],
      requiredElements: ["Hero with dealership CTA", "Quick action tiles", "Trust/review section"],
      compositionNotes: [
        "Use a dealership-native hero with inventory, service, and specials pathways visible early.",
        "Below the hero, prioritize actionable dealership utilities before brand-story content.",
      ],
      avoid: ["Do not use a SaaS split hero.", "Do not bury service or specials below decorative sections."],
    },
    service: {
      pageType: "service",
      sectionOrder: ["utility-intro", "appointment-cta", "service-menu", "why-service-here", "amenities-hours", "booking-strip"],
      primaryCtas: ["Schedule Service", "Contact Service"],
      requiredKeywords: ["service", "maintenance", "appointment", "hours"],
      requiredElements: ["Immediate service CTA", "Service menu or offer stack", "Hours/contact support"],
      compositionNotes: [
        "Service pages should feel operational, trustworthy, and easy to book from.",
        "Keep amenities and contact information near the booking path.",
      ],
      avoid: ["Do not render service content as inventory cards.", "Do not over-style the page like a luxury brochure."],
    },
    specials: {
      pageType: "specials",
      sectionOrder: ["breadcrumb", "offer-intro", "offer-stack", "service-cta", "questions-help", "ownership-support", "bottom-cta"],
      primaryCtas: ["Avail Your Offer", "Schedule Service"],
      requiredKeywords: ["special", "offer", "coupon", "service"],
      requiredElements: ["Strong H1", "Offer stack or promo card", "Visible service CTA"],
      compositionNotes: [
        "Offer presentation should be bold, retail-clear, and immediately actionable.",
        "Pair every specials layout with a visible service-retention CTA.",
      ],
      avoid: ["Do not make specials pages look like generic announcement pages.", "Do not omit service or dealership-help context."],
    },
    financing: {
      pageType: "financing",
      sectionOrder: ["confidence-intro", "finance-options", "trade-in-support", "lead-form", "faq-trust"],
      primaryCtas: ["Apply for Financing", "Value Your Trade"],
      requiredKeywords: ["finance", "payment", "credit", "trade"],
      requiredElements: ["Finance CTA", "Payment or trade-in support section", "Trust/FAQ block"],
      compositionNotes: [
        "Finance pages should emphasize confidence, payment guidance, and trade-in support.",
        "Keep finance assistance and lead capture adjacent, not far apart.",
      ],
      avoid: ["Do not reuse contact-page layouts for finance pages.", "Do not bury finance CTAs under generic text walls."],
    },
    contact: {
      pageType: "contact",
      sectionOrder: ["contact-intro", "hours-directions", "team-help", "contact-actions"],
      primaryCtas: ["Get Directions", "Contact Us"],
      requiredKeywords: ["contact", "hours", "directions", "dealership"],
      requiredElements: ["Hours", "Directions", "Primary contact CTA"],
      compositionNotes: [
        "Contact pages should emphasize hours, location, and dealership help first.",
      ],
      avoid: ["Do not make contact feel like a generic lead-gen landing page."],
    },
    about: {
      pageType: "about",
      sectionOrder: ["story-intro", "dealer-differentiators", "trust-block", "contact-cta"],
      primaryCtas: ["Contact Us", "Check Availability"],
      requiredKeywords: ["about", "dealership", "team", "service"],
      requiredElements: ["Dealer story", "Trust/differentiator block", "CTA"],
      compositionNotes: [
        "About pages should still support dealership trust and action, not just history.",
      ],
      avoid: ["Do not turn Toyota about pages into agency-style storytelling spreads."],
    },
  },
  verificationRules: [
    "Generated HTML must expose Toyota red via root CSS token or explicit Toyota primary color.",
    "Specials and service pages must include a visible dealership CTA above the fold.",
    "Homepage/service/finance output must not drift into SaaS or luxury composition.",
    "The rendered page should match the Toyota page schema's required keywords and section intent.",
  ],
};

const brandBase = {
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
} satisfies Record<string, Omit<BrandConfig, "oemPack">>;

export const brands: Record<string, BrandConfig> = Object.fromEntries(
  Object.entries(brandBase).map(([key, config]) => [
    key,
    {
      ...config,
      oemPack: key === "toyota" ? toyotaOemPack : createDefaultOemPack(config),
    },
  ]),
) as Record<string, BrandConfig>;

export const brandKeys = Object.keys(brands);

export function getBrandPageSchema(brand: BrandConfig | undefined, pageType?: string) {
  if (!brand || !pageType) {
    return undefined;
  }

  return brand.oemPack.pageSchemas[pageType as DiscoveryPageType];
}
