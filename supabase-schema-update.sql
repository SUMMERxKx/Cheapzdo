-- Migration Script: Update existing Supabase database
-- Run this if you already have the old schema installed
-- This updates the schema to support new features

-- 1. Update work_items type constraint
DO $$ 
BEGIN
  -- Drop old constraint if it exists
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
             WHERE constraint_name = 'work_items_type_check' 
             AND table_name = 'work_items') THEN
    ALTER TABLE work_items DROP CONSTRAINT work_items_type_check;
  END IF;
  
  -- Add new constraint with updated types
  ALTER TABLE work_items ADD CONSTRAINT work_items_type_check 
    CHECK (type IN ('Study', 'Gym', 'Sports', 'Running', 'Entertainment', 'Other'));
END $$;

-- 2. Create boards table if it doesn't exist
CREATE TABLE IF NOT EXISTS boards (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at BIGINT NOT NULL
);

-- 3. Create board_notes table if it doesn't exist
CREATE TABLE IF NOT EXISTS board_notes (
  id TEXT PRIMARY KEY,
  board_id TEXT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  x INTEGER NOT NULL DEFAULT 0,
  y INTEGER NOT NULL DEFAULT 0,
  color TEXT,
  created_at BIGINT NOT NULL
);

-- 4. Create announcements table if it doesn't exist
CREATE TABLE IF NOT EXISTS announcements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  created_at BIGINT NOT NULL
);

-- 5. Create indexes
CREATE INDEX IF NOT EXISTS idx_board_notes_board_id ON board_notes(board_id);
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at);

-- 6. Enable RLS on new tables
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- 7. Drop existing policies if they exist, then create new ones
DROP POLICY IF EXISTS "Allow all operations on boards" ON boards;
DROP POLICY IF EXISTS "Allow all operations on board_notes" ON board_notes;
DROP POLICY IF EXISTS "Allow all operations on announcements" ON announcements;

-- 8. Create policies for new tables
CREATE POLICY "Allow all operations on boards" ON boards
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on board_notes" ON board_notes
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on announcements" ON announcements
  FOR ALL USING (true) WITH CHECK (true);

