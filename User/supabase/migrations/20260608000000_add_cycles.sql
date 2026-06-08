-- 1. Add cycle_number to enrollments table
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS cycle_number INTEGER DEFAULT 1;

-- 2. Prevent duplicate active enrollments
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_user_program_enrollment 
ON enrollments (user_id, program_id) 
WHERE (status = 'active');

-- 3. Create program_cycles table
CREATE TABLE IF NOT EXISTS program_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  cycle_number INTEGER NOT NULL,
  tasks_completed INTEGER NOT NULL DEFAULT 0,
  total_tasks INTEGER NOT NULL DEFAULT 0,
  completion_percentage INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for program_cycles
ALTER TABLE program_cycles ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for program_cycles
DROP POLICY IF EXISTS "Users can manage own program_cycles" ON program_cycles;
CREATE POLICY "Users can manage own program_cycles" ON program_cycles
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can read all program_cycles" ON program_cycles;
CREATE POLICY "Admins can read all program_cycles" ON program_cycles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.raw_user_meta_data->>'role') = 'admin'
    )
  );
-- Add RLS policies for enrollments table to allow users to start/complete cycles
DROP POLICY IF EXISTS "Users can insert own enrollments" ON enrollments;
CREATE POLICY "Users can insert own enrollments" ON enrollments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own enrollments" ON enrollments;
CREATE POLICY "Users can update own enrollments" ON enrollments
  FOR UPDATE USING (auth.uid() = user_id);
