import { motion } from "framer-motion";
import { CheckCircle2, Loader2, AlertCircle, Globe, Cpu } from "lucide-react";

export type PageStatus = "pending" | "scraping" | "scraped" | "generating" | "done" | "error";

export interface PageJob {
  url: string;
  status: PageStatus;
  scrapedContent?: string;
  scrapedMeta?: { title?: string; description?: string };
  generatedCode?: string;
  error?: string;
}

interface ScrapeProgressProps {
  jobs: PageJob[];
}

const statusConfig: Record<PageStatus, { icon: React.ReactNode; label: string; color: string }> = {
  pending: { icon: <Globe className="w-4 h-4" />, label: "Queued", color: "text-muted-foreground" },
  scraping: { icon: <Loader2 className="w-4 h-4 animate-spin" />, label: "Scraping…", color: "text-primary" },
  scraped: { icon: <CheckCircle2 className="w-4 h-4" />, label: "Scraped", color: "text-primary" },
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
        <motion.div
          className="h-full bg-primary rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>

      <div className="space-y-1.5 max-h-[240px] overflow-y-auto">
        {jobs.map((job, i) => {
          const cfg = statusConfig[job.status];
          return (
            <motion.div
              key={job.url}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 px-3 py-2 rounded-md bg-secondary/50 text-sm"
            >
              <span className={cfg.color}>{cfg.icon}</span>
              <span className="truncate flex-1 font-mono text-xs text-foreground">
                {job.url}
              </span>
              <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default ScrapeProgress;
