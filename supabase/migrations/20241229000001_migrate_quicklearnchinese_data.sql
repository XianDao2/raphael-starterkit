-- Migration script to merge QuickLearnChinese data structure with Starter Kit
-- This script handles the transition from user_credits/credit_transactions to customers/credits_history

-- Step 1: Create temporary tables if they exist in the old ChineseName database
-- Note: These CREATE statements will fail silently if tables don't exist

-- Create user_credits table structure (in case it needs to be recreated)
CREATE TABLE IF NOT EXISTS public.user_credits (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    total_credits integer DEFAULT 0 NOT NULL,
    remaining_credits integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create credit_transactions table structure (in case it needs to be recreated)
CREATE TABLE IF NOT EXISTS public.credit_transactions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    amount integer NOT NULL,
    transaction_type text NOT NULL,
    operation text DEFAULT 'name_generation',
    remaining_credits integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Step 2: Create a function to safely migrate user credits data
CREATE OR REPLACE FUNCTION migrate_chinesename_credits()
RETURNS void AS $$
BEGIN
    -- Check if user_credits table exists and has data
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_credits'
    ) THEN
        -- Migrate user_credits to customers table
        INSERT INTO public.customers (
            user_id, 
            email, 
            credits, 
            creem_customer_id,
            created_at, 
            updated_at,
            metadata
        )
        SELECT 
            uc.user_id,
            COALESCE(au.email, 'unknown@example.com'),
            COALESCE(uc.remaining_credits, 0),
            'migrated_' || uc.user_id::text, -- Temporary creem_customer_id
            uc.created_at,
            uc.updated_at,
            jsonb_build_object(
                'migrated_from', 'chinesename',
                'original_total_credits', uc.total_credits,
                'migration_date', now()
            )
        FROM user_credits uc
        LEFT JOIN auth.users au ON uc.user_id = au.id
        ON CONFLICT (user_id) DO UPDATE SET
            credits = EXCLUDED.credits,
            updated_at = EXCLUDED.updated_at,
            metadata = customers.metadata || EXCLUDED.metadata;

        RAISE NOTICE 'Migrated % user credit records', (SELECT COUNT(*) FROM user_credits);
    END IF;

    -- Check if credit_transactions table exists and has data
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'credit_transactions'
    ) THEN
        -- Migrate credit_transactions to credits_history
        INSERT INTO public.credits_history (
            customer_id,
            amount,
            type,
            description,
            created_at,
            metadata
        )
        SELECT 
            c.id,
            ABS(ct.amount),
            CASE 
                WHEN ct.amount < 0 OR ct.transaction_type = 'spend' THEN 'subtract'
                ELSE 'add'
            END,
            COALESCE(ct.operation, 'migrated_transaction'),
            ct.created_at,
            jsonb_build_object(
                'migrated_from', 'chinesename',
                'original_transaction_type', ct.transaction_type,
                'original_amount', ct.amount,
                'remaining_credits_at_time', ct.remaining_credits
            )
        FROM credit_transactions ct
        INNER JOIN customers c ON ct.user_id = c.user_id
        ON CONFLICT DO NOTHING;

        RAISE NOTICE 'Migrated % credit transaction records', (SELECT COUNT(*) FROM credit_transactions);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Execute the migration
SELECT migrate_chinesename_credits();

-- Step 4: Create indexes for performance (if they don't already exist)
CREATE INDEX IF NOT EXISTS user_credits_user_id_idx ON public.user_credits(user_id);
CREATE INDEX IF NOT EXISTS credit_transactions_user_id_idx ON public.credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS credit_transactions_created_at_idx ON public.credit_transactions(created_at);

-- Step 5: Add a flag to track migration status
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS migration_status text DEFAULT 'native';

-- Update migrated records
UPDATE public.customers 
SET migration_status = 'migrated_from_chinesename' 
WHERE creem_customer_id LIKE 'migrated_%';

-- Step 6: Create a view for backward compatibility (optional)
CREATE OR REPLACE VIEW public.user_credits_compat AS
SELECT 
    gen_random_uuid() as id,
    user_id,
    credits as total_credits,
    credits as remaining_credits,
    created_at,
    updated_at
FROM public.customers
WHERE migration_status = 'migrated_from_chinesename';

-- Step 7: Grant necessary permissions
GRANT SELECT ON public.user_credits_compat TO authenticated;
GRANT ALL ON public.user_credits TO service_role;
GRANT ALL ON public.credit_transactions TO service_role;

-- Step 8: Add RLS policies for migrated tables
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- Policies for user_credits
CREATE POLICY IF NOT EXISTS "Users can view their own credits" 
ON public.user_credits FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Service role can manage user credits" 
ON public.user_credits FOR ALL 
USING (auth.role() = 'service_role');

-- Policies for credit_transactions
CREATE POLICY IF NOT EXISTS "Users can view their own transactions" 
ON public.credit_transactions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Service role can manage credit transactions" 
ON public.credit_transactions FOR ALL 
USING (auth.role() = 'service_role');

-- Step 9: Clean up function (optional - remove after successful migration)
-- DROP FUNCTION IF EXISTS migrate_chinesename_credits();

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'QuickLearnChinese data migration completed successfully!';
    RAISE NOTICE 'Old tables (user_credits, credit_transactions) are preserved for backup.';
    RAISE NOTICE 'New unified system uses customers and credits_history tables.';
END $$;