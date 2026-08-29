/**
 * Seed Script — Populates the database with demo data.
 *
 * Creates:
 *   - 20 parking slots across 4 zones (A, B, C, D)
 *   - 1 demo admin account
 *   - 1 demo user account
 *
 * Safety features:
 *   - Checks if data already exists before creating (safe to re-run)
 *   - Never wipes existing data
 *   - Demo credentials come from environment variables
 *   - Never runs automatically in production
 *
 * Usage:
 *   npm run seed
 *
 * The script connects to MongoDB, seeds the data, and exits.
 */

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const User = require("../models/User");
const ParkingSlot = require("../models/ParkingSlot");

// 20 parking slots across 4 zones
const parkingSlots = [
  // Zone A (5 slots)
  { slotNumber: "A1", zone: "A", status: "AVAILABLE" },
  { slotNumber: "A2", zone: "A", status: "AVAILABLE" },
  { slotNumber: "A3", zone: "A", status: "AVAILABLE" },
  { slotNumber: "A4", zone: "A", status: "MAINTENANCE" }, // Under maintenance
  { slotNumber: "A5", zone: "A", status: "AVAILABLE" },

  // Zone B (5 slots)
  { slotNumber: "B1", zone: "B", status: "AVAILABLE" },
  { slotNumber: "B2", zone: "B", status: "AVAILABLE" },
  { slotNumber: "B3", zone: "B", status: "OCCUPIED" }, // Pre-occupied
  { slotNumber: "B4", zone: "B", status: "AVAILABLE" },
  { slotNumber: "B5", zone: "B", status: "AVAILABLE" },

  // Zone C (5 slots)
  { slotNumber: "C1", zone: "C", status: "AVAILABLE" },
  { slotNumber: "C2", zone: "C", status: "AVAILABLE" },
  { slotNumber: "C3", zone: "C", status: "AVAILABLE" },
  { slotNumber: "C4", zone: "C", status: "OCCUPIED" }, // Pre-occupied
  { slotNumber: "C5", zone: "C", status: "AVAILABLE" },

  // Zone D (5 slots)
  { slotNumber: "D1", zone: "D", status: "AVAILABLE" },
  { slotNumber: "D2", zone: "D", status: "AVAILABLE" },
  { slotNumber: "D3", zone: "D", status: "AVAILABLE" },
  { slotNumber: "D4", zone: "D", status: "AVAILABLE" },
  { slotNumber: "D5", zone: "D", status: "MAINTENANCE" }, // Under maintenance
];

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB for seeding");

    // --- Seed Parking Slots ---
    const existingSlots = await ParkingSlot.countDocuments();
    if (existingSlots > 0) {
      console.log(
        `ℹ️  Parking slots already exist (${existingSlots} found). Skipping slot seeding.`,
      );
    } else {
      await ParkingSlot.insertMany(parkingSlots);
      console.log(`✅ Created ${parkingSlots.length} parking slots`);
    }

    // --- Seed Demo Admin ---
    const adminEmail = process.env.DEMO_ADMIN_EMAIL || "admin@intellipark.com";
    const adminPassword = process.env.DEMO_ADMIN_PASSWORD;

    if (!adminPassword) {
      console.warn(
        "⚠️  DEMO_ADMIN_PASSWORD not set in .env. Skipping demo admin creation.",
      );
    } else {
      const existingAdmin = await User.findOne({ email: adminEmail });
      if (existingAdmin) {
        console.log(`ℹ️  Demo admin already exists (${adminEmail}). Skipping.`);
      } else {
        await User.create({
          name: "Admin User",
          email: adminEmail,
          password: adminPassword,
          role: "admin",
        });
        console.log(`✅ Created demo admin: ${adminEmail}`);
      }
    }

    // --- Seed Demo User ---
    const userEmail = process.env.DEMO_USER_EMAIL || "user@intellipark.com";
    const userPassword = process.env.DEMO_USER_PASSWORD;

    if (!userPassword) {
      console.warn(
        "⚠️  DEMO_USER_PASSWORD not set in .env. Skipping demo user creation.",
      );
    } else {
      const existingUser = await User.findOne({ email: userEmail });
      if (existingUser) {
        console.log(`ℹ️  Demo user already exists (${userEmail}). Skipping.`);
      } else {
        await User.create({
          name: "Demo User",
          email: userEmail,
          password: userPassword,
          role: "user",
        });
        console.log(`✅ Created demo user: ${userEmail}`);
      }
    }

    console.log("\n🎉 Seeding complete!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error.message);
    process.exit(1);
  }
};

seedDatabase();
