import { supabase } from '@/integrations/supabase/client';

type FirecrawlResponse<T = any> = {
  success: boolean;
  error?: string;
  data?: T;
};

export const firecrawlApi = {
  async scrape(url: string): Promise<FirecrawlResponse> {
    const { data, error } = await supabase.functions.invoke('firecrawl-scrape', {
      body: {
        url,
        options: {
          formats: ['markdown', 'links', 'screenshot'],
          onlyMainContent: true,
        },
      },
    });

    if (error) return { success: false, error: error.message };
    return data;
  },
};
