-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'system',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'notifications' AND policyname = 'Users can view their own notifications'
  ) THEN
    CREATE POLICY "Users can view their own notifications" ON notifications
      FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'notifications' AND policyname = 'Users can update their own notifications'
  ) THEN
    CREATE POLICY "Users can update their own notifications" ON notifications
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END
$$;

-- Insert seed notifications for testing
INSERT INTO notifications (user_id, title, message, type, is_read, created_at)
SELECT 
  id, 
  'Welcome to Shribodhi Magnified', 
  'Your portal is set up. Access neural protocols, schedules, and profile settings in your dashboard.', 
  'system', 
  false, 
  NOW()
FROM profiles
ON CONFLICT DO NOTHING;

INSERT INTO notifications (user_id, title, message, type, is_read, created_at)
SELECT 
  id, 
  'New Session Scheduled', 
  'A new synchronous collective expansion session has been scheduled. Check the sessions tab.', 
  'session', 
  false, 
  NOW() - INTERVAL '2 hours'
FROM profiles;

INSERT INTO notifications (user_id, title, message, type, is_read, created_at)
SELECT 
  id, 
  'Daily Protocol Released', 
  'Today''s evolution and neural rearchitecting protocols are active. Start your today''s practice.', 
  'protocol', 
  false, 
  NOW() - INTERVAL '5 hours'
FROM profiles;
