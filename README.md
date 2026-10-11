```markdown
# HustleHub+ — Secure Freelance Marketplace (MERN)

> **Video walkthrough:** https://youtu.be/5i6BAlv6qx0

HustleHub+ is a full-stack **MERN** freelance marketplace connecting **Clients** (hire talent) with **Freelancers** (offer gigs), plus **Admin** oversight. This README documents the **expanded system**: JWT authentication, gig CRUD, bookings with atomic payment records, freelancer income summaries, a React frontend, and defence-in-depth security.

---

## Table of Contents

1. [Features](#1-features)
2. [System Architecture](#2-system-architecture)
3. [Project Structure](#3-project-structure)
4. [API Endpoints](#4-api-endpoints)
5. [Security Measures](#5-security-measures)
6. [Running the Backend](#6-running-the-backend)
7. [Running the Frontend](#7-running-the-frontend)
8. [Environment Variables](#8-environment-variables)
9. [Testing Procedures](#9-testing-procedures)
10. [Troubleshooting](#10-troubleshooting)
11. [Technology Stack](#11-technology-stack)
12. [References](#12-references)

---

## 1. Features

### Roles

| Role | Capabilities |
|------|--------------|
| **Client** | Browse available gigs, book a gig, view own bookings |
| **Freelancer** | Create/edit/delete own gigs, view incoming bookings, view income summary |
| **Admin** | List all users, delete users |

### Application Features

- **Authentication:** register (name/email/password/role), login, `GET /api/auth/me` session restore. Token + user persisted in `sessionStorage`.
- **Gigs:** freelancers create gigs (title, description, category, price). Public browse of `available` gigs; owner-only edit/delete enforced in `gigController` (`You do not own this gig`).
- **Bookings:** clients book an available gig. Self-booking is rejected (`You cannot book your own gig`). Booking + `Transaction` are written in a **Mongoose transaction (session)** so a payment record can never exist without its booking.
- **Income:** `GET /api/bookings/income` (alias `GET /api/transactions/income`) aggregates a freelancer's total earnings and returns the 20 most recent transactions with client names.
- **Users:** admins list/delete users; users can view/update their own profile (ownership + admin checks in `userController`).
- **Frontend (React + Vite + React Router):** public `/login`, `/register`; protected `/dashboard`, `/browse-gigs`, `/profile`; client-only `/my-bookings`; freelancer-only `/my-gigs`, `/incoming-bookings`, `/income`. `ProtectedRoute` supports `allowedRoles`. Shared `apiRequest` helper injects the `Bearer` token and surfaces server validation messages instead of generic `Failed to fetch`.

---

## 2. System Architecture

```
Browser (React/Vite :5173) ──fetch──▶ Express API (:4000) ──Mongoose──▶ MongoDB Atlas
       VITE_API_URL=http://localhost:4000          JWT (Bearer) + RBAC
```

**Security boundary** (in `api/server.js` order):

```
Helmet (incl. CSP)
  └─▶ CORS (allowlist FRONTEND_URL)
       └─▶ JSON body limit (10kb)
            └─▶ Request logger
                 └─▶ Global apiLimiter
                      └─▶ Routes
                           └─▶ 404 handler
                                └─▶ Central errorHandler
