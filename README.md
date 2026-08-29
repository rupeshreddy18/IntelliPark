# IntelliPark — Smart Parking Slot Management System

A full-stack MERN (MongoDB, Express.js, React.js, Node.js) parking slot management system with real-time availability, booking management, and admin controls.

## Overview

IntelliPark allows users to browse parking slot availability, book slots for specific time periods, and manage their reservations. Administrators can manage parking slots, view system-wide statistics, and handle bookings.

## Features

### User Features
- **Registration & Login** — Secure authentication with JWT and bcrypt
- **Parking Slot Browser** — View all slots with color-coded status (Available/Occupied/Maintenance)
- **Zone Filtering** — Filter slots by parking zone (A, B, C, D)
- **Booking System** — Book available slots for specific dates and time ranges
- **My Bookings** — View booking history with status filtering
- **Booking Cancellation** — Cancel confirmed bookings with confirmation dialog
- **Profile Management** — View and edit profile information

### Admin Features
- **Admin Dashboard** — System-wide statistics (slots, bookings, users)
- **Slot Management** — Add, edit, and delete parking slots
- **Booking Management** — View all bookings, mark as completed, or cancel
- **User Management** — View all registered users

### Security Features
- **Password Hashing** — bcrypt with 10 salt rounds
- **JWT Authentication** — HTTP-only secure cookies
- **Role-Based Authorization** — Backend-enforced admin/user roles
- **User Data Isolation** — Users cannot access other users' data
- **Rate Limiting** — Login/registration endpoints protected
- **CORS Restriction** — Only the configured frontend origin allowed
- **Input Validation** — Server-side validation on all endpoints
- **Double-Booking Prevention** — Application-level + database-level protection

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6, Axios |
| Styling | Vanilla CSS with CSS Custom Properties |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Authentication | JWT (jsonwebtoken), bcryptjs |
| Security | helmet, cors, express-rate-limit |
| Dev Tools | Vite, morgan |

## Architecture

```
Client (React) → HTTP/REST → Express Server → Mongoose → MongoDB
    │                              │
    │ HTTP-only Cookie (JWT)       │ Middleware Chain:
    │ with credentials             │ helmet → cors → cookie-parser →
    └──────────────────────────────│ rate-limit → auth → admin → controller
                                   │
                                   └→ Centralized Error Handler
```

## Database Design

### User
| Field | Type | Constraints |
|-------|------|-------------|
| name | String | Required, max 50 chars |
| email | String | Required, unique, lowercase |
| password | String | Required, min 6 chars, select: false |
| role | String | Enum: user, admin. Default: user |
| createdAt | Date | Auto-generated |

### ParkingSlot
| Field | Type | Constraints |
|-------|------|-------------|
| slotNumber | String | Required, unique, uppercase |
| zone | String | Required, uppercase |
| status | String | Enum: AVAILABLE, OCCUPIED, MAINTENANCE |
| createdAt | Date | Auto-generated |

### Booking
| Field | Type | Constraints |
|-------|------|-------------|
| user | ObjectId | Ref: User |
| parkingSlot | ObjectId | Ref: ParkingSlot |
| bookingDate | Date | Required |
| startTime | String | Required, HH:MM format |
| endTime | String | Required, HH:MM format |
| status | String | Enum: CONFIRMED, CANCELLED, COMPLETED |
| createdAt | Date | Auto-generated |

### Indexes
- `User.email` — unique (fast login, prevent duplicates)
- `ParkingSlot.slotNumber` — unique (prevent duplicate slots)
- `Booking(parkingSlot, bookingDate, status)` — compound (fast overlap queries)
- `Booking(user, status)` — compound (fast user booking lookups)
- `Booking(parkingSlot, bookingDate, startTime)` — partial unique where status='CONFIRMED' (double-booking prevention)

## Authentication

1. **Register**: Validate → check duplicate email → hash password (bcrypt) → create user → generate JWT → set HTTP-only cookie
2. **Login**: Validate → find user → compare password (bcrypt) → generate JWT → set HTTP-only cookie
3. **Auth Check**: Extract JWT from cookie → verify signature + expiry → find user by ID → attach to request
4. **Logout**: Clear the HTTP-only cookie

JWT is stored in HTTP-only cookies (not localStorage) to prevent XSS token theft.

## Authorization

