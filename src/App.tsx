import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DealerRunProvider } from "@/context/DealerRunContext";
import Index from "./pages/Index.tsx";
import GeneratedPageRoute from "./pages/GeneratedPageRoute.tsx";
import GeneratedWorkspace from "./pages/GeneratedWorkspace.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <DealerRunProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/generated" element={<GeneratedWorkspace />} />
            <Route path="/runs/:runId/generated/:pageKey" element={<GeneratedPageRoute />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </DealerRunProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
