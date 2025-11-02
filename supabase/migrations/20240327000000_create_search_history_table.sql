-- Create search_history table to track user search records
CREATE TABLE IF NOT EXISTS public.search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  search_type TEXT NOT NULL CHECK (search_type IN ('famous_person_search', 'pronunciation_search', 'other')),
  search_query TEXT NOT NULL,
  search_results JSONB NOT NULL DEFAULT '{}'::jsonb,
  search_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON public.search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_customer_id ON public.search_history(customer_id);
CREATE INDEX IF NOT EXISTS idx_search_history_search_type ON public.search_history(search_type);
CREATE INDEX IF NOT EXISTS idx_search_history_search_date ON public.search_history(search_date DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own search history" 
  ON public.search_history 
  FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own search history" 
  ON public.search_history 
  FOR INSERT 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own search history" 
  ON public.search_history 
  FOR DELETE 
  USING (user_id = auth.uid());

CREATE POLICY "Service role can manage search history" 
  ON public.search_history 
  FOR ALL 
  USING (auth.role() = 'service_role');

-- Grant necessary permissions
GRANT ALL ON public.search_history TO service_role;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Successfully created search_history table with indexes and RLS policies!';
END $$;