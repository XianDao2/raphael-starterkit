-- Create table for storing avatar generation history
CREATE TABLE IF NOT EXISTS public.avatar_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  avatar_url TEXT NOT NULL,
  generation_params JSONB NOT NULL,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups by user_id
CREATE INDEX IF NOT EXISTS idx_avatar_generations_user_id ON public.avatar_generations(user_id);

-- Create index for faster lookups by customer_id
CREATE INDEX IF NOT EXISTS idx_avatar_generations_customer_id ON public.avatar_generations(customer_id);

-- Create index for sorting by creation time
CREATE INDEX IF NOT EXISTS idx_avatar_generations_created_at ON public.avatar_generations(created_at DESC);

-- Add RLS policy to allow users to only access their own avatar generations
ALTER TABLE public.avatar_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only view their own avatar generations" 
  ON public.avatar_generations 
  FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own avatar generations" 
  ON public.avatar_generations 
  FOR INSERT 
  WITH CHECK (user_id = auth.uid());

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_avatar_generation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to use the function
CREATE TRIGGER update_avatar_generation_updated_at
BEFORE UPDATE ON public.avatar_generations
FOR EACH ROW
EXECUTE PROCEDURE update_avatar_generation_timestamp();