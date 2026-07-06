import React from 'react';
import { useMyEnrollment, useChambers } from './queries';
import { calculateDaysSinceStart, calculateActiveDay } from './progression';

export const useProgramEngine = (userId: string) => {
  const { data: enrollment, isLoading: isEnrollmentLoading, isError: isEnrollmentError } = useMyEnrollment(userId);
  const { data: chambers, isLoading: isChambersLoading, isError: isChambersError } = useChambers();

  const isLoading = isEnrollmentLoading || isChambersLoading;
  const isError = isEnrollmentError || isChambersError;
  const program = enrollment?.programs;
  const completions = enrollment?.task_completions || [];

  // Helper to map module to chamber using database slug
  const getChamberForModule = React.useCallback((module: any) => {
    if (!module || !chambers) return null;
    let cleanTitle = module.title
      .replace(/^(chamber\s*\d*\s*[:\-]?\s*|\d*\s*[:\-]?\s*)/i, '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-');
      
    if (cleanTitle === 'the-frequency-field') cleanTitle = 'frequency-field';
    if (cleanTitle === 'the-living-frame') cleanTitle = 'living-frame';
    
    return chambers.find((c: any) => c.slug === cleanTitle || c.id === cleanTitle) || null;
  }, [chambers]);

  // Compute visible modules sorted by display order
  const visibleModules = React.useMemo(() => {
    if (!program?.modules) return [];
    if (!chambers) return program.modules;
    
    const filtered = program.modules.filter((m: any) => {
      const config = getChamberForModule(m);
      return config ? (config.visible && config.active) : true;
    });

    const sorted = [...filtered].sort((a: any, b: any) => {
      const configA = getChamberForModule(a);
      const configB = getChamberForModule(b);
      const orderA = configA ? configA.display_order : 999;
      const orderB = configB ? configB.display_order : 999;
      return orderA - orderB;
    });

    return sorted;
  }, [program?.modules, chambers, getChamberForModule]);

  // Map of taskId to title and dayNumber for completed keys
  const taskMap = React.useMemo(() => {
    const map: Record<string, { title: string; dayNumber: number }> = {};
    visibleModules?.forEach((mod: any) => {
      mod.lessons?.forEach((les: any) => {
        les.tasks?.forEach((task: any) => {
          map[task.id] = { title: task.title, dayNumber: les.day_number };
        });
      });
    });
    return map;
  }, [visibleModules]);

  // Completed keys set of `${dayNumber}_${taskTitle}`
  const completedKeys = React.useMemo(() => {
    const keys = new Set<string>();
    completions.forEach((c: any) => {
      const tInfo = taskMap[c.task_id];
      if (tInfo) {
        keys.add(`${tInfo.dayNumber}_${tInfo.title}`);
      }
    });
    return keys;
  }, [completions, taskMap]);

  // Time based calendar tracking
  const daysSinceStart = React.useMemo(() => {
    return calculateDaysSinceStart(enrollment?.started_at);
  }, [enrollment?.started_at]);

  // Active progression day
  const activeDay = React.useMemo(() => {
    return calculateActiveDay({ modules: visibleModules }, completedKeys, daysSinceStart);
  }, [visibleModules, completedKeys, daysSinceStart]);

  // Total program tasks count (visible only)
  const totalTasksCount = React.useMemo(() => {
    let total = 0;
    visibleModules?.forEach((mod: any) => {
      mod.lessons?.forEach((les: any) => {
        total += les.tasks?.length || 0;
      });
    });
    return total || 1;
  }, [visibleModules]);

  // Completed tasks count (visible only)
  const completedTasksCount = React.useMemo(() => {
    return completedKeys.size;
  }, [completedKeys]);

  // Program completion percentage
  const programCompletionPercent = React.useMemo(() => {
    return Math.round((completedTasksCount / totalTasksCount) * 100);
  }, [completedTasksCount, totalTasksCount]);

  // Dynamic Duration: Max day_number from lessons
  const totalDays = React.useMemo(() => {
    const maxModDay = visibleModules?.reduce((acc: number, mod: any) => {
      const maxModDay = mod.lessons?.reduce((lMax: number, lesson: any) => Math.max(lMax, lesson.day_number || 0), 0) || 0;
      return Math.max(acc, maxModDay);
    }, 0) || program?.duration_days || 30;
    return maxModDay;
  }, [visibleModules, program]);

  // Count how many previous days contain incomplete tasks
  const prevIncompleteDaysCount = React.useMemo(() => {
    if (!visibleModules || visibleModules.length === 0 || activeDay <= 1) return 0;
    const allLessons = visibleModules.flatMap((m: any) => m.lessons || []) || [];
    const pastLessons = allLessons.filter((l: any) => l.day_number >= 1 && l.day_number < activeDay);

    let incompleteCount = 0;
    pastLessons.forEach((l: any) => {
      const tasks = l.tasks || [];
      if (tasks.length === 0) return;
      const completed = tasks.filter((t: any) => completedKeys.has(`${l.day_number}_${t.title}`));
      if (completed.length < tasks.length) {
        incompleteCount++;
      }
    });
    return incompleteCount;
  }, [visibleModules, activeDay, completedKeys]);

  // Streak calculation logic
  const calculateStreak = React.useCallback(() => {
    const validCompletions = completions.filter((c: any) => {
      const tInfo = taskMap[c.task_id];
      return tInfo && tInfo.dayNumber >= 1;
    });

    if (validCompletions.length === 0) return 0;

    const formatNYDate = (d: Date) => {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
      });
      const parts = formatter.formatToParts(d);
      const y = parts.find(p => p.type === 'year')!.value;
      const m = parts.find(p => p.type === 'month')!.value;
      const day = parts.find(p => p.type === 'day')!.value;
      return `${y}-${m.padStart(2, '0')}-${day.padStart(2, '0')}`;
    };

    const getNYMidnight = (d: Date) => {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
      });
      const parts = formatter.formatToParts(d);
      const year = parseInt(parts.find(p => p.type === 'year')!.value, 10);
      const month = parseInt(parts.find(p => p.type === 'month')!.value, 10) - 1;
      const day = parseInt(parts.find(p => p.type === 'day')!.value, 10);
      return new Date(Date.UTC(year, month, day));
    };

    const dates = [...new Set(
      validCompletions.map((c: any) => formatNYDate(new Date(c.completed_at)))
    )] as string[];
    dates.sort().reverse();

    const todayNYDate = getNYMidnight(new Date());
    const today = formatNYDate(todayNYDate);

    const yesterdayNYDate = new Date(todayNYDate);
    yesterdayNYDate.setDate(todayNYDate.getDate() - 1);
    const yesterday = formatNYDate(yesterdayNYDate);

    if (dates[0] !== today && dates[0] !== yesterday) return 0;

    let streak = 0;
    const baseDate = new Date(dates[0] + 'T00:00:00');
    for (let i = 0; i < dates.length; i++) {
      const expectedDate = new Date(baseDate);
      expectedDate.setDate(baseDate.getDate() - i);
      const expected = expectedDate.toISOString().split('T')[0];

      if (dates[i] === expected) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }, [completions, taskMap]);

  const currentStreak = React.useMemo(() => calculateStreak(), [calculateStreak]);

  // Methods defined by Phase 2:
  const getVisibleChambers = () => {
    if (!chambers) return [];
    return chambers.filter((c: any) => c.visible && c.active);
  };

  const getOrderedChambers = () => {
    if (!chambers) return [];
    return [...chambers].sort((a: any, b: any) => a.display_order - b.display_order);
  };

  const getCurrentDay = () => activeDay;
  const getCurrentWeek = () => Math.max(1, Math.ceil(activeDay / 7));
  const getCurrentCycle = () => enrollment?.cycle_number || 1;

  const getCurrentLesson = (dayNumber: number) => {
    const allLessons = visibleModules.flatMap((m: any) => m.lessons || []);
    return allLessons.find((l: any) => l.day_number === dayNumber) || null;
  };

  const getCurrentModule = (moduleId: string) => {
    return visibleModules.find((m: any) => m.id === moduleId) || null;
  };

  const getDailyLessons = (dayNumber: number) => {
    const allLessons = visibleModules.flatMap((m: any) => 
      (m.lessons || []).map((l: any) => ({
        ...l,
        moduleTitle: m.title,
        moduleId: m.id
      }))
    );
    return allLessons.filter((l: any) => l.day_number === dayNumber);
  };

  const getDailyTasks = (dayNumber: number) => {
    const lessons = getDailyLessons(dayNumber);
    return lessons.flatMap((l: any) => 
      (l.tasks || []).map((t: any) => ({
        ...t,
        moduleTitle: l.moduleTitle,
        moduleId: l.moduleId
      }))
    );
  };

  const getCompletedTasks = () => completions;
  const getCompletionPercentage = () => programCompletionPercent;
  const getCurrentProgress = () => programCompletionPercent;

  const getDashboardStats = () => ({
    totalCompletions: completedTasksCount,
    currentStreak,
    neuralExpansion: `${programCompletionPercent}%`,
    milestones: Math.floor(completedTasksCount / 10),
    totalDays
  });

  const getProgramSummary = () => ({
    title: program?.title || 'Program Title',
    description: program?.description || 'Deep neural rewiring for emotional sovereignty and cognitive clarity.',
    cycleNumber: getCurrentCycle(),
    progressPercent: programCompletionPercent,
    currentDay: activeDay,
    totalDays,
    prevIncompleteDaysCount
  });

  return {
    isLoading,
    isError,
    enrollment,
    program,
    chambers,
    visibleModules,
    completedKeys,
    daysSinceStart,
    activeDay,
    totalDays,
    completedTasksCount,
    totalTasksCount,
    currentStreak,
    programCompletionPercent,
    getVisibleChambers,
    getOrderedChambers,
    getCurrentDay,
    getCurrentWeek,
    getCurrentCycle,
    getCurrentLesson,
    getCurrentModule,
    getDailyLessons,
    getDailyTasks,
    getCompletedTasks,
    getCompletionPercentage,
    getCurrentProgress,
    getDashboardStats,
    getProgramSummary,
    getChamberForModule
  };
};
