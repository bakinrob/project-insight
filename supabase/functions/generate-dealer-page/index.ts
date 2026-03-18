import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an expert React/Tailwind CSS developer specializing in automotive dealership websites. You generate production-quality HTML with Tailwind CSS classes.

Design rules:
- Use semantic HTML5 only.
- Return only raw HTML body markup. No markdown fences.
- Adapt layout to page type.
- Preserve the original SEO hierarchy and meaning.
- Use the real images/content supplied.
- Keep mainstream brands efficient and conversion-focused.
- Keep luxury brands spacious and refined.
- Every page needs a clear CTA above the fold.
- Service/contact/about/financing pages should not be rendered like inventory pages.
- Use inline CSS variables for brand colors when helpful.
- Follow OEM guidance when provided, while improving clarity and polish.
`;

function buildUserPrompt(input: {
  brand: Record<string, string>;
  metadata?: Record<string, string>;
  structuredPage?: Record<string, unknown>;
  scrapedContent?: string;
  pageTypeHint?: string;
}) {
  return `Generate a premium dealership page.

Brand configuration:
${JSON.stringify(input.brand, null, 2)}

Metadata:
${JSON.stringify(input.metadata || {}, null, 2)}

Page type hint:
${input.pageTypeHint || input.structuredPage?.pageType || "unknown"}

Structured page data:
${JSON.stringify(input.structuredPage || {}, null, 2)}

Raw scraped content:
${input.scrapedContent || ""}

Output requirements:
- Return only raw HTML markup with Tailwind classes.
- Keep the page specific to the detected page type.
- Preserve H1/H2 meaning and SEO intent.
- Reuse original image URLs.
- Use a dealership-grade layout, not a generic SaaS layout.
- If the page is not inventory-focused, avoid inventory-card-heavy composition.
- Use the OEM profile inside the brand configuration as guidance for tone, design direction, priorities, and avoid/improve rules.
- Improve the source page rather than copying its weaknesses.`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { scrapedContent, metadata, brand, structuredPage, pageTypeHint } = await req.json();

    if (!brand || (!scrapedContent && !structuredPage)) {
      return new Response(
        JSON.stringify({ error: "brand and either scrapedContent or structuredPage are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: buildUserPrompt({ brand, metadata, structuredPage, scrapedContent, pageTypeHint }),
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return new Response(
        JSON.stringify({ error: `AI generation failed (${response.status})` }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await response.json();
    let generatedCode = data.choices?.[0]?.message?.content || "";
    generatedCode = generatedCode.replace(/^```html?\n?/i, "").replace(/\n?```$/i, "").trim();

    return new Response(JSON.stringify({ generatedCode }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating page:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to generate page" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
