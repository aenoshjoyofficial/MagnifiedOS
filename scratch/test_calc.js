// Mocking the imported structure and testing the exact logic in calculateActiveDay
const calculateActiveDay = (program, completedKeys, daysSinceStart) => {
  if (!program?.modules) return 1;

  // 1. Gather lessons where day_number >= 1
  const allLessons = program.modules
    .flatMap((m) => m.lessons || [])
    .filter((l) => l.day_number >= 1) || [];

  if (allLessons.length === 0) return 1;

  const totalDays = allLessons.reduce((acc, les) => Math.max(acc, les.day_number || 0), 0) || 30;

  // Map to easily find lessons by day number
  const lessonByDay = new Map();
  allLessons.forEach((l) => {
    lessonByDay.set(l.day_number, l);
  });

  const isDayCompleted = (dayNum) => {
    const lesson = lessonByDay.get(dayNum);
    if (!lesson) return false;
    const tasks = lesson.tasks || [];
    if (tasks.length === 0) return false;
    return tasks.every((t) => completedKeys.has(`${dayNum}_${t.title}`));
  };

  // Start with the calendar day
  let activeDay = Math.min(daysSinceStart, totalDays);

  // Fast-track: if the active day (and any subsequent days) is completed, advance to the next day
  while (activeDay < totalDays && isDayCompleted(activeDay)) {
    activeDay++;
  }

  return activeDay;
};

// Test Cases
const mockProgram = {
  modules: [
    {
      lessons: [
        { day_number: 1, tasks: [{ title: 'Task 1A' }, { title: 'Task 1B' }] },
        { day_number: 2, tasks: [{ title: 'Task 2A' }] },
        { day_number: 3, tasks: [{ title: 'Task 3A' }] },
        { day_number: 4, tasks: [{ title: 'Task 4A' }] },
      ]
    }
  ]
};

// Case 1: daysSinceStart = 1, nothing completed
console.log('Case 1 (expected 1):', calculateActiveDay(mockProgram, new Set(), 1));

// Case 2: daysSinceStart = 1, Day 1 completed
console.log('Case 2 (expected 2):', calculateActiveDay(mockProgram, new Set(['1_Task 1A', '1_Task 1B']), 1));

// Case 3: daysSinceStart = 1, Day 1 & Day 2 completed
console.log('Case 3 (expected 3):', calculateActiveDay(mockProgram, new Set(['1_Task 1A', '1_Task 1B', '2_Task 2A']), 1));

// Case 4: daysSinceStart = 3, Day 1 completed, Day 2 incomplete, Day 3 incomplete
console.log('Case 4 (expected 3):', calculateActiveDay(mockProgram, new Set(['1_Task 1A', '1_Task 1B']), 3));

// Case 5: daysSinceStart = 3, Day 1, 2, 3 completed
console.log('Case 5 (expected 4):', calculateActiveDay(mockProgram, new Set(['1_Task 1A', '1_Task 1B', '2_Task 2A', '3_Task 3A']), 3));

// Case 6: daysSinceStart = 4, Day 1, 2, 3, 4 completed (reaches limit)
console.log('Case 6 (expected 4):', calculateActiveDay(mockProgram, new Set(['1_Task 1A', '1_Task 1B', '2_Task 2A', '3_Task 3A', '4_Task 4A']), 4));
