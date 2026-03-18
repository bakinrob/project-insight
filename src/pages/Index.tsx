import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import UrlInput from "@/components/UrlInput";
import ScrapeProgress, { type PageJob } from "@/components/ScrapeProgress";
import PagePreview from "@/components/PagePreview";
import { firecrawlApi } from "@/lib/api/firecrawl";
import { brands } from "@/lib/brands";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Car } from "lucide-react";

const Index = () => {
  const [jobs, setJobs] = useState<PageJob[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const updateJob = useCallback(
    (url: string, updates: Partial<PageJob>) => {
      setJobs((prev) =>
        prev.map((j) => (j.url === url ? { ...j, ...updates } : j))
      );
    },
    []
  );

  const processUrls = async (urls: string[], brandKey: string) => {
    const brand = brands[brandKey];
    if (!brand) return;

    setIsProcessing(true);
    setJobs(urls.map((url) => ({ url, status: "pending" })));

    for (const url of urls) {
      // Step 1: Scrape
      updateJob(url, { status: "scraping" });
      try {
        const scrapeResult = await firecrawlApi.scrape(url);

        if (!scrapeResult.success) {
          updateJob(url, { status: "error", error: scrapeResult.error || "Scraping failed" });
          continue;
        }

        const markdown = scrapeResult.data?.markdown || scrapeResult.data?.data?.markdown || "";
        const metadata = scrapeResult.data?.metadata || scrapeResult.data?.data?.metadata || {};

        updateJob(url, {
          status: "scraped",
          scrapedContent: markdown,
          scrapedMeta: { title: metadata.title, description: metadata.description },
        });

        // Step 2: Generate
        updateJob(url, { status: "generating" });

        const { data: genData, error: genError } = await supabase.functions.invoke(
          "generate-dealer-page",
          {
            body: {
              scrapedContent: markdown,
              metadata: { title: metadata.title, description: metadata.description, sourceUrl: url },
              brand: {
                name: brand.name,
                tier: brand.tier,
                primary: brand.primary,
                secondary: brand.secondary,
                accent: brand.accent,
                fontHeading: brand.fontHeading,
                fontBody: brand.fontBody,
                ctaStyle: brand.ctaStyle,
                ctaText: brand.ctaText,
                cardDensity: brand.cardDensity,
                borderRadius: brand.borderRadius,
              },
            },
          }
        );

        if (genError) {
          updateJob(url, { status: "error", error: genError.message });
          continue;
        }

        updateJob(url, {
          status: "done",
          generatedCode: genData?.generatedCode || genData?.code || "",
        });
      } catch (err: any) {
        updateJob(url, { status: "error", error: err.message || "Unknown error" });
        toast.error(`Failed: ${url}`);
      }
    }

    setIsProcessing(false);
    const doneCount = urls.length;
    toast.success(`Processed ${doneCount} page${doneCount !== 1 ? "s" : ""}`);
  };

  const hasResults = jobs.some((j) => j.status === "done");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Car className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground tracking-tight">
              DealerForge
            </h1>
            <p className="text-xs text-muted-foreground">
              AI-Powered Dealership Website Migration
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-[420px_1fr] gap-8">
          {/* Left panel — Input */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="text-base font-semibold text-foreground mb-4">
                Migration Input
              </h2>
              <UrlInput onSubmit={processUrls} isProcessing={isProcessing} />
            </div>

            {jobs.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-6">
                <ScrapeProgress jobs={jobs} />
              </div>
            )}
          </motion.div>

          {/* Right panel — Preview */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            {hasResults ? (
              <PagePreview jobs={jobs} />
            ) : (
              <div className="rounded-xl border border-border bg-card flex flex-col items-center justify-center min-h-[400px] text-center p-8">
                <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
                  <Car className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-foreground font-semibold mb-1">
                  No pages generated yet
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Paste dealership URLs, select an OEM brand, and hit Generate.
                  The AI will scrape each page and rebuild it in your brand's
                  design system.
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Index;
