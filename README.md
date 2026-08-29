# IntelliPark — Smart Parking Slot Management System

IntelliPark is a full-stack smart parking management system built using the MERN stack. It allows users to view parking slot availability, book slots for specific time periods, manage their reservations, while administrators can manage parking slots, users, and bookings.

## Live Demo

- Frontend: [Add deployed frontend URL]
- Backend API: [Add deployed backend URL]

## Features

### User Features

- User registration and login
- JWT-based authentication
- Secure password hashing using bcrypt
- View real-time parking slot availability
- Filter parking slots by zone
- Book available parking slots for a selected date and time
- View personal booking history
- Cancel bookings
- Manage user profile
- Prevent users from accessing other users' data

### Admin Features

- Admin authentication and authorization
- Dashboard with system statistics
- Add, edit, and delete parking slots
- View all users
- View all bookings
- Complete bookings
- Cancel bookings
- Manage parking slot status

### Booking & Security

- Prevent booking parking slots in maintenance
- Prevent booking dates in the past
- Validate start and end times
- Prevent overlapping bookings
- Prevent a user from making overlapping bookings
- Application-level double-booking checks
- Database-level protection against concurrent duplicate bookings
- Backend-enforced role-based authorization
- HTTP-only cookies for JWT authentication
- Rate limiting on authentication endpoints
- CORS protection
- Server-side input validation

## Tech Stack

### Frontend
- React
- React Router
- Axios
- Vite
- CSS

### Backend
- Node.js
- Express.js
- Mongoose
- REST APIs

### Database
- MongoDB / MongoDB Atlas

### Authentication & Security
- JSON Web Tokens (JWT)
- bcrypt
- HTTP-only cookies
- Helmet
- CORS
- Express Rate Limit

## System Architecture

```text
React Frontend
      |
      | HTTP / REST API
      ↓
Express.js Backend
      |
      | Mongoose
      ↓
MongoDB Atlas

Authentication:
React → HTTP-only Cookie → JWT Middleware → Protected API
