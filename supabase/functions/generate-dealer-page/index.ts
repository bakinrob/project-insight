import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SYSTEM_PROMPT = `You are an expert React/Tailwind CSS developer specializing in automotive dealership websites. You generate production-quality, responsive HTML with Tailwind CSS classes.

## Automotive Dealership Design Intelligence

### Inventory Card Anatomy
Every dealership page revolves around inventory cards. A great card has:
- Hero image (16:9, lazy-loaded, with badge overlays for "New", "Certified", "Sale")
- Year/Make/Model as the primary heading
- Price block: MSRP strikethrough + sale price in brand accent color
- Key specs row: mileage, transmission, drivetrain as pill badges
- CTA button: full-width, high-contrast

### Mainstream vs Luxury Tier Rules
**Mainstream (Honda, Toyota, Ford, Mitsubishi, Mazda, Chevrolet):**
- High card density: 3-4 per row on desktop
- Price-dominant layouts: sale price is the hero
- Aggressive CTAs
- Functional, clean, conversion-focused design
- Standard shadows, simple borders

**Luxury (BMW, Mercedes, Acura, Lexus):**
- Low card density: 2 per row, generous whitespace
- Image-dominant: large hero images, lifestyle photography
- Refined CTAs
- Subtle glassmorphism, gradient borders, fine typography
- Serif fonts for headings (Playfair Display)
- Muted palettes with gold/champagne accents

### Animation Patterns
- Fade-up on scroll for sections: opacity 0→1, y 20→0
- Card hover: translateY(-4px) + shadow elevation
- Image hover: scale(1.05) with overflow hidden
- Use CSS transitions, duration 300ms

### Surface & Effects
**Luxury only:** backdrop-blur, bg-white/5 borders, subtle glow shadows
**All tiers:** shadow-sm default, shadow-md hover, dark zinc-900 surfaces, gradient overlays on images

## Generation Rules

1. OUTPUT: Return ONLY the HTML body content with Tailwind CSS classes. No <html>, <head>, <body> tags. No markdown fences. Just raw HTML.
2. ADAPT TO CONTENT: Choose layout based on what the content actually is (service page, about page, inventory, etc.)
3. BRAND COMPLIANCE: Use the provided brand colors via inline styles. Use the specified fonts.
4. SEO: Preserve original title, headings hierarchy, and content from the scraped data.
5. RESPONSIVE: Mobile-first. Works 375px through 1440px.
6. IMAGES: Use original image URLs. Add loading="lazy".
7. CONVERSION: Clear CTA above the fold using the brand's CTA style.
8. NO PLACEHOLDER: Use actual scraped content only. Never use lorem ipsum.
9. TIER-APPROPRIATE: Apply luxury effects ONLY to luxury brands.
10. MODERN: Clean semantic HTML5 with Tailwind utility classes.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { scrapedContent, metadata, brand } = await req.json();

    if (!scrapedContent || !brand) {
      return new Response(
        JSON.stringify({ error: 'scrapedContent and brand are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const userPrompt = `Generate a premium dealership page for the following scraped content.

## Brand Configuration
- Name: ${brand.name}
- Tier: ${brand.tier}
- Primary Color: ${brand.primary}
- Secondary Color: ${brand.secondary}
- Accent Color: ${brand.accent}
- Heading Font: ${brand.fontHeading}
- Body Font: ${brand.fontBody}
- CTA Style: ${brand.ctaStyle}
- CTA Text: ${brand.ctaText}
- Card Density: ${brand.cardDensity}
- Border Radius: ${brand.borderRadius}

## Page Metadata
- Original Title: ${metadata?.title || 'Dealership Page'}
- Original Description: ${metadata?.description || ''}
- Source URL: ${metadata?.sourceUrl || ''}

## Scraped Content
${scrapedContent}

Generate a complete, beautiful page using this content. Apply the brand colors, fonts, and tier-appropriate design patterns. Return ONLY raw HTML with Tailwind classes.`;

    console.log('Generating page for:', metadata?.title || 'unknown page');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('AI gateway error:', response.status, errText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits in Settings → Workspace → Usage.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: `AI generation failed (${response.status})` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    let generatedCode = data.choices?.[0]?.message?.content || '';

    // Strip markdown code fences if present
    generatedCode = generatedCode.replace(/^```html?\n?/i, '').replace(/\n?```$/i, '').trim();

    console.log('Generation successful, code length:', generatedCode.length);

    return new Response(
      JSON.stringify({ generatedCode }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating page:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate page';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
