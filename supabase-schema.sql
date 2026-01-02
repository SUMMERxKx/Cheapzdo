-- Supabase Database Schema for Cheapzdo Task Board
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- People table
CREATE TABLE IF NOT EXISTS people (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  handle TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sprints table
CREATE TABLE IF NOT EXISTS sprints (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT FALSE,
  start_date BIGINT NOT NULL,
  end_date BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Work items table
-- First, drop the old constraint if it exists and create/update the table
DO $$ 
BEGIN
  -- Drop old constraint if it exists
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
             WHERE constraint_name = 'work_items_type_check' 
             AND table_name = 'work_items') THEN
    ALTER TABLE work_items DROP CONSTRAINT work_items_type_check;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS work_items (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('New', 'Active', 'Done')),
  assignee_id TEXT REFERENCES people(id) ON DELETE SET NULL,
  priority TEXT NOT NULL CHECK (priority IN ('Critical', 'High', 'Medium', 'Low')),
  tags TEXT[] DEFAULT '{}',
  parent_id TEXT REFERENCES work_items(id) ON DELETE CASCADE,
  sprint_id TEXT REFERENCES sprints(id) ON DELETE SET NULL,
  description TEXT,
  created_at BIGINT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "order" INTEGER
);

-- Add the new type constraint
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                 WHERE constraint_name = 'work_items_type_check' 
                 AND table_name = 'work_items') THEN
    ALTER TABLE work_items ADD CONSTRAINT work_items_type_check 
      CHECK (type IN ('Study', 'Gym', 'Sports', 'Running', 'Entertainment', 'Other'));
  END IF;
END $$;

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  work_item_id TEXT NOT NULL REFERENCES work_items(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  author_id TEXT REFERENCES people(id) ON DELETE SET NULL,
  created_at BIGINT NOT NULL
);

-- Boards table (for bulletin board feature)
CREATE TABLE IF NOT EXISTS boards (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at BIGINT NOT NULL
);

-- Board notes table (for bulletin board feature)
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

-- Announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  created_at BIGINT NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_work_items_sprint_id ON work_items(sprint_id);
CREATE INDEX IF NOT EXISTS idx_work_items_parent_id ON work_items(parent_id);
CREATE INDEX IF NOT EXISTS idx_work_items_assignee_id ON work_items(assignee_id);
CREATE INDEX IF NOT EXISTS idx_comments_work_item_id ON comments(work_item_id);
CREATE INDEX IF NOT EXISTS idx_sprints_is_active ON sprints(is_active);
CREATE INDEX IF NOT EXISTS idx_board_notes_board_id ON board_notes(board_id);
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at);

-- Enable Row Level Security (RLS) - Allow all operations for now
-- You can restrict this later if needed
ALTER TABLE people ENABLE ROW LEVEL SECURITY;
ALTER TABLE sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to allow re-running this script)
DROP POLICY IF EXISTS "Allow all operations on people" ON people;
DROP POLICY IF EXISTS "Allow all operations on sprints" ON sprints;
DROP POLICY IF EXISTS "Allow all operations on work_items" ON work_items;
DROP POLICY IF EXISTS "Allow all operations on comments" ON comments;
DROP POLICY IF EXISTS "Allow all operations on boards" ON boards;
DROP POLICY IF EXISTS "Allow all operations on board_notes" ON board_notes;
DROP POLICY IF EXISTS "Allow all operations on announcements" ON announcements;

-- Create policies to allow all operations (simple setup)
CREATE POLICY "Allow all operations on people" ON people
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on sprints" ON sprints
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on work_items" ON work_items
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on comments" ON comments
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on boards" ON boards
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on board_notes" ON board_notes
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on announcements" ON announcements
  FOR ALL USING (true) WITH CHECK (true);
