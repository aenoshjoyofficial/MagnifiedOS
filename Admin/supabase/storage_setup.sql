-- MAGNIFIED EXISTENCE OS - STORAGE SETUP
-- Run this in your Supabase SQL Editor

-- 1. Create the bucket for program assets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('program-assets', 'program-assets', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Set up RLS for the bucket
-- Drop existing policies if they exist to avoid errors
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Admin Full Access" ON storage.objects;

-- Allow public access to view assets (Critical for the member app)
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
TO public 
USING (bucket_id = 'program-assets');

-- Allow Admins to upload/update/delete anything in the bucket
CREATE POLICY "Admin Full Access" 
ON storage.objects FOR ALL 
TO authenticated 
USING (
  bucket_id = 'program-assets' AND 
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);
