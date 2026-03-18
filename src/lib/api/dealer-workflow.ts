import { supabase } from "@/integrations/supabase/client";
import type {
  DiscoveryResult,
  RunSummary,
  StructuredPageData,
} from "@/lib/dealer-workflow";

export const dealerWorkflowApi = {
  async discover(seedUrl: string, brandKey: string) {
    const { data, error } = await supabase.functions.invoke("discover-dealer-site", {
      body: {
        seedUrl,
        brandKey,
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    return data as DiscoveryResult;
  },

  async createManualRun(urls: string[], brandKey: string, summary?: RunSummary) {
    const { data, error } = await supabase.functions.invoke("track-dealer-run", {
      body: {
        action: "create_manual_run",
        approvedUrls: urls,
        summary: {
          brandKey,
          approvedCount: urls.length,
          totalDiscovered: urls.length,
          ...summary,
        },
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    return data as { success: boolean; runId?: string };
  },

  async approvePages(runId: string, approvedUrls: string[]) {
    const { error } = await supabase.functions.invoke("track-dealer-run", {
      body: {
        action: "approve_pages",
        runId,
        approvedUrls,
      },
    });

    if (error) {
      throw new Error(error.message);
    }
  },

  async updateRun(runId: string, runStatus?: string, summary?: RunSummary) {
    const { error } = await supabase.functions.invoke("track-dealer-run", {
      body: {
        action: "update_run",
        runId,
        runStatus,
        summary,
      },
    });

    if (error) {
      throw new Error(error.message);
    }
  },

  async updatePageStatus(input: {
    runId?: string | null;
    pageUrl: string;
    pageStatus?: string;
    runStatus?: string;
    error?: string | null;
    scrapedMeta?: Record<string, unknown>;
    structuredData?: StructuredPageData;
    generatedCode?: string;
    generatedNotes?: Record<string, unknown>;
    pageType?: string;
    confidence?: number;
    recommended?: boolean;
    summary?: RunSummary;
  }) {
    if (!input.runId) {
      return;
    }

    const { error } = await supabase.functions.invoke("track-dealer-run", {
      body: input,
    });

    if (error) {
      throw new Error(error.message);
    }
  },

  async structurePage(input: {
    scrapedContent: string;
    metadata?: Record<string, unknown>;
    brand: Record<string, unknown>;
    pageTypeHint?: string;
  }) {
    const { data, error } = await supabase.functions.invoke("structure-dealer-page", {
      body: input,
    });

    if (error) {
      throw new Error(error.message);
    }

    return data as { structuredData: StructuredPageData };
  },

  async generatePage(input: {
    scrapedContent: string;
    metadata?: Record<string, unknown>;
    brand: Record<string, unknown>;
    structuredPage?: StructuredPageData;
    pageTypeHint?: string;
  }) {
    const { data, error } = await supabase.functions.invoke("generate-dealer-page", {
      body: input,
    });

    if (error) {
      throw new Error(error.message);
    }

    return data as { generatedCode: string };
  },
};
