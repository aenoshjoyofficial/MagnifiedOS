const url = "https://phytcoyaemsehsezbruy.supabase.co/rest/v1";
const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBoeXRjb3lhZW1zZWhzZXpicnV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4MDA5NDAsImV4cCI6MjA5MzM3Njk0MH0.fTPenRdec6P_JK5Q1SpyzUUypdr0D6W4v-aH7bw_HU8";

const headers = {
  "apikey": anonKey,
  "Authorization": `Bearer ${anonKey}`,
  "Content-Type": "application/json"
};

async function check() {
  try {
    console.log("--- Fetching Programs ---");
    const programsRes = await fetch(`${url}/programs?select=id,title,duration_days`, { headers });
    const programs = await programsRes.json();
    console.log(JSON.stringify(programs, null, 2));

    if (programs.length === 0) {
      console.log("No programs found.");
      return;
    }

    const latestProgram = programs[0];
    console.log(`\nUsing program: ${latestProgram.title} (${latestProgram.id})`);

    console.log("\n--- Fetching Modules for Program ---");
    const modulesRes = await fetch(`${url}/modules?program_id=eq.${latestProgram.id}&select=id,title,order_index`, { headers });
    const modules = await modulesRes.json();
    console.log(JSON.stringify(modules, null, 2));

    for (const mod of modules) {
      console.log(`\n================ MODULE: ${mod.title} (${mod.id}) ================`);
      const lessonsRes = await fetch(`${url}/lessons?module_id=eq.${mod.id}&select=id,title,day_number`, { headers });
      const lessons = await lessonsRes.json();
      console.log("Lessons found:", lessons.length);
      console.log(JSON.stringify(lessons, null, 2));

      // Check tasks for day_number = 0 lessons
      const poolLesson = lessons.find(l => l.day_number === 0);
      if (poolLesson) {
        console.log(`\nChecking tasks for Chamber Pool Lesson (${poolLesson.id}):`);
        const tasksRes = await fetch(`${url}/tasks?lesson_id=eq.${poolLesson.id}&select=id,title,type,content`, { headers });
        const tasks = await tasksRes.json();
        console.log(`Tasks in pool count: ${tasks.length}`);
        console.log(JSON.stringify(tasks, null, 2));
      } else {
        console.log("WARNING: Day 0 Chamber Pool lesson NOT found for this module!");
      }
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

check();
