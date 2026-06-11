const url = "https://evkkbwulppxazqgprefy.supabase.co/rest/v1";
const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2a2tid3VscHB4YXpxZ3ByZWZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1NDIyNTEsImV4cCI6MjA5NjExODI1MX0.9Q3PIv4T-SLG9LtLreMjjJUW0T9jBaBzYMzWH0HGNpo";

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
  console.log("Checking tables on production Supabase...");
  await testTable("cycle_history");
  await testTable("program_cycles");
}

run();
