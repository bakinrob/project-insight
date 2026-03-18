import PagePreview from "@/components/PagePreview";
import { useDealerRun } from "@/context/DealerRunContext";

export default function GeneratedWorkspace() {
  const { jobs, activeRunId } = useDealerRun();

  return <PagePreview jobs={jobs} activeRunId={activeRunId} />;
}
