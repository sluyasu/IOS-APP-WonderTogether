-- Create wishlists table with Kadolog-style features & Payments
CREATE TABLE IF NOT EXISTS public.wishlists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    price TEXT, -- Display price (e.g. "50")
    url TEXT,
    image_url TEXT,
    
    -- Shopping Store & Crowdfund logic
    current_amount NUMERIC DEFAULT 0, -- Total contributed so far
    target_amount NUMERIC, -- Numeric target for progress bars
    is_crowdfund BOOLEAN DEFAULT false, -- @deprecated: use receiving_method='cash_fund' logic instead, but kept for safety
    category TEXT, -- "Honeymoon", "Home"
    
    -- Payment / Receiving Preferences
    receiving_method TEXT DEFAULT 'product' CHECK (receiving_method IN ('product', 'cash_fund')), 
    -- 'product' = Physical gift (Standard)
    -- 'cash_fund' = Asking for money (Crowdfund/Stripe/IBAN)
    
    iban TEXT, -- Optional: Stores IBAN for bank transfer mode
    currency TEXT DEFAULT 'EUR',

    priority INTEGER DEFAULT 1,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'granted', 'purchased', 'archived')),
    claimed_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create CONTRIBUTIONS table (Transaction Ledger)
CREATE TABLE IF NOT EXISTS public.contributions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wishlist_id UUID REFERENCES public.wishlists(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id), -- The contributor
    amount NUMERIC NOT NULL,
    currency TEXT DEFAULT 'EUR',
    payment_method TEXT CHECK (payment_method IN ('stripe', 'iban', 'cash')),
    stripe_payment_id TEXT, -- Store Stripe intent ID if applicable
    message TEXT, -- "Enjoy the spa!"
    status TEXT DEFAULT 'completed', -- 'pending' (for manual bank transfer) or 'completed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts when re-running
DROP POLICY IF EXISTS "Group members can view wishlists" ON public.wishlists;
DROP POLICY IF EXISTS "Group members can insert wishlists" ON public.wishlists;
DROP POLICY IF EXISTS "Group members can update wishlists" ON public.wishlists;
DROP POLICY IF EXISTS "Group members can delete wishlists" ON public.wishlists;

DROP POLICY IF EXISTS "Group members can view contributions" ON public.contributions;
DROP POLICY IF EXISTS "Group members can insert contributions" ON public.contributions;

-- Wishlist Policies
CREATE POLICY "Group members can view wishlists" ON public.wishlists
    FOR SELECT USING (auth.uid() IN (SELECT user_id FROM public.group_members WHERE group_id = wishlists.group_id));

CREATE POLICY "Group members can insert wishlists" ON public.wishlists
    FOR INSERT WITH CHECK (auth.uid() IN (SELECT user_id FROM public.group_members WHERE group_id = wishlists.group_id));

CREATE POLICY "Group members can update wishlists" ON public.wishlists
    FOR UPDATE USING (auth.uid() IN (SELECT user_id FROM public.group_members WHERE group_id = wishlists.group_id));

CREATE POLICY "Group members can delete wishlists" ON public.wishlists
    FOR DELETE USING (auth.uid() IN (SELECT user_id FROM public.group_members WHERE group_id = wishlists.group_id));

-- Contribution Policies
-- Members can view contributions for wishlists belonging to their group
CREATE POLICY "Group members can view contributions" ON public.contributions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.wishlists w
            JOIN public.group_members gm ON w.group_id = gm.group_id
            WHERE w.id = contributions.wishlist_id
            AND gm.user_id = auth.uid()
        )
    );

-- Members can insert contributions to wishlists in their group
CREATE POLICY "Group members can insert contributions" ON public.contributions
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.wishlists w
            JOIN public.group_members gm ON w.group_id = gm.group_id
            WHERE w.id = wishlist_id
            AND gm.user_id = auth.uid()
        )
    );

-- Realtime
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'wishlists') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.wishlists;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'contributions') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.contributions;
  END IF;
END $$;

-- Idempotent Column Additions (Safety check if table already existed)
DO $$
BEGIN
    -- Old Columns Safety Check
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wishlists' AND column_name = 'price') THEN
        ALTER TABLE public.wishlists ADD COLUMN price TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wishlists' AND column_name = 'description') THEN
        ALTER TABLE public.wishlists ADD COLUMN description TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wishlists' AND column_name = 'url') THEN
        ALTER TABLE public.wishlists ADD COLUMN url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wishlists' AND column_name = 'image_url') THEN
        ALTER TABLE public.wishlists ADD COLUMN image_url TEXT;
    END IF;

    -- Shopping Store & Crowdfund logic
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wishlists' AND column_name = 'current_amount') THEN
        ALTER TABLE public.wishlists ADD COLUMN current_amount NUMERIC DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wishlists' AND column_name = 'target_amount') THEN
        ALTER TABLE public.wishlists ADD COLUMN target_amount NUMERIC;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wishlists' AND column_name = 'is_crowdfund') THEN
        ALTER TABLE public.wishlists ADD COLUMN is_crowdfund BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wishlists' AND column_name = 'category') THEN
        ALTER TABLE public.wishlists ADD COLUMN category TEXT;
    END IF;
    
    -- NEW Payment Columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wishlists' AND column_name = 'receiving_method') THEN
        ALTER TABLE public.wishlists ADD COLUMN receiving_method TEXT DEFAULT 'product';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wishlists' AND column_name = 'iban') THEN
        ALTER TABLE public.wishlists ADD COLUMN iban TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wishlists' AND column_name = 'currency') THEN
        ALTER TABLE public.wishlists ADD COLUMN currency TEXT DEFAULT 'EUR';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wishlists' AND column_name = 'status') THEN
        ALTER TABLE public.wishlists ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'granted', 'purchased', 'archived'));
    END IF;
END $$;
