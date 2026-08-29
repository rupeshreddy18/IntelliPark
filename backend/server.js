/**
 * IntelliPark — Express Server Entry Point
 *
 * This file sets up the Express application with all middleware
 * and routes, then starts listening for requests.
 *
 * Middleware stack (order matters):
 *   1. helmet — Sets security HTTP headers
 *   2. morgan — HTTP request logging (dev only)
 *   3. cors — Cross-Origin Resource Sharing
 *   4. cookie-parser — Parses cookies from request headers
 *   5. express.json — Parses JSON request bodies
 *   6. Rate limiters — Protect auth endpoints from abuse
 *   7. Routes — API endpoints
 *   8. Error handler — Centralized error handling (MUST be last)
 */

const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");

// Load environment variables BEFORE anything else
dotenv.config();

const connectDB = require("./config/db");
const validateEnv = require("./utils/validateEnv");
const errorHandler = require("./middleware/errorHandler");

// Route imports
const authRoutes = require("./routes/authRoutes");
const parkingRoutes = require("./routes/parkingRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const adminRoutes = require("./routes/adminRoutes");

// Validate required environment variables
validateEnv();

// Create Express app
const app = express();

// ========================================
// SECURITY MIDDLEWARE
// ========================================

// Helmet: Sets various HTTP headers for security
// (e.g., X-Content-Type-Options, X-Frame-Options, etc.)
app.use(helmet());

// ========================================
// LOGGING (development only)
// ========================================
if (process.env.NODE_ENV !== "production") {
  // Morgan logs each HTTP request like: GET /api/parking 200 15ms
  app.use(morgan("dev"));
}

// ========================================
// CORS CONFIGURATION
// ========================================

// CORS allows the frontend (different origin) to call our API.
// We restrict it to only our frontend URL (not '*') because
// we're sending cookies (credentials).
const corsOptions = {
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true, // Allow cookies to be sent cross-origin
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type"],
};

app.use(cors(corsOptions));

// ========================================
// BODY PARSERS
// ========================================

// Parse cookies from the Cookie header
app.use(cookieParser());

// Parse JSON request bodies (with a size limit)
app.use(express.json({ limit: "10kb" }));

// ========================================
// RATE LIMITING
// ========================================

/**
 * Rate limiter for authentication endpoints.
 *
 * Prevents brute-force login attacks by limiting to
 * 10 requests per 15-minute window per IP address.
 *
 * This is a basic but effective protection.
 * For production at scale, you'd use a distributed
 * rate limiter (e.g., with Redis), but for this project
 * the in-memory limiter is sufficient.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Increased to 100 for easier testing/demoing
  message: {
    success: false,
    message: "Too many attempts. Please try again after 15 minutes.",
  },
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false,
});

// ========================================
// ROUTES
// ========================================

// Health check endpoint (useful for deployment monitoring)
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "IntelliPark API is running",
    environment: process.env.NODE_ENV || "development",
  });
});

// Auth routes with rate limiting
app.use("/api/users", authLimiter, authRoutes);

// Protected routes
app.use("/api/parking", parkingRoutes);
app.use("/api/bookings", bookingRoutes);

// Admin routes (auth + admin middleware applied at the router level)
app.use("/api/admin", adminRoutes);

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found.`,
  });
});

// ========================================
// ERROR HANDLER (must be last middleware)
// ========================================
app.use(errorHandler);

// ========================================
// START SERVER
// ========================================
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to MongoDB first
    await connectDB();

    // Auto-seed default parking slots if empty
    const ParkingSlot = require("./models/ParkingSlot");
    const count = await ParkingSlot.countDocuments();
    if (count === 0) {
      const defaultSlots = [
        { slotNumber: "A1", zone: "A", status: "AVAILABLE" },
        { slotNumber: "A2", zone: "A", status: "AVAILABLE" },
        { slotNumber: "A3", zone: "A", status: "AVAILABLE" },
        { slotNumber: "A4", zone: "A", status: "MAINTENANCE" },
        { slotNumber: "A5", zone: "A", status: "AVAILABLE" },
        { slotNumber: "B1", zone: "B", status: "AVAILABLE" },
        { slotNumber: "B2", zone: "B", status: "AVAILABLE" },
        { slotNumber: "B3", zone: "B", status: "OCCUPIED" },
        { slotNumber: "B4", zone: "B", status: "AVAILABLE" },
        { slotNumber: "B5", zone: "B", status: "AVAILABLE" },
        { slotNumber: "C1", zone: "C", status: "AVAILABLE" },
        { slotNumber: "C2", zone: "C", status: "AVAILABLE" },
        { slotNumber: "C3", zone: "C", status: "AVAILABLE" },
        { slotNumber: "C4", zone: "C", status: "OCCUPIED" },
        { slotNumber: "C5", zone: "C", status: "AVAILABLE" },
        { slotNumber: "D1", zone: "D", status: "AVAILABLE" },
        { slotNumber: "D2", zone: "D", status: "AVAILABLE" },
        { slotNumber: "D3", zone: "D", status: "AVAILABLE" },
        { slotNumber: "D4", zone: "D", status: "AVAILABLE" },
        { slotNumber: "D5", zone: "D", status: "MAINTENANCE" },
      ];
      await ParkingSlot.insertMany(defaultSlots);
      console.log(`✅ Auto-seeded ${defaultSlots.length} default parking slots (Zones A, B, C, D)`);
    }

    // Auto-seed admin and demo users
    const User = require("./models/User");
    const adminEmail = process.env.DEMO_ADMIN_EMAIL || "admin@intellipark.com";
    const adminPassword = process.env.DEMO_ADMIN_PASSWORD || "Admin@123";
    
    const adminCount = await User.countDocuments({ email: adminEmail });
    if (adminCount === 0) {
      await User.create({
        name: "Admin User",
        email: adminEmail,
        password: adminPassword,
        role: "admin",
      });
      console.log(`✅ Auto-seeded demo admin: ${adminEmail}`);
    }

    const userEmail = process.env.DEMO_USER_EMAIL || "user@intellipark.com";
    const userPassword = process.env.DEMO_USER_PASSWORD || "User@123";
    
    const userCount = await User.countDocuments({ email: userEmail });
    if (userCount === 0) {
      await User.create({
        name: "Demo User",
        email: userEmail,
        password: userPassword,
        role: "user",
      });
      console.log(`✅ Auto-seeded demo user: ${userEmail}`);
    }

    // Then start listening
    app.listen(PORT, () => {
      console.log(`\n🚀 IntelliPark API running on port ${PORT}`);
      console.log(`   Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`   Health check: http://localhost:${PORT}/api/health\n`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
