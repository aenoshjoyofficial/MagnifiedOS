const url = "https://phytcoyaemsehsezbruy.supabase.co/rest/v1";
const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBoeXRjb3lhZW1zZWhzZXpicnV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4MDA5NDAsImV4cCI6MjA5MzM3Njk0MH0.fTPenRdec6P_JK5Q1SpyzUUypdr0D6W4v-aH7bw_HU8";

const headers = {
  "apikey": anonKey,
  "Authorization": `Bearer ${anonKey}`,
  "Content-Type": "application/json"
};

async function checkTasks() {
  try {
    console.log("--- Fetching all tasks with their lessons and modules ---");
    // We can join lessons and modules using select
    const tasksRes = await fetch(`${url}/tasks?select=id,title,type,lesson_id,lessons(id,title,day_number,module_id,modules(id,title,program_id))&limit=100`, { headers });
    const tasks = await tasksRes.json();
    
    console.log(`Total tasks fetched: ${tasks.length}`);
    for (const t of tasks) {
      const lesson = t.lessons;
      const module = lesson ? lesson.modules : null;
      console.log(`Task: "${t.title}" | Lesson: "${lesson?.title}" (Day ${lesson?.day_number}) | Module: "${module?.title}"`);
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

checkTasks();
