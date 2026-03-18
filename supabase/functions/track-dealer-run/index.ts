import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function getSupabaseAdmin() {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !key) {
    throw new Error("Supabase admin environment is not configured");
  }

  return createClient(url, key, { auth: { persistSession: false } });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = getSupabaseAdmin();
    const {
      action,
      runId,
      pageUrl,
      approvedUrls,
      runStatus,
      pageStatus,
      error,
      scrapedMeta,
      structuredData,
      generatedCode,
      generatedNotes,
      selected,
      pageType,
      confidence,
      recommended,
      summary,
    } = await req.json();

    if (action === "create_manual_run") {
      const inputUrls = Array.isArray(approvedUrls) ? approvedUrls : [];
      const insert = await supabase
        .from("dealer_migration_runs")
        .insert({
          mode: "manual_urls",
          brand_key: summary?.brandKey || "unknown",
          status: runStatus || "approved",
          input_urls: inputUrls,
          approved_urls: inputUrls,
          summary: summary || {},
        })
        .select("id")
        .single();

      if (insert.error || !insert.data) {
        throw insert.error || new Error("Failed to create manual run");
      }

      const rows = inputUrls.map((url: string) => ({
        run_id: insert.data.id,
        url,
        normalized_url: url,
        source: "manual",
        selected: true,
        recommended: true,
        status: "approved",
      }));

      if (rows.length > 0) {
        await supabase.from("dealer_migration_pages").insert(rows);
      }

      return new Response(JSON.stringify({ success: true, runId: insert.data.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!runId) {
      return new Response(JSON.stringify({ error: "runId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "update_run") {
      const runUpdate: Record<string, unknown> = {};
      if (runStatus) runUpdate.status = runStatus;
      if (summary) runUpdate.summary = summary;

      const updatedRun = await supabase.from("dealer_migration_runs").update(runUpdate).eq("id", runId);
      if (updatedRun.error) {
        throw updatedRun.error;
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "approve_pages") {
      if (!Array.isArray(approvedUrls)) {
        return new Response(JSON.stringify({ error: "approvedUrls is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await supabase.from("dealer_migration_runs").update({
        approved_urls: approvedUrls,
        status: runStatus || "approved",
      }).eq("id", runId);

      await supabase
        .from("dealer_migration_pages")
        .update({ selected: false })
        .eq("run_id", runId);

      if (approvedUrls.length > 0) {
        await supabase
          .from("dealer_migration_pages")
          .update({ selected: true, status: "approved" })
          .eq("run_id", runId)
          .in("normalized_url", approvedUrls);
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!pageUrl) {
      return new Response(JSON.stringify({ error: "pageUrl is required for page updates" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const updatePayload: Record<string, unknown> = {};
    if (pageStatus) updatePayload.status = pageStatus;
    if (error !== undefined) updatePayload.error = error;
    if (scrapedMeta !== undefined) updatePayload.scraped_meta = scrapedMeta;
    if (structuredData !== undefined) updatePayload.structured_data = structuredData;
    if (generatedCode !== undefined) updatePayload.generated_code = generatedCode;
    if (generatedNotes !== undefined) updatePayload.generated_notes = generatedNotes;
    if (selected !== undefined) updatePayload.selected = selected;
    if (pageType !== undefined) updatePayload.page_type = pageType;
    if (confidence !== undefined) updatePayload.confidence = confidence;
    if (recommended !== undefined) updatePayload.recommended = recommended;

    const pageUpdate = await supabase
      .from("dealer_migration_pages")
      .update(updatePayload)
      .eq("run_id", runId)
      .eq("normalized_url", pageUrl);

    if (pageUpdate.error) {
      throw pageUpdate.error;
    }

    if (runStatus || summary) {
      const runUpdate: Record<string, unknown> = {};
      if (runStatus) runUpdate.status = runStatus;
      if (summary) runUpdate.summary = summary;
      const updatedRun = await supabase.from("dealer_migration_runs").update(runUpdate).eq("id", runId);
      if (updatedRun.error) {
        throw updatedRun.error;
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Track run error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to track run" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
