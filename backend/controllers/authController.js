const jwt = require("jsonwebtoken");
const User = require("../models/User");
const AppError = require("../utils/AppError");

/**
 * Generate JWT token and set it as an HTTP-only cookie.
 *
 * The token contains:
 *   - id: the user's MongoDB _id
 *   - role: the user's role ('user' or 'admin')
 *
 * It does NOT contain:
 *   - password or password hash
 *   - email or other personal data (minimize payload)
 *
 * The cookie settings:
 *   - httpOnly: true → JavaScript cannot access it (XSS protection)
 *   - secure: true in production → only sent over HTTPS
 *   - sameSite: depends on deployment (see comments below)
 *   - maxAge: 24 hours
 */
const generateTokenAndSetCookie = (user, statusCode, res) => {
  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "24h" },
  );

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  };

  // In production with cross-origin (frontend and backend on different domains),
  // we need sameSite: 'none' so the cookie is sent cross-origin.
  // In development (same-origin localhost), 'strict' is fine.
  if (process.env.NODE_ENV === "production") {
    cookieOptions.sameSite = "none";
  } else {
    cookieOptions.sameSite = "strict";
  }

  res.cookie("token", token, cookieOptions);

  // Return user data WITHOUT the password
  res.status(statusCode).json({
    success: true,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    },
  });
};

/**
 * @route   POST /api/users/register
 * @desc    Register a new user
 * @access  Public
 *
 * Flow:
 *   1. Extract name, email, password from request body
 *   2. NEVER accept 'role' from the request (always defaults to 'user')
 *   3. Check if email already exists
 *   4. Create user (password is auto-hashed by the pre-save hook)
 *   5. Generate JWT and set cookie
 *   6. Return user data (never the password)
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      email: email.toLowerCase().trim(),
    });
    if (existingUser) {
      return next(
        new AppError("An account with this email already exists.", 409),
      );
    }

    // Create user — role is NOT accepted from the request body
    const user = await User.create({
      name,
      email,
      password,
      // role defaults to 'user' in the schema
    });

    generateTokenAndSetCookie(user, 201, res);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/users/login
 * @desc    Authenticate user and get token
 * @access  Public
 *
 * Flow:
 *   1. Extract email and password
 *   2. Find user by email (explicitly select password field)
 *   3. Compare entered password with stored hash using bcrypt
 *   4. If match → generate JWT, set cookie, return user
 *   5. If no match → return generic error (don't reveal which field is wrong)
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user and explicitly include the password field
    // (it has select: false in the schema)
    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    }).select("+password");

    if (!user) {
      return next(new AppError("Invalid email or password.", 401));
    }

    // Compare password using bcrypt
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return next(new AppError("Invalid email or password.", 401));
    }

    generateTokenAndSetCookie(user, 200, res);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/users/logout
 * @desc    Clear the auth cookie
 * @access  Public
 *
 * Sets the cookie to an empty value with immediate expiry.
 * The client's cookie is effectively deleted.
 */
const logout = async (req, res, next) => {
  try {
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      expires: new Date(0), // Expire immediately
    };

    if (process.env.NODE_ENV === "production") {
      cookieOptions.sameSite = "none";
    } else {
      cookieOptions.sameSite = "strict";
    }

    res.cookie("token", "", cookieOptions);

    res.status(200).json({
      success: true,
      message: "Logged out successfully.",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/users/me
 * @desc    Get current authenticated user's profile
 * @access  Private (requires auth middleware)
 *
 * req.user is set by the auth middleware after JWT verification.
 * We never trust a userId from the request body or URL.
 */
const getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      user: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        createdAt: req.user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/users/me
 * @desc    Update current user's profile (name only for now)
 * @access  Private
 *
 * Users can update their name. Email changes are not allowed
 * to keep the auth flow simple. Password changes could be
 * added as a future feature.
 */
const updateMe = async (req, res, next) => {
  try {
    const { name } = req.body;

    if (!name || name.trim() === "") {
      return next(new AppError("Name is required.", 400));
    }

    // Update only allowed fields
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name: name.trim() },
      { new: true, runValidators: true },
    );

    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, logout, getMe, updateMe };
