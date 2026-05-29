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

-- 3. Create the bucket for user avatars
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Policies for avatars bucket

-- Drop existing policies to avoid conflict
DROP POLICY IF EXISTS "Public Avatar View" ON storage.objects;
DROP POLICY IF EXISTS "Users can manage own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage all avatars" ON storage.objects;

-- Allow public access to view avatars
CREATE POLICY "Public Avatar View" 
ON storage.objects FOR SELECT 
TO public 
USING (bucket_id = 'avatars');

-- Allow users to manage their own avatar folder
CREATE POLICY "Users can manage own avatar" 
ON storage.objects FOR ALL 
TO authenticated 
USING (
  bucket_id = 'avatars' AND 
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'avatars' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow admins to manage all avatars
CREATE POLICY "Admins can manage all avatars" 
ON storage.objects FOR ALL 
TO authenticated 
USING (
  bucket_id = 'avatars' AND 
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);
