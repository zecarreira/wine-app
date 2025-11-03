-- Create profile-photos bucket for user profile pictures
-- Execute this in Supabase SQL Editor

-- Step 1: Create the bucket (if it doesn't exist)
-- NOTE: You may need to create this via the Supabase Dashboard UI instead:
-- 1. Go to Storage in Supabase Dashboard
-- 2. Click "New bucket"
-- 3. Name: profile-photos
-- 4. Check "Public bucket"
-- 5. Click "Create bucket"

-- Step 2: Set up policies for the bucket
-- Allow public read access to all profile photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-photos', 'profile-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow public read access
CREATE POLICY IF NOT EXISTS "Public read access for profile photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-photos');

-- Allow authenticated users to upload their profile photos
CREATE POLICY IF NOT EXISTS "Authenticated users can upload profile photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-photos'
);

-- Allow users to update their own profile photos
CREATE POLICY IF NOT EXISTS "Users can update their profile photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'profile-photos')
WITH CHECK (bucket_id = 'profile-photos');

-- Allow users to delete their own profile photos
CREATE POLICY IF NOT EXISTS "Users can delete their profile photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'profile-photos');
