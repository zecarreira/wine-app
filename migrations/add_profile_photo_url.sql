-- Add profile_photo_url column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;

-- Add comment to document the column
COMMENT ON COLUMN users.profile_photo_url IS 'URL to user profile photo stored in Supabase Storage';
