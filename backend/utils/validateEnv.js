/**
 * Validates that all required environment variables are set.
 * Called once at server startup.
 *
 * If any required variable is missing, the server exits immediately
 * with a clear error message instead of crashing mysteriously later.
 */
const validateEnv = () => {
  const required = ["JWT_SECRET"];
  // MONGO_URI is required only in production (dev can use in-memory MongoDB)
  if (process.env.NODE_ENV === "production") {
    required.push("MONGO_URI");
  }
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error("❌ Missing required environment variables:");
    missing.forEach((key) => console.error(`   - ${key}`));
    console.error("\nCopy .env.example to .env and fill in the values.");
    process.exit(1);
  }

  // Warn about optional but recommended variables
  const recommended = ["CLIENT_URL"];
  const missingRecommended = recommended.filter((key) => !process.env[key]);

  if (missingRecommended.length > 0) {
    console.warn("⚠️  Missing recommended environment variables:");
    missingRecommended.forEach((key) => console.warn(`   - ${key}`));
    console.warn("   Using defaults. Set these for production.\n");
  }
};

module.exports = validateEnv;
