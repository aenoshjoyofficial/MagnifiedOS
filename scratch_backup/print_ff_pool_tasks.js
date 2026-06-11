const url = "https://evkkbwulppxazqgprefy.supabase.co/rest/v1";
const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2a2tid3VscHB4YXpxZ3ByZWZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1NDIyNTEsImV4cCI6MjA5NjExODI1MX0.9Q3PIv4T-SLG9LtLreMjjJUW0T9jBaBzYMzWH0HGNpo";

const headers = {
  "apikey": anonKey,
  "Authorization": `Bearer ${anonKey}`,
  "Content-Type": "application/json"
};

async function run() {
  try {
    const lessonId = "3c6713e7-9a0e-4c88-8807-0d1e688c17a4";
    console.log(`--- Fetching tasks for lesson ${lessonId} ---`);
    const tasksRes = await fetch(`${url}/tasks?lesson_id=eq.${lessonId}&select=*`, { headers });
    const tasks = await tasksRes.json();
    console.log(`Tasks:`, tasks);
    if (Array.isArray(tasks)) {
      console.log(`Tasks count: ${tasks.length}`);
      tasks.forEach(t => {
        console.log(`- Task ID: ${t.id} | Title: "${t.title}" | Type: ${t.type}`);
        console.log(`  Content:`, JSON.stringify(t.content, null, 2));
      });
    }
  } catch (err) {
    console.error(err);
  }
}

run();
