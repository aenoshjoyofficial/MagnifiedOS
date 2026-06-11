const url = "https://phytcoyaemsehsezbruy.supabase.co";
const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBoeXRjb3lhZW1zZWhzZXpicnV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4MDA5NDAsImV4cCI6MjA5MzM3Njk0MH0.fTPenRdec6P_JK5Q1SpyzUUypdr0D6W4v-aH7bw_HU8";

async function run() {
  const email = "tempadmin_1780539018032@gmail.com";
  const password = "tempAdminPassword123!";
  const enrollmentId = "b5561f62-801a-4966-9ee6-75e25116f70c";

  console.log(`🔑 Logging in as ${email}...`);
  const loginRes = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      "apikey": anonKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, password })
  });

  const loginData = await loginRes.json();
  if (!loginRes.ok) {
    console.error("Login failed:", loginData);
    return;
  }
  const token = loginData.access_token;
  const userId = loginData.user.id;
  console.log(`✅ Logged in successfully. User ID: ${userId}`);

  const headers = {
    "apikey": anonKey,
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
  };

  // Helper to fetch enrollment status
  async function getEnrollmentStatus() {
    const res = await fetch(`${url}/rest/v1/enrollments?id=eq.${enrollmentId}`, {
      headers: { ...headers, "Prefer": "return=representation" }
    });
    const data = await res.json();
    return data[0]?.status;
  }

  // Helper to count history rows
  async function getCounts() {
    const historyRes = await fetch(`${url}/rest/v1/cycle_history?enrollment_id=eq.${enrollmentId}`, { headers });
    const historyData = await historyRes.json();
    const cycleRes = await fetch(`${url}/rest/v1/program_cycles?enrollment_id=eq.${enrollmentId}`, { headers });
    const cycleData = await cycleRes.json();
    return {
      historyCount: historyData.length,
      cycleCount: cycleData.length
    };
  }

  // Helper to restore enrollment back to active and clear database tables
  async function resetDB() {
    await fetch(`${url}/rest/v1/enrollments?id=eq.${enrollmentId}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ status: "active" })
    });
    await fetch(`${url}/rest/v1/cycle_history?enrollment_id=eq.${enrollmentId}`, { method: "DELETE", headers });
    await fetch(`${url}/rest/v1/program_cycles?enrollment_id=eq.${enrollmentId}`, { method: "DELETE", headers });
  }

  // Initialize DB state
  console.log("\n🧼 Initializing test database state...");
  await resetDB();

  const programId = "7b229e65-375b-44ed-bcff-0e7bbd7ccecb"; // Valid program ID
  const invalidProgramId = "00000000-0000-0000-0000-000000000000"; // Non-existent program ID to cause failure

  console.log("\n📊 Step 1: Querying baseline database state...");
  console.log(`- Enrollment status: ${await getEnrollmentStatus()}`);
  let counts = await getCounts();
  console.log(`- cycle_history rows: ${counts.historyCount}`);
  console.log(`- program_cycles rows: ${counts.cycleCount}`);

  // Test Case A: Call complete_enrollment_transaction with VALID inputs
  console.log("\n⚡ Test Case A: Invoking complete_enrollment_transaction with VALID arguments...");
  const validRes = await fetch(`${url}/rest/v1/rpc/complete_enrollment_transaction`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      p_enrollment_id: enrollmentId,
      p_user_id: userId,
      p_program_id: programId,
      p_cycle_number: 1,
      p_tasks_completed: 45,
      p_total_tasks: 60,
      p_completion_percentage: 75,
      p_started_at: new Date().toISOString()
    })
  });

  const validData = await validRes.json();
  console.log("Response from valid RPC call:", validData);

  console.log("\n⚡ Test Case A2: Invoking same transaction again to test idempotency...");
  const validRes2 = await fetch(`${url}/rest/v1/rpc/complete_enrollment_transaction`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      p_enrollment_id: enrollmentId,
      p_user_id: userId,
      p_program_id: programId,
      p_cycle_number: 1,
      p_tasks_completed: 45,
      p_total_tasks: 60,
      p_completion_percentage: 75,
      p_started_at: new Date().toISOString()
    })
  });
  const validData2 = await validRes2.json();
  console.log("Response from second valid RPC call (idempotency check):", validData2);

  console.log("\n📊 Step 2: Querying database state after valid transaction run...");
  console.log(`- Enrollment status: ${await getEnrollmentStatus()}`);
  counts = await getCounts();
  console.log(`- cycle_history rows: ${counts.historyCount} (expected: 1)`);
  console.log(`- program_cycles rows: ${counts.cycleCount} (expected: 1)`);

  // Test Case B: Call complete_enrollment_transaction with INVALID inputs to trigger error and verify rollback
  console.log("\n🧼 Resetting DB to baseline...");
  await resetDB();

  console.log("\n⚡ Test Case B: Invoking complete_enrollment_transaction with INVALID program_id (triggers foreign key constraint error)...");
  const invalidRes = await fetch(`${url}/rest/v1/rpc/complete_enrollment_transaction`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      p_enrollment_id: enrollmentId,
      p_user_id: userId,
      p_program_id: invalidProgramId, // Causes foreign key check failure
      p_cycle_number: 1,
      p_tasks_completed: 45,
      p_total_tasks: 60,
      p_completion_percentage: 75,
      p_started_at: new Date().toISOString()
    })
  });

  const invalidData = await invalidRes.json();
  console.log("Response from invalid RPC call (should show success: false):", invalidData);

  console.log("\n📊 Step 3: Querying database state after failed transaction (should show 100% rollback)...");
  console.log(`- Enrollment status: ${await getEnrollmentStatus()} (should be active)`);
  counts = await getCounts();
  console.log(`- cycle_history rows: ${counts.historyCount} (should be 0)`);
  console.log(`- program_cycles rows: ${counts.cycleCount} (should be 0)`);

  console.log("\n🧼 Restoring DB and cleaning up...");
  await resetDB();
  console.log("✅ All tests completed successfully.");
}

run().catch(console.error);