```

---

## 3. Project Structure

```
INSY7314_Part1/
├── api/
│   ├── server.js                 # Middleware order, route mounting, health check
│   ├── config/db.js              # Mongoose connection
│   ├── controllers/              # auth, gig, booking, transaction, user
│   ├── routes/                   # auth, gigs, bookings, transactions, users
│   ├── middleware/               # protect/authorizeRoles, validation, rateLimiter, errorHandler
│   ├── models/                   # User, Gig, Booking, Transaction (Mongoose)
│   ├── utils/                    # logger, validators
│   └── tests/                    # Jest suites (see Testing section)
│
├── client/
│   └── src/
│       ├── services/api.js       # API_URL + apiRequest (token + friendly errors)
│       ├── context/AuthContext.jsx  # login/register/logout + session restore
│       ├── components/           # LoginForm, RegisterForm, ProtectedRoute, GigCard, GigForm, BookingCard, Navbar, Sidebar
│       └── pages/                # Dashboard, BrowseGigs, MyGigs, MyBookings, IncomeSummary, Profile
│
├── postman/                      # Postman collection + environment
└── README.md
```

---

## 4. API Endpoints

**Base URL:** `http://localhost:4000`

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/api/health` | No | Health check |
| POST | `/api/auth/register` | No (`authLimiter`) | `{ name, email, password, role? }` → `201 { data: { user, token } }` |
| POST | `/api/auth/login` | No (`authLimiter`) | `{ email, password }` → `200 { data: { user, token } }` |
| GET | `/api/auth/me` | Bearer | Current user (no password hash) |
| POST | `/api/gigs` | Freelancer | Create gig |
| GET | `/api/gigs` | No | List `available` gigs |
| GET | `/api/gigs/my-gigs` | Freelancer | Own gigs (must precede `/:id`) |
| GET | `/api/gigs/:id` | No | Single available gig |
| PUT | `/api/gigs/:id` | Freelancer + owner | Edit own gig only |
| DELETE | `/api/gigs/:id` | Freelancer + owner | Delete own gig only |
| POST | `/api/bookings` | Client (`bookingLimiter`) | `{ gig }`; rejects self-booking; atomic Booking + Transaction |
| GET | `/api/bookings/my-bookings` | Client | Own bookings |
| GET | `/api/bookings/incoming` | Freelancer | Bookings for own gigs |
| GET | `/api/bookings/income` | Freelancer | Also at `/api/transactions/income`; `{ data: { total, transactions } }` |
| GET | `/api/users` | Admin | List users |
| GET/PUT | `/api/users/:id` | Self / Admin | Read / update profile |
| DELETE | `/api/users/:id` | Admin | Delete user |

**Error format:**

```json
{ "success": false, "message": "Human-readable error", "errors": [ { "field": "...", "message": "..." } ] }
```

> Stack traces are only included in `NODE_ENV=development`.

---

## 5. Security Measures

| Control | Where | What it does / why |
|---------|-------|--------------------|
| **Password hashing (bcrypt)** | `models/User.js` | Passwords never stored plain text; hash excluded from queries by default |
| **JWT auth** | `middleware/authMiddleware.js` (`protect`) | `Bearer` token verified with `JWT_SECRET`; expired/malformed tokens get `401`; deleted users rejected |
| **RBAC** | `authorizeRoles(...)` + `ProtectedRoute allowedRoles` | Server: gig write = Freelancer, booking create = Client, user list/delete = Admin. Client: role-gated routes |
| **Ownership checks** | `gigController`, `userController` | Cross-owner gig edit/delete → `403`; profile read/update restricted to self or admin |
| **Input validation + sanitisation** | `validationMiddleware.js` (express-validator) | Trim, `isEmail` + `normalizeEmail`, strong-password rules, role allowlist; gig/booking id + price checks; `400 { errors[] }` |
| **Rate limiting** | `middleware/rateLimiter.js` | Global `apiLimiter` (100 / 15 min), strict `authLimiter` (10 / 15 min), `bookingLimiter` (20 / hr) |
| **Secure headers + CSP** | `server.js` (Helmet) | CSP (`default-src 'self'`, no frames/objects), HSTS/XSS/frame guards |
| **CORS allowlist** | `server.js` (cors) | Only `FRONTEND_URL` (default `http://localhost:5173`) may call the API |
| **Payload limits** | `express.json({ limit: '10kb' })` | Caps body size against abuse |
| **Central error handling** | `middleware/errorHandler.js` | Safe 4xx mapping; `500`s never leak internals; stack only in development; JSON 404s |
| **Login ambiguity** | `authController.js` | Wrong email vs wrong password both return `Invalid email or password` |
| **Atomic payments** | `bookingController.js` (Mongoose session) | Booking + Transaction commit together — no orphaned payments |
| **Token storage** | `client/src/services/api.js` | Token in `sessionStorage` (cleared when tab closes), sent as `Bearer` |

---

## 6. Running the Backend

**Prerequisites:** Node 18+, MongoDB Atlas cluster (or local MongoDB), Atlas IP allowlisted.

```powershell
cd C:\Users\dorca\Documents\GitHub\INSY7314_Part1\api
npm install
npm run dev    # nodemon, auto-reload — development
# or
npm start      # plain node server.js — production-like
```

**Verify:** `http://localhost:4000/api/health` should return `{ "success": true, ... }`.

> **Port busy?** If you see `EADDRINUSE :::4000`, a server is already running — reuse it.

---

## 7. Running the Frontend

**Prerequisites:** Node 18+. **Start the backend first.**

```powershell
cd C:\Users\dorca\Documents\GitHub\INSY7314_Part1\client
npm install
npm run dev    # Vite dev server, default http://localhost:5173
```

Open the printed URL, register as Client or Freelancer, then log in.

> **Note:** Vite reads `client/.env` only at startup. After changing `VITE_API_URL`, stop (`Ctrl+C`) and re-run `npm run dev`.

**Production build:**

```powershell
npm run build      # outputs to client/dist
npm run preview    # serves the built bundle locally
```

---

## 8. Environment Variables

### Backend — `api/.env`

```env
PORT=4000
NODE_ENV=development
JWT_SECRET=<long-random-secret>
JWT_EXPIRY=7d
MONGO_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/hustlehub?appName=HustleHub
FRONTEND_URL=http://localhost:5173
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
```

### Frontend — `client/.env`

```env
VITE_API_URL=http://localhost:4000
```

> ⚠️ **Local development uses HTTP.** Do **NOT** set `VITE_API_URL=https://localhost:4000` — HTTPS-against-HTTP is the #1 cause of `Failed to fetch` on Login/Register.

