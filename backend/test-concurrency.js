const axios = require("axios");

/**
 * Concurrency Test Script
 *
 * This script tests the double-booking prevention mechanism.
 * It attempts to book the EXACT SAME parking slot for the EXACT SAME time
 * using two different users at the exact same millisecond.
 *
 * Expected Result:
 * - One request should succeed (201 Created)
 * - The other request should fail (409 Conflict - Slot already booked)
 *
 * Instructions:
 * 1. Start the backend server (`npm run dev`)
 * 2. Run the seed script to create test users and slots (`npm run seed`)
 * 3. Run this script: `node test-concurrency.js`
 */

const API_URL = "http://localhost:5000/api";
let user1Token = "";
let user2Token = "";
let targetSlotId = "";

async function runConcurrencyTest() {
  console.log("🚗 IntelliPark Concurrency Test");
  console.log("================================");

  try {
    // 1. Authenticate both users to get their JWT tokens
    console.log("\n🔐 Authenticating users...");

    // We use the auth endpoints which return the JWT in the response body
    // for this script (or we can extract from set-cookie header if we modify the script)
    // Actually, our API uses HTTP-only cookies. Since we are using axios in Node,
    // we need to capture the set-cookie header and send it in subsequent requests.

    const loginUser1 = await axios.post(`${API_URL}/users/login`, {
      email: "admin@intellipark.com",
      password: "Admin@123",
    });
    const cookie1 = loginUser1.headers["set-cookie"][0];

    const loginUser2 = await axios.post(`${API_URL}/users/login`, {
      email: "user@intellipark.com",
      password: "User@123",
    });
    const cookie2 = loginUser2.headers["set-cookie"][0];

    console.log("✅ Users authenticated");

    // 2. Get available parking slots
    console.log("\n🔍 Finding an available parking slot...");
    const slotsRes = await axios.get(`${API_URL}/parking`, {
      headers: { Cookie: cookie1 },
    });

    const availableSlot = slotsRes.data.slots.find(
      (s) => s.status === "AVAILABLE",
    );
    if (!availableSlot) {
      console.log("❌ No available slots found. Run the seed script first.");
      process.exit(1);
    }

    targetSlotId = availableSlot._id;
    console.log(
      `✅ Found slot: ${availableSlot.slotNumber} (Zone ${availableSlot.zone})`,
    );

    // 3. Prepare the identical booking payload
    // Use tomorrow's date to avoid "past time" errors
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateString = tomorrow.toISOString().split("T")[0];

    const bookingPayload = {
      parkingSlotId: targetSlotId,
      bookingDate: dateString,
      startTime: "10:00",
      endTime: "12:00",
    };

    console.log("\n🚀 Launching concurrent booking requests...");
    console.log(`Payload: Date ${dateString}, 10:00 - 12:00`);

    // 4. Fire both requests simultaneously using Promise.allSettled
    const startTime = Date.now();

    const req1 = axios.post(`${API_URL}/bookings`, bookingPayload, {
      headers: { Cookie: cookie1 },
    });

    const req2 = axios.post(`${API_URL}/bookings`, bookingPayload, {
      headers: { Cookie: cookie2 },
    });

    const results = await Promise.allSettled([req1, req2]);
    const endTime = Date.now();

    console.log(`\n⏱️  Requests completed in ${endTime - startTime}ms`);
    console.log("\n📊 Results:");

    let successCount = 0;
    let conflictCount = 0;

    results.forEach((result, index) => {
      const user = index === 0 ? "User 1 (Admin)" : "User 2 (Regular)";

      if (result.status === "fulfilled") {
        successCount++;
        console.log(
          `✅ [${user}] SUCCESS: Booking created (Status: ${result.value.status})`,
        );
      } else {
        const error = result.reason;
        if (error.response) {
          if (error.response.status === 409) {
            conflictCount++;
            console.log(
              `🛡️  [${user}] BLOCKED (409 Conflict): ${error.response.data.message}`,
            );
          } else {
            console.log(
              `❌ [${user}] FAILED (${error.response.status}): ${error.response.data.message}`,
            );
          }
        } else {
          console.log(`❌ [${user}] NETWORK ERROR: ${error.message}`);
        }
      }
    });

    console.log("\n📝 Summary:");
    if (successCount === 1 && conflictCount === 1) {
      console.log("🏆 TEST PASSED: Double-booking was successfully prevented!");
      console.log("   One user got the slot, the other was blocked.");
    } else {
      console.log("⚠️ TEST FAILED: Unexpected results.");
      console.log(`   Successes: ${successCount}, Conflicts: ${conflictCount}`);
      console.log("   (Expected exactly 1 success and 1 conflict)");
    }
  } catch (error) {
    console.error("\n❌ Fatal Error during test:");
    if (error.response) {
      console.error(error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

runConcurrencyTest();
