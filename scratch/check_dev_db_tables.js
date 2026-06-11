const url = "https://phytcoyaemsehsezbruy.supabase.co/rest/v1";
const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBoeXRjb3lhZW1zZWhzZXpicnV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4MDA5NDAsImV4cCI6MjA5MzM3Njk0MH0.fTPenRdec6P_JK5Q1SpyzUUypdr0D6W4v-aH7bw_HU8";

const headers = {
  "apikey": anonKey,
  "Authorization": `Bearer ${anonKey}`,
  "Content-Type": "application/json"
};

async function testTable(tableName) {
  try {
    const res = await fetch(`${url}/${tableName}?select=*&limit=1`, { headers });
    if (res.ok) {
      const data = await res.json();
      console.log(`Table "${tableName}": EXISTS (status ${res.status}), sample keys:`, data.length > 0 ? Object.keys(data[0]) : "empty");
    } else {
      const text = await res.text();
      console.log(`Table "${tableName}": NOT FOUND or ERROR (status ${res.status}):`, text);
    }
  } catch (err) {
    console.error(`Error testing table ${tableName}:`, err.message);
  }
}

async function run() {
  console.log("Checking tables on development Supabase...");
  await testTable("task_completions");
  await testTable("user_progress");
  await testTable("cycle_history");
  await testTable("program_cycles");
  await testTable("enrollments");
  await testTable("profiles");
}

run();
