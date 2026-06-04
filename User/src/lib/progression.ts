/**
 * Calculates Eastern Time (New York) calendar days since enrollment started.
 * Kept consistent with the existing America/New_York program progression logic.
 */
export const calculateDaysSinceStart = (startedAt: string | Date | undefined): number => {
  if (!startedAt) return 1;
  const startDate = new Date(startedAt);
  
  const getNYDate = (d: Date) => {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    });
    const parts = formatter.formatToParts(d);
    const year = parseInt(parts.find(p => p.type === 'year')!.value, 10);
    const month = parseInt(parts.find(p => p.type === 'month')!.value, 10) - 1; // 0-indexed
    const day = parseInt(parts.find(p => p.type === 'day')!.value, 10);
    return new Date(Date.UTC(year, month, day));
  };

  const startNY = getNYDate(startDate);
  const todayNY = getNYDate(new Date());
  
  return Math.max(1, Math.floor((todayNY.getTime() - startNY.getTime()) / (1000 * 60 * 60 * 24)) + 1);
};

/**
 * Determines if a given lesson is locked.
 * A lesson (Day D) is locked if:
 * 1. D > 1 (Day 1 and Day 0 are always unlocked)
 * 2. AND D > daysSinceStart (the calendar day has not arrived yet)
 * 3. AND any task in any previous lesson (excluding Day 0) is not completed.
 */
export const isLessonLocked = (
  lesson: any,
  program: any,
  completedKeys: Set<string>,
  daysSinceStart: number
): boolean => {
  const dayNum = lesson.day_number;
  if (dayNum <= 1) return false;

  // Time-based unlock
  if (dayNum <= daysSinceStart) return false;

  // Completion-based unlock (only checking lessons where day_number >= 1)
  const allLessons = program?.modules?.flatMap((m: any) => m.lessons || []) || [];
  const prevLessons = allLessons.filter((l: any) => l.day_number >= 1 && l.day_number < dayNum);

  return prevLessons.some((l: any) => {
    const tasks = l.tasks || [];
    if (tasks.length === 0) return false;
    const completed = tasks.filter((t: any) => completedKeys.has(`${l.day_number}_${t.title}`));
    return completed.length < tasks.length;
  });
};

/**
 * Calculates the current/active program progression day (1-indexed).
 * Chamber Pool (day_number = 0) is excluded from calculations.
 */
export const calculateActiveDay = (
  program: any,
  completedKeys: Set<string>,
  daysSinceStart: number
): number => {
  if (!program?.modules) return 1;

  // 1. Gather lessons where day_number >= 1
  const allLessons = program.modules
    .flatMap((m: any) => m.lessons || [])
    .filter((l: any) => l.day_number >= 1) || [];

  if (allLessons.length === 0) return 1;

  const totalDays = allLessons.reduce((acc: number, les: any) => Math.max(acc, les.day_number || 0), 0) || 30;

  // Map to easily find lessons by day number
  const lessonByDay = new Map<number, any>();
  allLessons.forEach((l: any) => {
    lessonByDay.set(l.day_number, l);
  });

  const isDayCompleted = (dayNum: number): boolean => {
    const lesson = lessonByDay.get(dayNum);
    if (!lesson) return false;
    const tasks = lesson.tasks || [];
    if (tasks.length === 0) return false;
    return tasks.every((t: any) => completedKeys.has(`${dayNum}_${t.title}`));
  };

  // Start with the calendar day
  let activeDay = Math.min(daysSinceStart, totalDays);

  // Fast-track: if the active day (and any subsequent days) is completed, advance to the next day
  while (activeDay < totalDays && isDayCompleted(activeDay)) {
    activeDay++;
  }

  return activeDay;
};
