-- Supabase Database Schema for Topi Gang Board
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
CREATE TABLE IF NOT EXISTS work_items (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Epic', 'User Story', 'Task', 'Bug', 'Operation')),
  state TEXT NOT NULL CHECK (state IN ('New', 'Active', 'Done')),
  assignee_id TEXT REFERENCES people(id) ON DELETE SET NULL,
  priority TEXT NOT NULL CHECK (priority IN ('Critical', 'High', 'Medium', 'Low')),
  tags TEXT[] DEFAULT '{}',
  parent_id TEXT REFERENCES work_items(id) ON DELETE CASCADE,
  sprint_id TEXT REFERENCES sprints(id) ON DELETE SET NULL,
  description TEXT,
  created_at BIGINT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  work_item_id TEXT NOT NULL REFERENCES work_items(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  author_id TEXT REFERENCES people(id) ON DELETE SET NULL,
  created_at BIGINT NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_work_items_sprint_id ON work_items(sprint_id);
CREATE INDEX IF NOT EXISTS idx_work_items_parent_id ON work_items(parent_id);
CREATE INDEX IF NOT EXISTS idx_work_items_assignee_id ON work_items(assignee_id);
CREATE INDEX IF NOT EXISTS idx_comments_work_item_id ON comments(work_item_id);
CREATE INDEX IF NOT EXISTS idx_sprints_is_active ON sprints(is_active);

-- Enable Row Level Security (RLS) - Allow all operations for now
-- You can restrict this later if needed
ALTER TABLE people ENABLE ROW LEVEL SECURITY;
ALTER TABLE sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (simple setup)
CREATE POLICY "Allow all operations on people" ON people
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on sprints" ON sprints
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on work_items" ON work_items
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on comments" ON comments
  FOR ALL USING (true) WITH CHECK (true);

