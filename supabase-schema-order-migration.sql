-- Migration script to add order column to work_items table
-- Run this in your Supabase SQL Editor if you have an existing database

-- Add order column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'work_items' AND column_name = 'order'
  ) THEN
    ALTER TABLE work_items ADD COLUMN "order" INTEGER;
  END IF;
END $$;

-- Update existing items to have order based on created_at
-- This ensures existing items have a default order
UPDATE work_items
SET "order" = subquery.row_number - 1
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY parent_id ORDER BY created_at) as row_number
  FROM work_items
) AS subquery
WHERE work_items.id = subquery.id AND work_items.parent_id IS NULL;

