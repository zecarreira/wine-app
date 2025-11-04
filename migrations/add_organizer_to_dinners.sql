-- Migration: Add Organizer to Dinners
-- Description: Adicionar campo organizer_id para guardar quem organiza cada jantar
-- Date: 2025-11-04

-- Add organizer_id column to dinners table
ALTER TABLE dinners 
ADD COLUMN organizer_id UUID REFERENCES users(id);

-- Add comment to explain the column
COMMENT ON COLUMN dinners.organizer_id IS 'Founder que organiza este jantar (diferente de created_by que é o admin)';

-- Create index for better performance when filtering by organizer
CREATE INDEX idx_dinners_organizer_id ON dinners(organizer_id);

-- Note: Existing dinners will have NULL organizer_id
-- This is OK - they were created before this feature existed
