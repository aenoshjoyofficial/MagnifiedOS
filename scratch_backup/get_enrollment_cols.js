import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://evkkbwulppxazqgprefy.supabase.co";
const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2a2J3dWxwcHhhenFncHJlZnkiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc3NzgwMDk0MCwiZXhwIjoyMDkzMzc2OTQwfQ.xZ2cZ-8X_2y-U0Fh3_H5L12J_wK-56V1G2s3t4u5v6w";

const supabase = createClient(SUPABASE_URL, anonKey);

async function run() {
  const { data, error } = await supabase.from('enrollments').select('*').limit(1);
  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Columns:", Object.keys(data[0] || {}));
    console.log("Record:", data[0]);
  }
}

run();
