-- Seed data for MAGNIFIED EXISTENCE OS

-- 1. Create a Program
INSERT INTO programs (id, title, description, duration_days, cover_image, is_published)
VALUES ('74888888-8888-8888-8888-888888888888', 'Inner Reset', 'Deep neural rewiring for emotional sovereignty and cognitive clarity.', 30, 'https://images.unsplash.com/photo-1506126613408-eca07ce68773', TRUE);

-- 2. Create a Module
INSERT INTO modules (id, program_id, title, order_index)
VALUES ('11111111-1111-1111-1111-111111111111', '74888888-8888-8888-8888-888888888888', 'Phase 2: Inner Reset', 1);

-- 3. Create a Lesson
INSERT INTO lessons (id, module_id, title, day_number, unlock_day)
VALUES ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Rewiring Identity', 12, 12);

-- 4. Create Tasks
INSERT INTO tasks (lesson_id, title, description, type, content, order_index)
VALUES 
('22222222-2222-2222-2222-222222222222', 'Morning Calibration', 'A guided somatic experience.', 'audio', '{"url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"}', 0),
('22222222-2222-2222-2222-222222222222', 'Rewiring Identity', 'Understanding self-perception.', 'video', '{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}', 1),
('22222222-2222-2222-2222-222222222222', 'Daily Integration', 'Read the core principles.', 'text', '{"text": "The self is dynamic..."}', 2);
