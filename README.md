# Smart Student Achievement Ranking System (SSARS)

A web app where **students** upload achievements and certificates, **faculty** check and approve them, **admins** run the platform, and **recruiters** look for verified talent. Rankings and badges update **live**, without refreshing the page.

Built with the **MERN stack**: MongoDB Atlas, Express, React 19 (Vite) and Node.js, plus Socket.IO for live updates.

> 👉 **New to this? Open [`SETUP_GUIDE.md`](SETUP_GUIDE.md).** It walks you through everything on Windows, click by click.

---

## Quick start (if you already know Node)

```bash
npm run setup                          # installs everything (root + server + client)
copy server\.env.example server\.env   # then fill in MONGO_URI (Windows; use cp on Mac/Linux)
npm run seed                           # loads demo users, achievements and certificates
npm run dev                            # backend on :5000, frontend on http://localhost:5173
```

All demo accounts use the password **`Demo@123`**:

| Role | Email |
|---|---|
| Admin | `admin@example.com` (admin registration code: `ADMIN2026`) |
| Faculty (MCA) | `ramesh.kulkarni.faculty@example.com` |
| Faculty (ISE) | `manjunath.gowda.faculty@example.com` |
| Student | `imran.1by25mc004@example.com` (100% attendance) |
| Recruiter | `recruiter@example.com` (TechNova Solutions) |
| Recruiter (pending) | `recruiter2@example.com` (stays blocked until an admin approves it) |

---

## Features

**Student**
- Upload achievements with a PDF/JPG/PNG certificate (max 5 MB). Freelance work uses a project link instead.
- A live SmartScore preview while filling in the form.
- Dashboard with a score breakdown, rank, badges and recent submissions.
- Analytics charts, a skills editor, and a public **verified portfolio** link (`/p/<usn>`).
- Privacy controls (all **off by default**, so students opt in): let recruiters find me, make my portfolio public, show my CGPA on the portfolio.

**Faculty**
- Verification queue for **their own department only**.
- Approve, or reject with a required remark. Students are notified instantly.
- Class records and department analytics.

**Admin**
- Platform statistics, plus user management: edit, enable/disable, approve recruiters, delete.
- **Ranking algorithm settings:** CGPA / attendance / achievement weights (must add up to 100) and the scoring mode.

**Recruiter** (requires admin approval)
- Search students by skills, domain, department, minimum CGPA and backlogs.
- See ✓ **verified skills**: skills backed by faculty-approved achievements.
- Shortlist candidates, export the shortlist to CSV, and view the full verified profile. Each profile view is logged so students can see who looked.

**Everyone**
- Live rankings with filters, a PDF report download, and live notifications.

### Improvements over the original report
| Problem | Fix |
|---|---|
| Achievement totals grew without limit, so students with many small items beat those with a few big ones | **Normalised 0–100 achievement index** with diminishing returns: your best item counts fully, the 2nd counts half, the 3rd a quarter… |
| Students with no CGPA/attendance were ranked unfairly | They are listed separately as **"incomplete profile"** instead of being ranked |
| Certificates stored on local disk disappear on Render | Certificates are stored **inside MongoDB (GridFS)** |
| The same certificate could be uploaded twice | **Duplicate detection** using a file fingerprint (SHA-256) |
| Weights could be set to any numbers | They must add up to exactly **100** |
| Ties | Equal scores share the same rank |

### Scoring
- **SmartScore** (per achievement) = category weight × level multiplier + position bonus.
  - Category weights: academic 30, technical 28, freelance 26, certification 24, sports 22, sustainability 20, cultural 18, social 16.
  - Level multipliers: college ×1, inter-college ×1.25, state ×1.5, national ×2, international ×3.
  - Position bonuses: participation +5, runner-up +12, top 3 +15, winner +20.
- **Achievement index** = 100 × (1 − e^(−D/100)), where D = Σ (sorted SmartScores × 0.5^i).
- **Overall score** = CGPA×10 × a% + attendance × b% + achievement index × c%. The default is 40/20/40.
- **Classic mode** (from the original report) uses the raw sum of SmartScores. Admins can switch modes.
- **Badges:**
  - Gold Performer: 85 or more.
  - Silver Performer: 70–85.
  - Perfect Attendance: 100% attendance.
  - Technical Guru: 3 or more technical, certification or freelance achievements.
  - Eco Champion: 2 or more sustainability or social achievements.

---

## Project structure

```
smart-ranking-system/
├── package.json          ← "one-click" scripts: setup, dev, seed, build, start
├── server/               ← Backend (Node + Express + MongoDB)
│   ├── .env.example      ← copy to .env and fill in
│   ├── seed/             ← demo data + seed script
│   └── src/
│       ├── server.js     ← starts everything
│       ├── app.js        ← Express app (also serves the built React app)
│       ├── config/       ← database connection, scoring constants
│       ├── models/       ← User, Achievement, Config, Notification, ProfileView
│       ├── middleware/   ← login check (JWT), role check, file upload, errors
│       ├── controllers/  ← what each API endpoint does
│       ├── services/     ← score/badge/ranking calculations
│       ├── utils/        ← scoring maths, GridFS files, Socket.IO, notifications
│       └── routes/       ← URL → controller map
└── client/               ← Frontend (React + Vite)
    └── src/
        ├── api.js        ← talks to the backend (adds your login token)
        ├── context/      ← logged-in user, live socket, toast pop-ups
        ├── components/   ← layout, shared UI pieces
        └── pages/        ← student/, faculty/, admin/, recruiter/ + public pages
```

## API overview (all under `/api`)
| Area | Endpoints |
|---|---|
| Auth | `POST auth/register`, `POST auth/login`, `GET auth/me` |
| Achievements | `POST achievements` (multipart, field `certificate`), `GET achievements/mine`, `DELETE achievements/:id`, `GET achievements`, `PUT achievements/:id/verify` |
| Rankings & stats | `GET rankings?department&semester`, `GET analytics/me`, `GET analytics/department`, `GET analytics/admin`, `GET faculty/students` |
| Profile | `PUT profile/me`, `GET profile/views`, `GET public/portfolio/:usn` |
| Admin | `GET/PUT/DELETE admin/users`, `GET/PUT admin/config` |
| Recruiter | `GET recruiter/students`, `GET recruiter/students/:id`, `POST recruiter/shortlist/:id`, `GET recruiter/shortlist` |
| Other | `GET notifications`, `PUT notifications/read-all`, `GET files/:id`, `GET health` |

Live (Socket.IO) events: `notification`, `achievement:new`, `achievement:updated`, `rankings:updated`, `badge:unlocked`, `users:updated`.

## Team
Suraj SP (1BY25MC112) & Shashi (1BY25MC099). Guide: Mr. Venkatesh Babu, Dept. of MCA, BMS Institute of Technology and Management.
