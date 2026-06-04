const calculateDaysSinceStart = (startedAt) => {
  if (!startedAt) return 1;
  const startDate = new Date(startedAt);
  
  const getNYDate = (d) => {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    });
    const parts = formatter.formatToParts(d);
    const year = parseInt(parts.find(p => p.type === 'year').value, 10);
    const month = parseInt(parts.find(p => p.type === 'month').value, 10) - 1; // 0-indexed
    const day = parseInt(parts.find(p => p.type === 'day').value, 10);
    return new Date(Date.UTC(year, month, day));
  };

  const startNY = getNYDate(startDate);
  const todayNY = getNYDate(new Date());
  
  return Math.max(1, Math.floor((todayNY.getTime() - startNY.getTime()) / (1000 * 60 * 60 * 24)) + 1);
};

const calculateActiveDay = (program, completedKeys, daysSinceStart) => {
  if (!program?.modules) return 1;

  // 1. Gather lessons where day_number >= 1
  const allLessons = program.modules
    .flatMap((m) => m.lessons || [])
    .filter((l) => l.day_number >= 1) || [];

  if (allLessons.length === 0) return 1;

  const totalDays = allLessons.reduce((acc, les) => Math.max(acc, les.day_number || 0), 0) || 30;

  return Math.min(daysSinceStart, totalDays);
};

const url = "https://evkkbwulppxazqgprefy.supabase.co/rest/v1";
const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2a2tid3VscHB4YXpxZ3ByZWZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1NDIyNTEsImV4cCI6MjA5NjExODI1MX0.9Q3PIv4T-SLG9LtLreMjjJUW0T9jBaBzYMzWH0HGNpo";

const headers = {
  "apikey": anonKey,
  "Authorization": `Bearer ${anonKey}`,
  "Content-Type": "application/json"
};

async function test() {
  const userId = "c09b6f61-949b-4a9a-9b0e-15d2f9e00351";
  
  // 1. Fetch active enrollment
  const res = await fetch(`${url}/enrollments?user_id=eq.${userId}&status=eq.active&select=*,programs(*,modules(*,lessons(*,tasks(*)))),task_completions(*)`, { headers });
  const enrollments = await res.json();
  const enrollment = enrollments[0];
  
  console.log(`--- CURRENT STATE IN DB ---`);
  console.log(`Started At: ${enrollment.started_at}`);
  
  const calendarDaysCur = calculateDaysSinceStart(enrollment.started_at);
  const activeDayCur = calculateActiveDay(enrollment.programs, new Set(), calendarDaysCur);
  console.log(`daysSinceStart: ${calendarDaysCur}`);
  console.log(`calculateActiveDay: ${activeDayCur}`);
  
  console.log(`\n--- SIMULATED SHIFTED STATE (started_at = June 1, 2026) ---`);
  const shiftedStartedAt = "2026-06-01T09:19:53.043+00:00";
  const calendarDaysShift = calculateDaysSinceStart(shiftedStartedAt);
  const activeDayShift = calculateActiveDay(enrollment.programs, new Set(), calendarDaysShift);
  console.log(`daysSinceStart: ${calendarDaysShift}`);
  console.log(`calculateActiveDay: ${activeDayShift}`);
}

test().catch(console.error);
