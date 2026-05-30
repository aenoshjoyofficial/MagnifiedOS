const url = "https://phytcoyaemsehsezbruy.supabase.co/rest/v1";
const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBoeXRjb3lhZW1zZWhzZXpicnV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4MDA5NDAsImV4cCI6MjA5MzM3Njk0MH0.fTPenRdec6P_JK5Q1SpyzUUypdr0D6W4v-aH7bw_HU8";

const headers = {
  "apikey": anonKey,
  "Authorization": `Bearer ${anonKey}`,
  "Content-Type": "application/json",
  "Prefer": "return=representation"
};

async function testSave() {
  try {
    console.log("START SAVE");
    console.log("BEFORE INSERT");
    const res = await fetch(`${url}/programs`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        title: "Test Node Program Save",
        duration_days: 10,
        is_published: false
      })
    });
    
    console.log("AFTER INSERT");
    console.log("Response status:", res.status);
    const data = await res.json();
    console.log("Response data:", data);
    console.log("DONE");
  } catch (err) {
    console.error("Caught error:", err);
  }
}

testSave();
