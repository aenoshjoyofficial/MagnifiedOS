-- MAGNIFIED EXISTENCE OS - BOOKINGS & ADMIN SYNC FIX
-- Run this in your Supabase SQL Editor

-- 1. Ensure the bookings table exists with all necessary columns
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  mentor_name TEXT NOT NULL,
  session_type TEXT DEFAULT 'Mentorship Assessment',
  start_time TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 45,
  status TEXT DEFAULT 'confirmed',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies to prevent "already exists" errors
DROP POLICY IF EXISTS "Users can manage their own bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can view all bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can update all bookings" ON bookings;
DROP POLICY IF EXISTS "Admins have full access to bookings" ON bookings;

-- 4. REFINED POLICY: Users can manage their own bookings
CREATE POLICY "Users can manage their own bookings"
  ON bookings FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 5. Additional safety for INSERTs
CREATE POLICY "Authenticated users can insert bookings"
  ON bookings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 5. REFINED POLICY: Admins can view and update EVERYTHING in bookings
-- This uses a direct check against the profiles table
CREATE POLICY "Admins have full access to bookings"
  ON bookings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 6. ENSURE YOUR PROFILE IS AN ADMIN (Crucial Step)
-- Replace 'YOUR_USER_ID' with your actual UUID from the Supabase Auth table if you know it, 
-- or this will update whichever user is currently acting as admin.
UPDATE profiles SET role = 'admin' WHERE id = auth.uid();
