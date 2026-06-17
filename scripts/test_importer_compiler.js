const url = "https://phytcoyaemsehsezbruy.supabase.co/rest/v1";
const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBoeXRjb3lhZW1zZWhzZXpicnV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4MDA5NDAsImV4cCI6MjA5MzM3Njk0MH0.fTPenRdec6P_JK5Q1SpyzUUypdr0D6W4v-aH7bw_HU8";

const headers = {
  "apikey": anonKey,
  "Authorization": `Bearer ${anonKey}`,
  "Content-Type": "application/json",
  "Prefer": "return=representation"
};

// Simple replica of chamber key matching from chambersData.ts
const CHAMBERS_INFO = {
  'mental-clarity': { name: 'MENTAL CLARITY' },
  'frequency-field': { name: 'THE FREQUENCY FIELD' }
};

function matchChamberKey(moduleTitle) {
  if (!moduleTitle) return '';
  const cleanTitle = moduleTitle.replace(/^(chamber\s*\d+\s*[:\-]?\s*|\d+\s*[:\-]?\s*)/i, '').trim().toLowerCase();
  
  return Object.keys(CHAMBERS_INFO).find(key => {
    const chamberName = CHAMBERS_INFO[key].name.toLowerCase();
    return cleanTitle.includes(chamberName) || chamberName.includes(cleanTitle);
  }) || '';
}

async function runTest() {
  let mockProgram = null;
  try {
    console.log("=== STARTING END-TO-END IMPORTER & QUERY TEST ===");
    
    // 1. Create a mock program
    console.log("\n1. Creating Mock Program...");
    const progRes = await fetch(`${url}/programs`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        title: "E2E Importer Test Program",
        duration_days: 7
      })
    });
    if (!progRes.ok) throw new Error(`Failed to create program: ${await progRes.text()}`);
    mockProgram = (await progRes.json())[0];
    console.log(`Mock Program Created: ${mockProgram.title} (${mockProgram.id})`);

    // 2. Simulate the deletion step of existing modules for this program
    console.log("\n2. Simulating Module Cleanup Step...");
    const delRes = await fetch(`${url}/modules?program_id=eq.${mockProgram.id}`, {
      method: "DELETE",
      headers
    });
    if (!delRes.ok) throw new Error(`Failed to clean up modules: ${await delRes.text()}`);
    console.log("Module cleanup completed successfully.");

    // 3. Create modules and lessons like the compile function
    console.log("\n3. Creating Modules, Lessons and Tasks (Day 0 & Day 1)...");
    const mockModulesData = [
      { title: "MENTAL CLARITY", order_index: 1 },
      { title: "THE FREQUENCY FIELD", order_index: 2 }
    ];

    for (const modData of mockModulesData) {
      // Create Module
      const modRes = await fetch(`${url}/modules`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          program_id: mockProgram.id,
          title: modData.title,
          order_index: modData.order_index
        })
      });
      const savedModule = (await modRes.json())[0];
      console.log(`Created Module: "${savedModule.title}" (${savedModule.id})`);

      // Create Chamber Pool (Day 0) Lesson
      const poolLessonRes = await fetch(`${url}/lessons`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          module_id: savedModule.id,
          title: "Chamber Pool",
          day_number: 0,
          unlock_day: 0,
          description: "<p>Chamber tasks pool</p>"
        })
      });
      const poolLesson = (await poolLessonRes.json())[0];
      console.log(`  -> Created Chamber Pool Lesson (${poolLesson.id})`);

      // Create Day 1 Lesson
      const day1LessonRes = await fetch(`${url}/lessons`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          module_id: savedModule.id,
          title: "Day 1 — Ignition",
          day_number: 1,
          unlock_day: 1,
          description: "<p>Day 1 routine</p>"
        })
      });
      const day1Lesson = (await day1LessonRes.json())[0];
      console.log(`  -> Created Day 1 Lesson (${day1Lesson.id})`);

      // Create a task and add it to BOTH lessons
      const taskData = {
        title: `${modData.title} D1 Task`,
        type: "audio"
      };

      // Task 1: Master task in Pool Lesson (Day 0)
      const poolTaskRes = await fetch(`${url}/tasks`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          lesson_id: poolLesson.id,
          title: taskData.title,
          type: taskData.type,
          order_index: 1,
          content: {
            routine_window: "",
            url: "https://example.com/audio.mp3",
            text: "Instruction text for pool"
          }
        })
      });
      const poolTask = (await poolTaskRes.json())[0];
      console.log(`     => Added Pool Task: "${poolTask.title}" (${poolTask.id}) to Day 0`);

      // Task 2: Allotted task in Day 1 Lesson
      const day1TaskRes = await fetch(`${url}/tasks`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          lesson_id: day1Lesson.id,
          title: taskData.title,
          type: taskData.type,
          order_index: 1,
          content: {
            routine_window: "Morning",
            url: "https://example.com/audio.mp3",
            text: "Instruction text for Day 1"
          }
        })
      });
      const day1Task = (await day1TaskRes.json())[0];
      console.log(`     => Added Day 1 Task: "${day1Task.title}" (${day1Task.id}) to Day 1`);
    }

    // 4. Simulate the client query and matching logic
    console.log("\n4. Fetching Program Details using useProgramDetails select structure...");
    const detailsRes = await fetch(`${url}/programs?id=eq.${mockProgram.id}&select=*,modules(*,lessons(*,tasks(*)))`, { headers });
    const programDetails = (await detailsRes.json())[0];

    console.log("\n5. Testing Client-side Chamber Routing & Filtering...");
    const testChamberIds = ["mental-clarity", "frequency-field"];
    for (const chamberId of testChamberIds) {
      console.log(`\n--- Chamber: ${chamberId} ---`);
      
      const matchedModule = programDetails.modules.find(
        (mod) => matchChamberKey(mod.title) === chamberId
      );
      console.log(`Matched Module: ${matchedModule ? `"${matchedModule.title}" (${matchedModule.id})` : "NONE"}`);
      
      if (matchedModule) {
        const matchedLesson = matchedModule.lessons.find(
          (less) => less.day_number === 0
        );
        console.log(`Matched Chamber Pool Lesson: ${matchedLesson ? `"${matchedLesson.title}" (${matchedLesson.id})` : "NONE"}`);
        
        if (matchedLesson) {
          console.log(`Tasks in pool count: ${matchedLesson.tasks.length}`);
          matchedLesson.tasks.forEach((t, idx) => {
            console.log(`  [Task ${idx + 1}] Title: "${t.title}" | Type: ${t.type} | Lesson ID: ${t.lesson_id}`);
          });
        }
      }
    }

  } catch (err) {
    console.error("Test execution failed:", err);
  } finally {
    if (mockProgram) {
      console.log("\n=== CLEANING UP MOCK PROGRAM ===");
      const cleanupRes = await fetch(`${url}/programs?id=eq.${mockProgram.id}`, {
        method: "DELETE",
        headers
      });
      if (cleanupRes.ok) {
        console.log("Mock Program deleted successfully (all cascading entities removed).");
      } else {
        console.error("Failed to delete mock program:", await cleanupRes.text());
      }
    }
  }
}

runTest();
