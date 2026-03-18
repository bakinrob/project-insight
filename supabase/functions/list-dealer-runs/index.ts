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
    const { runId, limit = 20 } = req.method === "POST" ? await req.json() : {};

    if (runId) {
      const runResponse = await supabase
        .from("dealer_migration_runs")
        .select("*")
        .eq("id", runId)
        .single();

      if (runResponse.error) {
        throw runResponse.error;
      }

      const pagesResponse = await supabase
        .from("dealer_migration_pages")
        .select("*")
        .eq("run_id", runId)
        .order("created_at", { ascending: true });

      if (pagesResponse.error) {
        throw pagesResponse.error;
      }

      return new Response(
        JSON.stringify({
          run: runResponse.data,
          pages: pagesResponse.data,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const runsResponse = await supabase
      .from("dealer_migration_runs")
      .select("id, mode, brand_key, seed_url, site_domain, site_title, status, approved_urls, summary, metadata, created_at, updated_at")
      .order("updated_at", { ascending: false })
      .limit(limit);

    if (runsResponse.error) {
      throw runsResponse.error;
    }

    const runs = runsResponse.data || [];
    const runIds = runs.map((run) => run.id);

    let countsByRun: Record<string, { total: number; completed: number; failed: number }> = {};
    if (runIds.length > 0) {
      const pagesResponse = await supabase
        .from("dealer_migration_pages")
        .select("run_id, status")
        .in("run_id", runIds);

      if (pagesResponse.error) {
        throw pagesResponse.error;
      }

      countsByRun = (pagesResponse.data || []).reduce((acc, page) => {
        const current = acc[page.run_id] || { total: 0, completed: 0, failed: 0 };
        current.total += 1;
        if (page.status === "completed") current.completed += 1;
        if (page.status === "failed") current.failed += 1;
        acc[page.run_id] = current;
        return acc;
      }, {} as Record<string, { total: number; completed: number; failed: number }>);
    }

    return new Response(
      JSON.stringify({
        runs: runs.map((run) => ({
          ...run,
          counts: countsByRun[run.id] || { total: 0, completed: 0, failed: 0 },
        })),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("List dealer runs error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to list runs" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
