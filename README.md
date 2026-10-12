
# HustleHub+ — Secure Freelance Marketplace (MERN)

> **Video walkthrough:** https://youtu.be/4gdpsoVRy_g

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

| Method | Path | Auth | Notes | Screenshots |
|--------|------|------|-------| ----------------------------- |
| GET | `/api/health` | No | Health check | <img width="200" height="200" alt="image" src="https://github.com/user-attachments/assets/7ab04002-7468-4f2a-85ef-14ccb878ce38" /> |
| POST | `/api/auth/register` | No (`authLimiter`) | `{ name, email, password, role? }` → `201 { data: { user, token } }` | <img width="200" height="200" alt="image" src="https://github.com/user-attachments/assets/7766e0da-20a0-4b5f-9443-0c9161c2fa3c" /> |
| POST | `/api/auth/login` | No (`authLimiter`) | `{ email, password }` → `200 { data: { user, token } }` |<img width="990" height="702" alt="image" src="https://github.com/user-attachments/assets/d4809ddc-a2d5-42aa-8170-e634e020a3f2" /> | <img width="984" height="685" alt="image" src="https://github.com/user-attachments/assets/bbbece1f-078c-4f0a-b0e5-d94e624fb0fc" /> | <img width="986" height="712" alt="image" src="https://github.com/user-attachments/assets/63c642ec-0ac6-4749-9280-ccd96846604f" /> | <img width="983" height="688" alt="image" src="https://github.com/user-attachments/assets/f696b513-579b-45ed-8ea0-03aa927a8685" /> | <img width="985" height="589" alt="image" src="https://github.com/user-attachments/assets/0c143155-5172-4ff1-9f13-5b7d45bbba09" /> | <img width="981" height="579" alt="image" src="https://github.com/user-attachments/assets/55808ab3-4d60-4868-89ad-147fcc77ca43" /> | <img width="986" height="583" alt="image" src="https://github.com/user-attachments/assets/95f9bee8-a384-4bd3-803a-a651eeffa4ef" /> | <img width="1004" height="678" alt="image" src="https://github.com/user-attachments/assets/e47cd195-104c-4675-b892-0b734be39fa0" />
| GET | `/api/auth/me` | Bearer | Current user (no password hash) | <img width="984" height="652" alt="image" src="https://github.com/user-attachments/assets/487aae2f-c439-4ad5-8ef3-a907c9cfc708" /> |
| POST | `/api/gigs` | Freelancer | Create gig | <img width="992" height="687" alt="image" src="https://github.com/user-attachments/assets/31e5a9cc-eb87-4947-88dc-b810fa855b0b" /> |
| GET | `/api/gigs` | Yes | List `available` gigs | <img width="997" height="694" alt="image" src="https://github.com/user-attachments/assets/17b3fb27-b2ff-43e8-82b9-120d59b12099" /> |
| GET | `/api/gigs/my-gigs` | Freelancer | Own gigs (must precede `/:id`) |<img width="998" height="686" alt="image" src="https://github.com/user-attachments/assets/99573289-6f15-4e8b-b2e9-0037ca9e344e" /> |
| GET | `/api/gigs/:id` | Yes | Single available gig | <img width="982" height="704" alt="image" src="https://github.com/user-attachments/assets/da9a88fd-cc45-4c3e-b470-ebc6538e10aa" /> |
| PUT | `/api/gigs/:id` | Freelancer + owner | Edit own gig only | <img width="1197" height="711" alt="image" src="https://github.com/user-attachments/assets/e811f70c-feb5-4842-bb25-dfb5faf9e908" /> |
| DELETE | `/api/gigs/:id` | Freelancer + owner | Delete own gig only | <img width="1208" height="600" alt="image" src="https://github.com/user-attachments/assets/0e09773c-12a6-45d0-8e41-aa6b2c0d8885" /> |
| POST | `/api/bookings` | Client | `{ gig }`| <img width="1195" height="696" alt="image" src="https://github.com/user-attachments/assets/8f4b758a-4d56-41ae-a606-88752ba3d11b" /> |
| GET | `/api/bookings/my-bookings` | Client | Own bookings | <img width="1197" height="701" alt="image" src="https://github.com/user-attachments/assets/a8a4105d-00e6-456d-9f9a-190dc678e9a2" /> |
| GET | `/api/bookings/incoming` | Freelancer | Bookings for own gigs | <img width="1196" height="668" alt="image" src="https://github.com/user-attachments/assets/e56cf4f7-b3aa-4039-b2ab-60bc4d665fc6" /> |
| GET | `/api/bookings/income` | Freelancer | Also at `/api/transactions/income`; `{ data: { total, transactions } }` | <img width="1192" height="698" alt="image" src="https://github.com/user-attachments/assets/40a032b6-149a-4cbb-ab14-f178398189ae" /> |
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

> **Port busy?** If you see `EADDRINUSE :::5000`, a server is already running — reuse it.

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
PORT=5000
NODE_ENV=development
JWT_SECRET=<long-random-secret>
JWT_EXPIRY=7d
MONGO_URI=mongodb+srv://hustlehubuser:cdlQc2Zo3ciB1Q8E@hustlehub.zkras1a.mongodb.net/hustlehub?appName=HustleHub
FRONTEND_URL=http://localhost:5173
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
```

### Frontend — `client/.env`

```env
VITE_API_URL=http://localhost:5000
```

> ⚠️ **Local development uses HTTP.** Do **NOT** set `VITE_API_URL=https://localhost:5000` — HTTPS-against-HTTP is the #1 cause of `Failed to fetch` on Login/Register.

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

<img width="431" height="191" alt="image" src="https://github.com/user-attachments/assets/0f01a401-d7eb-45f2-80c8-f1095f48e53c" />

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
<img width="300" height="300" alt="image" src="https://github.com/user-attachments/assets/3abb50cd-7c45-42b3-ae9a-46e9004db7d0" />

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
