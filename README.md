# HustleHub+ Backend API – Part 1: Secure Foundations
Video Youtube Url: https://youtu.be/5i6BAlv6qx0 
---

## 📖 Table of Contents

1. [System Overview](#system-overview)
2. [Intended Users](#intended-users)
3. [System Architecture Diagram](#system-architecture-diagram)
4. [Backend Structure](#backend-structure)
5. [Security Decisions & Rationale](#security-decisions--rationale)
   - [Password Hashing (bcrypt)](#password-hashing-bcrypt)
   - [Token-Based Authentication (JWT)](#token-based-authentication-jwt)
   - [Input Validation & Sanitisation](#input-validation--sanitisation)
   - [HTTPS & SSL/TLS](#https--ssltls)
   - [Controlled Error Handling](#controlled-error-handling)
6. [API Endpoints](#api-endpoints)
7. [Setup & Installation](#setup--installation)
8. [Technology Stack](#technology-stack)
9. [Testing with Postman](#testing-with-postman)

---

## System Overview

**HustleHub+** is a secure freelance marketplace platform designed to connect **Freelancers** with **Clients**. The platform allows freelancers to advertise their services (gigs) and clients to browse, discover, and book those services.

Beyond standard marketplace functionality, HustleHub+ records financial transactions generated through bookings and provides users with:
- **Income tracking** – an indication of earnings
- **Tax estimation** – calculated based on income generated

The system processes **sensitive information** including:
- User credentials (email, password)
- Transactional records
- Income-related data

As such, **security is a primary design concern** – embedded from the ground up rather than added as an afterthought.

> **This submission (Part 1)** establishes the **Secure Backend Foundations** – a robust, secure API built with Node.js and Express, featuring user registration, authentication, JWT-based protection, HTTPS, input validation, and controlled error handling.

---

## Intended Users

| User Type | Description | Key Responsibilities |
|-----------|-------------|----------------------|
| **Freelancer** | Individuals offering services | Create and manage gigs, view bookings, track income, view tax estimates |
| **Client** | Individuals seeking services | Browse gigs, create bookings, view transaction history |
| **Administrator** | Platform managers | Manage users, monitor activity, enforce platform policies |

All users are authenticated using **JWT tokens**, and access to resources is controlled based on the user's role (implemented in Part 2).

---

## System Architecture Diagram

The following diagram illustrates the **MERN (MongoDB, Express, React, Node.js)** architecture with security features and system boundaries.

<img width="794" height="689" alt="pART1SystemArchi" src="https://github.com/user-attachments/assets/fb277e34-360a-4277-8daf-4886ee2ebfed" />


<img width="1532" height="1600" alt="IMG-20260907-WA0004" src="https://github.com/user-attachments/assets/819e717a-67f7-4d60-8d8b-e06b0580e575" />


### Security Features Highlighted in the Diagram

| Security Feature | Location | Purpose |
|------------------|----------|---------|
| **HTTPS (TLS 1.2+)** | Security Boundary | Encrypts data in transit; prevents Man-in-the-Middle (MITM) attacks |
| **Helmet.js** | Security Boundary | Sets security headers (CSP, HSTS, XSS protection, frame options) |
| **CORS** | Security Boundary | Restricts which origins can access the API |
| **JWT Authentication** | Middleware | Verifies user identity on each protected request |
| **Input Validation** | Middleware | Rejects malformed or malicious input before processing |
| **Input Sanitisation** | Middleware | Removes dangerous characters (XSS prevention) |
| **Controlled Error Handling** | Middleware | Prevents internal details from leaking to clients |
| **Rate Limiting** | Security Boundary | Prevents brute-force and DoS attacks (Part 2) |
| **Password Hashing (bcrypt)** | Model/Controller | Securely stores passwords; no plain-text retention |

---

## Backend Structure

The backend follows a **modular, layered architecture** to ensure separation of concerns, maintainability, and security.

```
api/
├── config/
│   └── db.js                    # MongoDB Atlas connection (Mongoose)
├── controllers/
│   ├── authController.js        # Authentication logic (register, login, profile)
│   └── userController.js        # User CRUD operations (admin only)
├── middleware/
│   ├── authMiddleware.js        # JWT verification (protect) + RBAC (authorizeRoles)
│   ├── errorHandler.js          # Centralised error handling (no stack traces in prod)
│   ├── validationMiddleware.js  # express-validator rules for auth endpoints
│   ├── rateLimiter.js           # Rate limiting (authLimiter, apiLimiter, bookingLimiter)
│   └── requestLogger.js         # Request audit logging (AAA - Accounting)
├── models/
│   └── User.js                  # Mongoose User schema (name, email, passwordHash, role)
├── routes/
│   └── authRoutes.js            # Authentication endpoints
├── utils/
│   └── logger.js                # Centralised logger utility
├── tests/
│   └── postman/
│       ├── passwordHash.test.js      # bcrypt hashing/verification tests
│       ├── jwt.test.js               # JWT sign/verify/expiry tests
│       ├── rbac.test.js              # authorizeRoles middleware tests
│       ├── validateAuthInput.test.js # Input validation tests
│       ├── authController.test.js    # Controller unit tests (mocked Mongoose)
│       ├── userModel.test.js         # User schema validation tests
│       └── errorHandler.test.js      # Error handler status code tests
├── certs/
│   ├── server.key               # SSL private key (self-signed)
│   └── server.crt               # SSL certificate (self-signed)
├── postman/                     # Postman collection for API testing
├── .env                         # Environment variables (NOT committed)
├── .env.example                 # Template for environment variables
├── .gitignore                   # Excludes secrets, certs, dependencies
├── package.json                 # Dependencies & scripts (Jest config included)
└── server.js                    # Main entry point (HTTPS server)
```

### Folder Responsibilities

Folder	Responsibility
config/	Centralised configuration; db.js handles MongoDB Atlas connection with fail-fast timeout
controllers/	Business logic for each route; processes requests, validates data, returns JSON responses
middleware/	Reusable request-processing functions: JWT verification, RBAC, validation, rate limiting, error handling, and audit logging
models/	Mongoose schemas defining data structure, validation rules, and instance methods (e.g., matchPassword)
routes/	Defines API endpoints and maps them to controller functions; applies middleware chains
utils/	Centralised logger (info, warn, error, debug) with timestamps for audit trails
tests/	Jest unit tests for Section 1 (authentication, security infrastructure)
certs/	SSL/TLS certificates for HTTPS (self-signed for local development)
postman/	Postman/Newman collection for API integration testing 

---

## Security Decisions & Rationale

### Password Hashing (bcrypt)

**Decision:** Passwords are hashed using **bcrypt** with a salt factor of **10** before storage.

**Rationale:**
- **bcrypt** is a **one-way, adaptive** hashing algorithm designed specifically for passwords.
- It includes a **salt** (random data) automatically, making **rainbow table attacks** infeasible.
- The **work factor (salt rounds = 10)** can be increased over time as hardware improves, making brute-force attacks progressively harder.
- **bcrypt** is resistant to GPU-based cracking due to its memory-hard design.

**Implementation:**
```javascript
const hashedPassword = await bcrypt.hash(password, 10);
const isPasswordValid = await bcrypt.compare(password, user.password);
```

**Never stored:** Plain-text passwords are never retained. Only the hash is stored.

---

### Token-Based Authentication (JWT)

**Decision:** JSON Web Tokens (JWT) are used for authentication. Tokens are signed with a strong secret (`JWT_SECRET`) and expire after a configurable time (`JWT_EXPIRES_IN`).

**JWT Flow:**
1. User logs in with valid credentials.
2. Server verifies credentials and generates a JWT containing:
   - `userId` – the user's unique ID
   - `email` – user's email
   - `role` – user's role (Client, Freelancer, Admin)
   - `iat` – issued at timestamp
   - `exp` – expiration timestamp
3. Client stores the token (sessionStorage) and includes it in subsequent requests as:
   ```
   Authorization: Bearer <token>
   ```
4. Server validates the token on every protected route using the `authenticateToken` middleware.

**Rationale:**
- **Stateless:** JWTs contain all necessary information, eliminating server-side session storage.
- **Scalable:** Authentication can be verified by any server with the secret.
- **Secure:** Tokens are **signed** (not encrypted) using HS256; tampering is detectable.
- **Short-lived:** Tokens expire after a configurable time (e.g., 7 days), reducing the window of opportunity if a token is compromised.
- **Role-based:** The token carries the user's role, enabling Role-Based Access Control (RBAC).

**Implementation:**
```javascript
// Generate token
const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
);

// Verify token (middleware)
const decoded = jwt.verify(token, process.env.JWT_SECRET);
req.user = decoded; // Attach user to request
```

**Protected Route Example:**
```javascript
router.get('/profile', authenticateToken, authController.getProfile);
```

---

### Input Validation & Sanitisation

**Decision:** All user input is validated **before processing** using `express-validator`. Invalid or malicious input is rejected with a `400 Bad Request` response.

**Validation Rules:**

| Field | Rule | Purpose |
|-------|------|---------|
| **name** | 2–50 chars, letters/spaces/apostrophes only | Prevents injection, ensures readable names |
| **email** | Valid email format, normalised | Ensures deliverable emails; prevents injection |
| **password** | Min 8 chars, uppercase, lowercase, number, special char | Enforces strong passwords |
| **role** | Must be 'Client', 'Freelancer', or 'Admin' | Prevents arbitrary role assignment |

**Sanitisation:**
- `trim()` – removes leading/trailing whitespace.
- `normalizeEmail()` – normalises email to a standard format.
- Manual sanitisation for XSS prevention (removing `<` and `>` characters).

**Rationale:**
- **Defence in Depth:** Even if frontend validation is bypassed (e.g., via Postman), the backend enforces security.
- **Prevents Injection Attacks:** SQL injection (NoSQL injection in MongoDB), XSS, and other injection-based attacks are mitigated.
- **Data Integrity:** Ensures only well-formed data enters the system.

**Implementation:**
```javascript
// validationMiddleware.js
const validateRegistration = [
    body('name')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ min: 2, max: 50 }).withMessage('Name must be 2–50 characters'),
    // ... more rules
    handleValidationErrors // Returns 400 if validation fails
];
```

---

### HTTPS & SSL/TLS

**Decision:** The application is served over **HTTPS** using a locally configured self-signed SSL certificate.

**Importance of HTTPS:**
- **Encrypts Data in Transit:** All communication between client and server is encrypted using TLS.
- **Prevents Man-in-the-Middle (MITM) Attacks:** Attackers cannot intercept or modify data.
- **Protects Credentials and Tokens:** Login credentials and JWTs are transmitted securely.
- **Establishes Trust:** Users can verify the server's identity (in production with CA-signed certificates).

**Local Development:**
- Self-signed certificates are generated using OpenSSL:
  ```bash
  openssl req -x509 -newkey rsa:2048 -keyout certs/server.key -out certs/server.crt -days 365 -nodes
  ```
- Browsers show a warning (expected for self-signed certificates). For testing, proceed with caution.

**Production Consideration:**
- Use a certificate from a **trusted Certificate Authority** (e.g., Let's Encrypt).
- Enable **HTTP Strict Transport Security (HSTS)** to enforce HTTPS.

---

### Controlled Error Handling

**Decision:** All error responses are **controlled** and **generic**. Internal system details (stack traces, file paths, configuration values) are **never** exposed to clients.

**Rationale:**
- **Security by Obscurity:** Attackers cannot learn about the system's internal structure.
- **User Experience:** Users see friendly, actionable error messages.
- **Logging:** Full error details are logged **server-side** for debugging.

**Implementation:**
```javascript
// errorHandler.js
const getSafeErrorMessage = (err, statusCode) => {
    const safeMessages = {
        400: 'Invalid request. Please check your input.',
        401: 'Authentication required. Please login.',
        403: 'Access denied. Insufficient permissions.',
        404: 'Resource not found.',
        409: 'Resource conflict.',
        500: 'Something went wrong. Please try again later.'
    };
    // In development, provide more detail (but still safe)
    if (process.env.NODE_ENV === 'development') {
        return err.message || safeMessages[statusCode] || 'An error occurred';
    }
    // In production, only return safe generic messages
    return safeMessages[statusCode] || 'An unexpected error occurred. Please try again.';
};
//(IIE, 2026)
```

---

## API Endpoints

### Public Endpoints (No Authentication Required)

| Method | Endpoint | Description | Request Body | Success Response | Error Response |
|--------|----------|-------------|--------------|------------------|----------------|
| **POST** | `/api/auth/register` | Register a new user | `{ name, email, password, role? }` | `201 Created` | `400 Bad Request` |
| **POST** | `/api/auth/login` | Login and receive JWT | `{ email, password }` | `200 OK` + `token` | `401 Unauthorized` |
| **GET** | `/api/health` | Health check | N/A | `200 OK` | N/A |

Register
<img width="100" height="100" alt="image" src="https://github.com/user-attachments/assets/00a150fd-c4a2-47b7-8824-3fabbb3b5cd2" />
<img width="100" height="100" alt="image" src="https://github.com/user-attachments/assets/8570f6c4-7f0c-4354-a006-aa4a5a573991" />
<img width="100" height="100" alt="image" src="https://github.com/user-attachments/assets/66ace717-f142-45b0-a05f-c803dfe94474" />

Login
<img width="100" height="100" alt="image" src="https://github.com/user-attachments/assets/bbdff7fa-73dd-491c-b6e2-420ae1a84a46" />
<img width="100" height="100" alt="image" src="https://github.com/user-attachments/assets/720428e9-68a0-4298-a9be-3de09d597bdc" />
<img width="100" height="100" alt="image" src="https://github.com/user-attachments/assets/38fbc13c-a504-40ae-8ace-38348b2f44e6" />

### Protected Endpoints (JWT Required)

| Method | Endpoint | Description | Request Body | Success Response | Error Response |
|--------|----------|-------------|--------------|------------------|----------------|
| **GET** | `/api/auth/profile` | Get current user's profile | N/A | `200 OK` | `401 Unauthorized` |
| **GET** | `/api/users` | Get all users (Admin only) | N/A | `200 OK` | `403 Forbidden` |
| **GET** | `/api/users/:id` | Get user by ID (own or admin) | N/A | `200 OK` | `403 Forbidden`, `404 Not Found` |
| **PUT** | `/api/users/:id` | Update user (own or admin) | `{ name?, email?, password? }` | `200 OK` | `403 Forbidden`, `404 Not Found` |
| **DELETE** | `/api/users/:id` | Delete user (Admin only) | N/A | `200 OK` | `403 Forbidden`, `404 Not Found` |

User Profile
<img width="100" height="100" alt="image" src="https://github.com/user-attachments/assets/46adc8cd-bc9d-412f-9736-814bd2b43677" />
<img width="100" height="100" alt="image" src="https://github.com/user-attachments/assets/1e65e3d2-ad66-453b-9d63-38ecf3c40e3b" />
<img width="100" height="100" alt="image" src="https://github.com/user-attachments/assets/aefdc1bf-1dc2-4a01-af99-ea9d232d1684" />

---

## Setup & Installation

### Prerequisites

- Node.js v14+ and npm
- OpenSSL (for generating SSL certificates)
- Git (for version control)

### Step 1: Clone the Repository

```bash
git clone [<repository-url>](https://github.com/dBright-dev/INSY7314_Part1.git)
cd hustlehub-backend/api
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Generate SSL Certificates

```bash
mkdir certs
cd certs
openssl req -x509 -newkey rsa:2048 -keyout server.key -out server.crt -days 365 -nodes
//(IIE, 2026)
# Fill in: ZA, Gauteng, Johannesburg, HustleHub, Development, localhost, dev@hustlehub.local
cd ..
```

### Step 4: Configure Environment Variables

Create a `.env` file in the `api` directory:

```env
PORT=3000
NODE_ENV=development
JWT_SECRET=your-super-strong-secret-min-32-characters
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3001
```


### Step 5: Start the Server

```bash
npm start
```

Expected output:
```
HustleHub+ API running securely on https://localhost:3000
Environment: development
API Documentation: https://localhost:3000/api/health
//(IIE, 2026)
```

### Step 6: Test the API

Open your browser or Postman and visit:
- `https://localhost:3000/api/health`
<img width="200" height="200" alt="Screenshot 2026-09-07 202131" src="https://github.com/user-attachments/assets/973af650-1cc4-4cb1-bfd7-5f74bf2a6df9" />

---

## Technology Stack

| Layer | Technology |
|-------|-------------------|
| **Runtime** | Node.js: JavaScript runtime for backend |
| **Framework** | Express.js: Web application framework |
| **Authentication** | jsonwebtoken (JWT): Token-based authentication |
| **Password Hashing** | bcrypt: Secure password hashing |
| **Validation** | express-validator:Input validation & sanitisation |
| **Security Headers** | Helmet.js: HTTP security headers |
| **CORS** | cors: Cross-origin resource sharing |
| **Logging** | morgan: Request logging |
| **Environment** | dotenv: Environment variable management |
| **Storage** | File-based (JSON): User data persistence (Part 1) |
| **Testing** | Postman, Newman: API testing |
| **Version Control** | Git, GitHub:  Source code management |

---

## Testing with Postman

### Environment Setup

Create a new environment:
- **Name:** HustleHub+ Local
- **Variable:** `baseUrl` = `https://localhost:3000`
- **Variable:** `token` = (leave blank – automatically filled by login test)

### Test Cases

The collection includes the following test cases:

| Test | Endpoint | Description | Expected Status | Screenshot |
|------|----------|-------------|-----------------|----------------------|
| ✅ Register – Valid | `POST /api/auth/register` | Create a new user | `201 Created` | <img width="100" height="100" alt="image" src="https://github.com/user-attachments/assets/00a150fd-c4a2-47b7-8824-3fabbb3b5cd2" /> |
| ❌ Register – Missing Name | `POST /api/auth/register` | Missing required field | `400 Bad Request` | <img width="100" height="100" alt="image" src="https://github.com/user-attachments/assets/8570f6c4-7f0c-4354-a006-aa4a5a573991" /> |
| ❌ Register – Weak Password | `POST /api/auth/register` | Password too weak | `400 Bad Request` | <img width="100" height="100" alt="image" src="https://github.com/user-attachments/assets/66ace717-f142-45b0-a05f-c803dfe94474" /> |
| ✅ Login – Valid | `POST /api/auth/login` | Valid credentials | `200 OK` + `token` | <img width="100" height="100" alt="image" src="https://github.com/user-attachments/assets/bbdff7fa-73dd-491c-b6e2-420ae1a84a46" /> |
| ❌ Login – Wrong Password | `POST /api/auth/login` | Invalid password | `401 Unauthorized` | <img width="100" height="100" alt="image" src="https://github.com/user-attachments/assets/720428e9-68a0-4298-a9be-3de09d597bdc" /> |
| ❌ Login – Non-existent User | `POST /api/auth/login` | User not found | `401 Unauthorized` | <img width="100" height="100" alt="image" src="https://github.com/user-attachments/assets/38fbc13c-a504-40ae-8ace-38348b2f44e6" /> |
| ✅ Get Profile – Valid Token | `GET /api/auth/profile` | With valid JWT | `200 OK` | <img width="100" height="100" alt="image" src="https://github.com/user-attachments/assets/46adc8cd-bc9d-412f-9736-814bd2b43677" /> |
| ❌ Get Profile – Missing Token | `GET /api/auth/profile` | No token sent | `401 Unauthorized` | <img width="100" height="100" alt="image" src="https://github.com/user-attachments/assets/1e65e3d2-ad66-453b-9d63-38ecf3c40e3b" /> |
| ❌ Get Profile – Invalid Token | `GET /api/auth/profile` | Malformed token | `403 Forbidden` | <img width="100" height="100" alt="image" src="https://github.com/user-attachments/assets/aefdc1bf-1dc2-4a01-af99-ea9d232d1684" /> |

### Running Tests

1. Start the server: `npm start`
2. In Postman, select the collection.
3. Click **Run** → Select all tests → Click **Run**.

### Expected Output Example

**Successful Registration:**
```json
{
    "success": true,
    "message": "User registered successfully",
    "data": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "Client",
        "createdAt": "2026-09-05T10:30:00.000Z"
    }
}
(IIE, 2026)
```

**Successful Login:**
```json
{
    "success": true,
    "message": "Login successful",
    "data": {
        "user": {
            "id": "550e8400-e29b-41d4-a716-446655440000",
            "name": "John Doe",
            "email": "john@example.com",
            "role": "Client"
        },
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
}
//(IIE, 2026)
```

**Validation Error:**
```json
{
    "success": false,
    "message": "Validation failed",
    "errors": [
        { "field": "password", "message": "Password must be at least 8 characters long" }
    ]
}
//(IIE, 2026)
```

---


## Conclusion

**HustleHub+ Part 1** establishes a secure, well-architected backend foundation for a freelance marketplace platform. The system follows **security-by-design** principles, implementing:

- ✅ **HTTPS** – encrypted communication
- ✅ **bcrypt** – secure password hashing
- ✅ **JWT** – stateless, scalable authentication
- ✅ **Input Validation & Sanitisation** – defence against injection and XSS
- ✅ **Controlled Error Handling** – no internal details leaked

The modular architecture and comprehensive testing ensure the system is ready for extension in **Part 2**, where it will become a fully functional full-stack application with MongoDB, React, and advanced security controls
(IIE, 2026).

---

## References

- Manico, J. and Detlefsen, A. 2015. *Iron-Clad Java: Building Secure Web Applications*. McGraw-Hill.
- Express.js. n.d. *Routing Guide*. Available at: https://expressjs.com/en/guide/routing.html
- OWASP Foundation. n.d. *Password Storage Cheat Sheet*. Available at: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
- OWASP Foundation. n.d. *Authentication Cheat Sheet*. Available at: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
- JWT.io. n.d. *Introduction to JSON Web Tokens*. Available at: https://jwt.io/introduction
- MDN Web Docs. n.d. *HTTP response status codes*. Available at: https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
- The Independent Institute of Education (IIE), 2026. Infomation Systems 3D[INSY7314 Module Manual]. The Independent Institute of Education: Unpublished.
- 
---

**© The Independent Institute of Education (Pty) Ltd 2026**
