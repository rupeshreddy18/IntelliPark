const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

/**
 * User Model
 *
 * Stores registered users with hashed passwords.
 *
 * Key design decisions:
 *   - password has `select: false` → never returned in queries unless explicitly requested
 *   - role defaults to 'user' → the register endpoint NEVER accepts a role from the client
 *   - email is lowercase + unique → prevents duplicate accounts and case-mismatch login failures
 *   - Pre-save middleware hashes the password automatically
 */
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
    maxlength: [50, "Name cannot exceed 50 characters"],
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      "Please provide a valid email address",
    ],
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [6, "Password must be at least 6 characters"],
    select: false, // Never return password in queries by default
  },
  role: {
    type: String,
    enum: {
      values: ["user", "admin"],
      message: "Role must be either user or admin",
    },
    default: "user",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

/**
 * Pre-save middleware: Hash password before saving to the database.
 *
 * Only hashes if the password field was modified (important for profile updates
 * where the user changes their name but not their password).
 *
 * bcrypt.genSalt(10) → generates a random salt with 10 rounds of processing.
 * More rounds = more secure but slower. 10 is the standard balance.
 */
userSchema.pre("save", async function (next) {
  // Only hash if password was modified
  if (!this.isModified("password")) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

/**
 * Instance method: Compare a plain-text password with the stored hash.
 *
 * bcrypt.compare() is timing-safe → prevents timing attacks.
 * Returns true if the password matches, false otherwise.
 */
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Index: email is already unique (defined above), which creates an index automatically.

const User = mongoose.model("User", userSchema);

module.exports = User;
