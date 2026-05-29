-- MAGNIFIED EXISTENCE OS - SESSIONS FIX
-- Run this in your Supabase SQL Editor

-- 1. Add the missing is_published column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sessions' AND column_name='is_published') THEN
        ALTER TABLE sessions ADD COLUMN is_published BOOLEAN DEFAULT true;
    END IF;
END $$;

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Admins have full access to sessions" ON sessions;
DROP POLICY IF EXISTS "Users can view published sessions" ON sessions;

-- 3. Recreate the policies
-- Admins: Full Access
CREATE POLICY "Admins have full access to sessions"
  ON sessions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Users: View Published Sessions
CREATE POLICY "Users can view published sessions"
  ON sessions FOR SELECT
  TO authenticated
  USING (is_published = true);
