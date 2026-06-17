const url = "https://phytcoyaemsehsezbruy.supabase.co/rest/v1";
const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBoeXRjb3lhZW1zZWhzZXpicnV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4MDA5NDAsImV4cCI6MjA5MzM3Njk0MH0.fTPenRdec6P_JK5Q1SpyzUUypdr0D6W4v-aH7bw_HU8";

const headers = {
  "apikey": anonKey,
  "Authorization": `Bearer ${anonKey}`,
  "Content-Type": "application/json"
};

const caseyProgramId = "7b229e65-375b-44ed-bcff-0e7bbd7ccecb";

async function run() {
  try {
    console.log("--- Fetching Casey June Protocol Details ---");
    const res = await fetch(`${url}/programs?id=eq.${caseyProgramId}&select=*,modules(*,lessons(*,tasks(*)))`, { headers });
    const program = await res.json();
    console.log("Program:", program[0]?.title);
    console.log("Modules Count:", program[0]?.modules?.length);
    
    program[0]?.modules?.forEach(mod => {
      console.log(`\nModule: "${mod.title}" (ID: ${mod.id})`);
      mod.lessons?.forEach(les => {
        console.log(`  Lesson: "${les.title}" | Day: ${les.day_number} | ID: ${les.id}`);
        les.tasks?.forEach(task => {
          console.log(`    Task: "${task.title}" | LessonID: ${task.lesson_id} | Window: ${task.content?.routine_window || 'None'}`);
        });
      });
    });
  } catch (err) {
    console.error(err);
  }
}

run();
