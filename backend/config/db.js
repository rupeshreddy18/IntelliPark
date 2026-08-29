const mongoose = require("mongoose");

/**
 * Connect to MongoDB.
 *
 * Supports three modes:
 *   1. MONGO_URI set → connects to that URI (Atlas or local)
 *   2. MONGO_URI not set + development → uses in-memory MongoDB for testing
 *   3. MONGO_URI not set + production → exits with error
 *
 * In-memory MongoDB is useful for:
 *   - Quick development without installing MongoDB locally
 *   - Testing without affecting a real database
 *   - Demo purposes
 *
 * For production, ALWAYS use a real MongoDB (e.g., MongoDB Atlas).
 */
const connectDB = async () => {
  try {
    let uri = process.env.MONGO_URI;

    // If no URI and in development, try in-memory MongoDB
    if (!uri || uri.trim() === "") {
      if (process.env.NODE_ENV === "production") {
        console.error("❌ MONGO_URI is required in production.");
        process.exit(1);
      }

      console.log(
        "⚠️  MONGO_URI not set. Starting in-memory MongoDB for development...",
      );
      try {
        const { MongoMemoryServer } = require("mongodb-memory-server");
        const mongod = await MongoMemoryServer.create();
        uri = mongod.getUri();
        console.log("✅ In-memory MongoDB started");
      } catch (err) {
        console.error("❌ Failed to start in-memory MongoDB.");
        console.error(
          "   Install it: npm install mongodb-memory-server --save-dev",
        );
        console.error("   Or set MONGO_URI in your .env file.");
        process.exit(1);
      }
    }

    const conn = await mongoose.connect(uri);
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

// Gracefully close connection when the app shuts down
process.on("SIGINT", async () => {
  await mongoose.connection.close();
  console.log("MongoDB connection closed (app termination)");
  process.exit(0);
});

module.exports = connectDB;
