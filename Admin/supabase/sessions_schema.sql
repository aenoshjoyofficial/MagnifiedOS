-- MAGNIFIED EXISTENCE OS - SESSIONS TABLE
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  host_name TEXT NOT NULL,
  host_avatar_url TEXT,
  description TEXT,
  session_type TEXT NOT NULL, -- 'Group Call', 'Live Practice', 'Q&A'
  start_time TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  meeting_link TEXT,
  max_attendees INTEGER,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Admins: Full Access
CREATE POLICY "Admins have full access to sessions"
  ON sessions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Users: View Published Sessions
CREATE POLICY "Users can view published sessions"
  ON sessions FOR SELECT
  TO authenticated
  USING (is_published = true);
