-- =========================================================================
-- Phase 1 - Historical Statistics Foundation
-- =========================================================================

-- 1. task_completions
CREATE TABLE IF NOT EXISTS task_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(enrollment_id, task_id)
);

-- 2. user_progress
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'completed'
  completion_percentage INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, task_id)
);

-- 3. cycle_history
CREATE TABLE IF NOT EXISTS cycle_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  cycle_number INTEGER NOT NULL DEFAULT 1,
  tasks_completed INTEGER NOT NULL DEFAULT 0,
  total_tasks INTEGER NOT NULL DEFAULT 0,
  completion_percentage INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE task_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE cycle_history ENABLE ROW LEVEL SECURITY;

-- Policies for task_completions
DROP POLICY IF EXISTS "Admins have full access to task_completions" ON task_completions;
CREATE POLICY "Admins have full access to task_completions" ON task_completions
  FOR ALL TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "Users can view own task_completions" ON task_completions;
CREATE POLICY "Users can view own task_completions" ON task_completions
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM enrollments
      WHERE enrollments.id = task_completions.enrollment_id AND enrollments.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert own task_completions" ON task_completions;
CREATE POLICY "Users can insert own task_completions" ON task_completions
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM enrollments
      WHERE enrollments.id = enrollment_id AND enrollments.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete own task_completions" ON task_completions;
CREATE POLICY "Users can delete own task_completions" ON task_completions
  FOR DELETE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM enrollments
      WHERE enrollments.id = task_completions.enrollment_id AND enrollments.user_id = auth.uid()
    )
  );

-- Policies for user_progress
DROP POLICY IF EXISTS "Admins have full access to user_progress" ON user_progress;
CREATE POLICY "Admins have full access to user_progress" ON user_progress
  FOR ALL TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "Users can manage own progress" ON user_progress;
CREATE POLICY "Users can manage own progress" ON user_progress
  FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Policies for cycle_history
DROP POLICY IF EXISTS "Admins have full access to cycle_history" ON cycle_history;
CREATE POLICY "Admins have full access to cycle_history" ON cycle_history
  FOR ALL TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "Users can view own cycle_history" ON cycle_history;
CREATE POLICY "Users can view own cycle_history" ON cycle_history
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