> 🔒 **Never commit** `api/.env` or `client/.env` to GitHub. Ensure both are in `.gitignore`.

---

## 9. Testing Procedures

### 9.1 Backend (Jest) — `api/tests/`

**Suites:** `authController`, `validateAuthInput`, `passwordHash`, `jwt`, `gigValidation`, `bookingValidation`, `rbac`, `ownership`, `transactionLogic`, `userModel`, `errorHandler`.

```powershell
cd C:\Users\dorca\Documents\GitHub\INSY7314_Part1\api
npm test                 # jest --detectOpenHandles --forceExit
npm run test:coverage    # coverage of controllers/middleware/models/utils
npm run test:watch       # watch mode
```

**Covered:**
- Register/login happy paths + duplicate/invalid cases
- bcrypt compare
- JWT sign / verify / expiry
- Validator rules
- RBAC allow/deny
- Gig ownership `403`s
- Atomic booking + transaction logic
- User model validation
- Error-handler status mapping (no stack leak in production)

### 9.2 Frontend (Vitest) — `client/`

```powershell
cd C:\Users\dorca\Documents\GitHub\INSY7314_Part1\client
npm test                 # vitest run (jsdom)
npm run lint             # oxlint
```

### 9.3 Manual / Postman Smoke Test

1. `GET http://localhost:4000/api/health` → `200 success:true`.
2. `POST /api/auth/register` with:
   ```json
   { "name": "Ada Test", "email": "ada@example.com", "password": "Password123!", "role": "Client" }
   ```
   → `201` with `data.user` + `data.token`.
3. `POST /api/auth/login` same credentials → `200` with token. Send as `Authorization: Bearer <token>`.
4. **As Freelancer:** `POST /api/gigs` then `GET /api/gigs`.
5. **As Client:** `POST /api/bookings` `{ "gig": "<gigId>" }` → `201`; `GET /api/bookings/my-bookings`.
6. **As Freelancer:** `GET /api/bookings/incoming`, `GET /api/bookings/income` (alias `/api/transactions/income`).
7. **Negative checks:**
   - No token → `401`
   - Wrong role → `403`
   - Bad body → `400 Validation failed`
   - Unknown route → `404`

### 9.4 Browser Check

With both servers running, register/login via the UI. Open DevTools → **Network** tab:

- `POST http://localhost:4000/api/auth/register|login` should return `200`/`201` JSON.
- A literal `Failed to fetch` means the browser could not reach the API — backend down or wrong `VITE_API_URL`.

---

## 10. Troubleshooting

| Symptom | Cause / Fix |
|---------|-------------|
| `Failed to fetch` on Login/Register | Backend down, or `.env` points at `https://localhost:4000`. Use `http://localhost:4000`, restart `npm run dev`, confirm `/api/health` |
| `EADDRINUSE :::4000` | Server already on 4000 — reuse it or kill the old process |
| Register hangs / Mongo timeout | `MONGO_URI` malformed (`mongodb+srv://...`) or Atlas IP not allowlisted |
| `401 No token provided` | Missing `Authorization: Bearer <token>` — log in again |
| `403 Role ... not authorized` | Correct behaviour — that role may not call that route |
| `400 Validation failed` | Read `errors[{field, message}]` — e.g. password needs 8+ chars with upper/lower/number/special |

---

## 11. Technology Stack

### Backend
- **Runtime:** Node.js
- **Framework:** Express 4
- **Database:** Mongoose 9 (MongoDB Atlas)
- **Auth:** jsonwebtoken, bcryptjs
- **Validation:** express-validator
- **Security:** Helmet, CORS, express-rate-limit
- **Logging:** Morgan
- **Testing:** Jest + Supertest
- **Dev:** Nodemon, uuid

### Frontend
- **Library:** React 19
- **Routing:** React Router 7
- **Bundler:** Vite 8
- **Styling:** Tailwind 4 (custom design tokens)
- **Testing:** Vitest + Testing Library
- **Auth storage:** sessionStorage

---

## 12. References

- Manico, J. and Detlefsen, A. 2015. *Iron-Clad Java: Building Secure Web Applications*. McGraw-Hill.
- Express.js. n.d. *Routing Guide*. Available at: https://expressjs.com/en/guide/routing.html
- OWASP Foundation. n.d. *Password Storage Cheat Sheet*. Available at: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
- OWASP Foundation. n.d. *Authentication Cheat Sheet*. Available at: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
- JWT.io. n.d. *Introduction to JSON Web Tokens*. Available at: https://jwt.io/introduction
- MDN Web Docs. n.d. *HTTP response status codes*. Available at: https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
- The Independent Institute of Education (IIE), 2026. Information Systems 3D [INSY7314 Module Manual]. Unpublished.

---

© The Independent Institute of Education (Pty) Ltd 2026
```

---

Replace your `README.md` with the content above, commit it, and push. Your README will now be **professional, complete, and rubric-compliant**. 🚀
