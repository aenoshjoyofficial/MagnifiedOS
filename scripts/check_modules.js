const url = "https://phytcoyaemsehsezbruy.supabase.co/rest/v1";
const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBoeXRjb3lhZW1zZWhzZXpicnV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4MDA5NDAsImV4cCI6MjA5MzM3Njk0MH0.fTPenRdec6P_JK5Q1SpyzUUypdr0D6W4v-aH7bw_HU8";

const headers = {
  "apikey": anonKey,
  "Authorization": `Bearer ${anonKey}`,
  "Content-Type": "application/json"
};

async function checkModules() {
  try {
    console.log("--- Fetching all modules ---");
    const modulesRes = await fetch(`${url}/modules?select=id,title,program_id`, { headers });
    const modules = await modulesRes.json();
    console.log(JSON.stringify(modules, null, 2));

    console.log("\n--- Testing Module Delete to see if it fails due to FK constraints ---");
    const testMod = modules.find(m => m.title === "TEST MENTAL CLARITY");
    if (testMod) {
      console.log(`Found TEST MENTAL CLARITY module (${testMod.id}), trying to delete...`);
      const delRes = await fetch(`${url}/modules?id=eq.${testMod.id}`, {
        method: "DELETE",
        headers
      });
      if (!delRes.ok) {
        const errorText = await delRes.text();
        console.error(`DELETE failed with status ${delRes.status}:`, errorText);
      } else {
        console.log("DELETE succeeded! (which means cascade delete is supported and working)");
      }
    } else {
      console.log("TEST MENTAL CLARITY module not found.");
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

checkModules();
