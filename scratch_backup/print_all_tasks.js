const url = "https://evkkbwulppxazqgprefy.supabase.co/rest/v1";
const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2a2tid3VscHB4YXpxZ3ByZWZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1NDIyNTEsImV4cCI6MjA5NjExODI1MX0.9Q3PIv4T-SLG9LtLreMjjJUW0T9jBaBzYMzWH0HGNpo";

const headers = {
  "apikey": anonKey,
  "Authorization": `Bearer ${anonKey}`,
  "Content-Type": "application/json"
};

async function run() {
  try {
    console.log("--- Fetching all tasks in THE FREQUENCY FIELD ---");
    // Find module for THE FREQUENCY FIELD
    const modRes = await fetch(`${url}/modules?title=ilike.*frequency*&select=*`, { headers });
    const modules = await modRes.json();
    console.log("Modules found:", modules.map(m => ({ id: m.id, title: m.title })));

    for (const mod of modules) {
      console.log(`\n================ MODULE: ${mod.title} (${mod.id}) ================`);
      const lessonsRes = await fetch(`${url}/lessons?module_id=eq.${mod.id}&select=id,title,day_number`, { headers });
      const lessons = await lessonsRes.json();
      
      const lessonIds = lessons.map(l => l.id);
      if (lessonIds.length === 0) continue;

      const tasksRes = await fetch(`${url}/tasks?lesson_id=in.(${lessonIds.join(',')})&select=*`, { headers });
      const tasks = await tasksRes.json();
      console.log(`Tasks count: ${tasks.length}`);
      console.log(JSON.stringify(tasks, null, 2));
    }
  } catch (err) {
    console.error(err);
  }
}

run();
