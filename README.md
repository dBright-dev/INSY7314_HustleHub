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