| Action | User | Admin |
|--------|------|-------|
| View slots | ✅ | ✅ |
| Book slots | ✅ | ✅ |
| View own bookings | ✅ | ✅ |
| Cancel own bookings | ✅ | ✅ |
| View/edit profile | ✅ | ✅ |
| Manage slots (CRUD) | ❌ | ✅ |
| View all bookings | ❌ | ✅ |
| Complete/cancel any booking | ❌ | ✅ |
| View all users | ❌ | ✅ |
| View system stats | ❌ | ✅ |

**Backend enforcement**: Every admin endpoint checks `req.user.role === 'admin'`. Hiding admin UI in React is NOT security — the API enforces it.

## Booking Logic

Before creating a booking, the backend verifies:
1. User is authenticated (JWT middleware)
2. Slot exists in the database
3. Slot is not under MAINTENANCE
4. Booking date is valid and not in the past
5. Start time is before end time
6. If booking is today, start time is not in the past
7. No overlapping CONFIRMED booking exists for this slot
8. User doesn't already have an overlapping booking (any slot)

## Double-Booking Prevention

**Two layers of protection:**

1. **Application-level**: Before creating a booking, queries for overlapping CONFIRMED bookings on the same slot/date/time range
2. **Database-level**: A partial unique compound index `(parkingSlot, bookingDate, startTime)` where `status='CONFIRMED'` causes MongoDB to reject concurrent duplicate inserts

If User A and User B both click "Book" simultaneously:
- Both pass the application-level check (small race window)
- MongoDB's unique index rejects the second insert → returns 409 Conflict

## API Endpoints

### Auth (`/api/users`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /register | Public | Register |
| POST | /login | Public | Login |
| POST | /logout | Public | Logout |
| GET | /me | User | Current profile |
| PUT | /me | User | Update profile |

### Parking (`/api/parking`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | / | User | List all slots |
| GET | /:id | User | Get one slot |
| POST | / | Admin | Create slot |
| PUT | /:id | Admin | Update slot |
| DELETE | /:id | Admin | Delete slot |

### Bookings (`/api/bookings`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | / | User | Create booking |
| GET | /my | User | My bookings |
| GET | /:id | User | Single booking |
| PUT | /:id/cancel | User | Cancel booking |

### Admin (`/api/admin`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /stats | Admin | Dashboard stats |
| GET | /users | Admin | List users |
| GET | /bookings | Admin | List all bookings |
| PUT | /bookings/:id/complete | Admin | Complete booking |
| PUT | /bookings/:id/cancel | Admin | Cancel booking |

## Environment Variables

```env
MONGO_URI=                    # MongoDB connection string
JWT_SECRET=                   # JWT signing secret
PORT=5000                     # Server port
CLIENT_URL=http://localhost:5173  # Frontend URL for CORS
NODE_ENV=development          # development or production
DEMO_ADMIN_EMAIL=admin@intellipark.com
DEMO_ADMIN_PASSWORD=          # Set for seed script
DEMO_USER_EMAIL=user@intellipark.com
DEMO_USER_PASSWORD=           # Set for seed script
```

## Installation

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas) — optional for development (in-memory fallback available)

### Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/intellipark.git
cd intellipark

# Backend setup
cd backend
npm install
cp ../.env.example .env
# Edit .env with your values

# Frontend setup
cd ../frontend
npm install
```

## Running Locally

```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start frontend
cd frontend
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- Health check: http://localhost:5000/api/health

## Seed Data

Populate the database with 20 parking slots and demo accounts:

```bash
cd backend
npm run seed
```

This creates:
- 20 parking slots across zones A, B, C, D
- Demo admin: admin@intellipark.com
- Demo user: user@intellipark.com

The seed script is safe to re-run — it skips existing data.

## Demo Instructions

1. Start both frontend and backend
2. Run the seed script
3. Login as admin: `admin@intellipark.com` / password from your .env
4. Browse the admin dashboard, manage slots
5. Open a new browser (incognito) and login as user: `user@intellipark.com`
6. Browse available slots, create a booking
7. Try booking an occupied or maintenance slot (should fail)
8. Cancel a booking and see the slot become available

## Future Improvements

- Socket.IO for real-time slot availability updates
- Email notifications for booking confirmations
- Automated booking completion (cron-based)
- Payment integration
- Parking lot map visualization
- Multi-floor parking support
- Mobile app (React Native)

## License

ISC
#   I n t e l l i P a r k  
 