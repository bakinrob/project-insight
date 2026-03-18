import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You structure dealership webpage content for migration.
Return JSON only.
Extract a clean page summary and classify the page into one of:
homepage, about, service, parts, financing, specials, contact, inventory_listing, vehicle_detail, model_landing, trade_in, scheduler_flow, legal, utility, unknown.

Respond with this JSON shape:
{
  "pageType": "service",
  "seo": {
    "title": "string",
    "description": "string"
  },
  "headings": {
    "h1": "string",
    "h2": ["string"]
  },
  "sections": [
    {
      "heading": "string",
      "content": "string"
    }
  ],
  "keyImages": [
    {
      "url": "string",
      "alt": "string"
    }
  ],
  "callToAction": "string",
  "summary": "string",
  "notes": ["string"]
}`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { scrapedContent, metadata, brand, pageTypeHint } = await req.json();

    if (!scrapedContent) {
      return new Response(JSON.stringify({ error: "scrapedContent is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Brand: ${brand?.name || "Unknown"}
Page type hint: ${pageTypeHint || "unknown"}
Source URL: ${metadata?.sourceUrl || ""}
Original title: ${metadata?.title || ""}
Original description: ${metadata?.description || ""}

Scraped content:
${scrapedContent}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Structure page error:", text);
      throw new Error(`Failed to structure page (${response.status})`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("No structured content returned");
    }

    const structuredData = JSON.parse(content);

    return new Response(JSON.stringify({ structuredData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error structuring page:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to structure page" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
