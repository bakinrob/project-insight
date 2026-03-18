import type { ReactNode } from "react";
import { CheckCircle2, Loader2, AlertCircle, Globe, Cpu, Compass, ListChecks } from "lucide-react";

export type PageStatus =
  | "pending"
  | "discovering"
  | "discovered"
  | "approved"
  | "scraping"
  | "scraped"
  | "structuring"
  | "structured"
  | "generating"
  | "done"
  | "error";

export interface PageJob {
  url: string;
  normalizedUrl?: string;
  status: PageStatus;
  scrapedContent?: string;
  scrapedMeta?: { title?: string; description?: string };
  pageType?: string;
  structuredData?: Record<string, unknown>;
  generatedCode?: string;
  error?: string;
}

interface ScrapeProgressProps {
  jobs: PageJob[];
}

const statusConfig: Record<PageStatus, { icon: ReactNode; label: string; color: string }> = {
  pending: { icon: <Globe className="w-4 h-4" />, label: "Queued", color: "text-muted-foreground" },
  discovering: { icon: <Compass className="w-4 h-4 animate-pulse" />, label: "Discovering…", color: "text-primary" },
  discovered: { icon: <CheckCircle2 className="w-4 h-4" />, label: "Discovered", color: "text-primary" },
  approved: { icon: <ListChecks className="w-4 h-4" />, label: "Approved", color: "text-primary" },
  scraping: { icon: <Loader2 className="w-4 h-4 animate-spin" />, label: "Scraping…", color: "text-primary" },
  scraped: { icon: <CheckCircle2 className="w-4 h-4" />, label: "Scraped", color: "text-primary" },
  structuring: { icon: <Cpu className="w-4 h-4 animate-pulse" />, label: "Structuring…", color: "text-primary" },
  structured: { icon: <CheckCircle2 className="w-4 h-4" />, label: "Structured", color: "text-primary" },
  generating: { icon: <Cpu className="w-4 h-4 animate-pulse" />, label: "Generating…", color: "text-primary" },
  done: { icon: <CheckCircle2 className="w-4 h-4" />, label: "Complete", color: "text-primary" },
  error: { icon: <AlertCircle className="w-4 h-4" />, label: "Failed", color: "text-destructive" },
};

const ScrapeProgress = ({ jobs }: ScrapeProgressProps) => {
  if (jobs.length === 0) return null;

  const completed = jobs.filter((j) => j.status === "done").length;
  const total = jobs.length;
  const pct = Math.round((completed / total) * 100);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Progress</span>
        <span className="font-mono text-foreground">
          {completed}/{total} — {pct}%
        </span>
      </div>

      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-[width] duration-300 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="space-y-1.5 max-h-[240px] overflow-y-auto">
        {jobs.map((job) => {
          const cfg = statusConfig[job.status];
          return (
            <div
              key={job.url}
              className="flex items-center gap-3 px-3 py-2 rounded-md bg-secondary/50 text-sm"
            >
              <span className={cfg.color}>{cfg.icon}</span>
              <span className="truncate flex-1 font-mono text-xs text-foreground">
                {job.url}
              </span>
              <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ScrapeProgress;
