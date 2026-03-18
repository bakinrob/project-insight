export type BrandTier = "luxury" | "mainstream";

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
  },
};

export const brandKeys = Object.keys(brands);
