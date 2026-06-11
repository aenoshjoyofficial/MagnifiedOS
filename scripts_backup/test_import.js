const url = "https://phytcoyaemsehsezbruy.supabase.co/rest/v1";
const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBoeXRjb3lhZW1zZWhzZXpicnV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4MDA5NDAsImV4cCI6MjA5MzM3Njk0MH0.fTPenRdec6P_JK5Q1SpyzUUypdr0D6W4v-aH7bw_HU8";

const headers = {
  "apikey": anonKey,
  "Authorization": `Bearer ${anonKey}`,
  "Content-Type": "application/json",
  "Prefer": "return=representation"
};

async function test() {
  try {
    const programId = "18379735-064b-4ea0-9637-d8e0d139170a"; // Casey June Protocol

    console.log("1. Creating Test Module...");
    const modRes = await fetch(`${url}/modules`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        program_id: programId,
        title: "TEST MENTAL CLARITY",
        order_index: 99
      })
    });
    const mod = (await modRes.json())[0];
    console.log("Created Module:", mod);

    console.log("\n2. Creating Pool Lesson (day_number = 0)...");
    const lessonRes = await fetch(`${url}/lessons`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        module_id: mod.id,
        title: "Chamber Pool",
        day_number: 0,
        unlock_day: 0,
        description: "<p>Chamber tasks pool</p>"
      })
    });
    const lesson = (await lessonRes.json())[0];
    console.log("Created Lesson:", lesson);

    console.log("\n3. Creating Pool Task...");
    const taskRes = await fetch(`${url}/tasks`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        lesson_id: lesson.id,
        title: "Test Task in Pool",
        type: "audio",
        order_index: 1,
        content: {
          routine_window: "",
          url: "https://example.com/test.mp3",
          text: "Test instruction"
        }
      })
    });
    const task = (await taskRes.json())[0];
    console.log("Created Task:", task);

    console.log("\n--- CLEANING UP TEST DATA ---");
    await fetch(`${url}/modules?id=eq.${mod.id}`, {
      method: "DELETE",
      headers
    });
    console.log("Cleanup finished.");
  } catch (err) {
    console.error("Test failed:", err);
  }
}

test();
