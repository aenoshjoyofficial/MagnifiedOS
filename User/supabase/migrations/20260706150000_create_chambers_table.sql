-- =========================================================================
-- Dynamic Chamber Navigation & Visibility System
-- =========================================================================

-- 1. Create the chambers table if not exists
CREATE TABLE IF NOT EXISTS public.chambers (
  id TEXT PRIMARY KEY, -- matching chamber slug key (e.g. 'breath-atelier')
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  visible BOOLEAN NOT NULL DEFAULT TRUE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  coming_soon BOOLEAN NOT NULL DEFAULT FALSE,
  premium_only BOOLEAN NOT NULL DEFAULT FALSE,
  color_accent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.chambers ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
-- Check policy existence to avoid errors when executed repeatedly
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'chambers' AND policyname = 'Allow select for all'
  ) THEN
    CREATE POLICY "Allow select for all" ON public.chambers FOR SELECT USING (TRUE);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'chambers' AND policyname = 'Allow all for admins'
  ) THEN
    CREATE POLICY "Allow all for admins" ON public.chambers FOR ALL TO authenticated USING (
      EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = auth.uid() 
        AND (auth.users.raw_user_meta_data->>'role') = 'admin'
      )
    );
  END IF;
END
$$;

-- 4. Seed default configuration for the 8 chambers (ONLY IF NOT EXISTS)
INSERT INTO public.chambers (id, slug, title, display_order, visible, active, coming_soon, premium_only, icon)
VALUES
  ('breath-atelier', 'breath-atelier', 'Breath Atelier', 1, TRUE, TRUE, FALSE, FALSE, 'Wind'),
  ('the-signature', 'the-signature', 'The Signature', 2, TRUE, TRUE, FALSE, FALSE, 'Award'),
  ('mental-clarity', 'mental-clarity', 'Mental Clarity', 3, TRUE, TRUE, FALSE, FALSE, 'Brain'),
  ('living-frame', 'living-frame', 'The Living Frame', 4, TRUE, TRUE, FALSE, FALSE, 'Grid'),
  ('the-plate', 'the-plate', 'The Plate', 5, TRUE, TRUE, FALSE, FALSE, 'Utensils'),
  ('sleep-cocoon', 'sleep-cocoon', 'Sleep Cocoon', 6, TRUE, TRUE, FALSE, FALSE, 'Moon'),
  ('field-design', 'field-design', 'Field Design', 7, FALSE, TRUE, FALSE, FALSE, 'Compass'),
  ('frequency-field', 'frequency-field', 'The Frequency Field', 8, FALSE, TRUE, FALSE, FALSE, 'Waves')
ON CONFLICT (id) DO NOTHING;
