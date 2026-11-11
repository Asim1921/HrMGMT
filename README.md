# 101HRMgmt — Military HR Management SaaS

Full-stack Military HR Management application: JWT auth, RBAC, attendance, leave management, and reports.

## Tech Stack

| Layer   | Technology                          |
|---------|-------------------------------------|
| Frontend| React 18 + Vite + TailwindCSS + React Query |
| Backend | Node.js + Express.js                |
| Database| PostgreSQL                          |
| Auth    | JWT + Refresh Tokens + bcrypt       |
| ORM     | Prisma                              |
| State   | Zustand (client)                    |
| API     | REST                                |

## Project Structure

```
HR_Mgmt/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma    # DB schema
│   │   └── seed.js          # Super admin seed
│   └── src/
│       ├── controllers/
│       ├── middleware/       # auth, rbac, error
│       ├── routes/
│       ├── services/
│       └── utils/
├── frontend/
│   └── src/
│       ├── api/
│       ├── components/
│       ├── hooks/
│       ├── pages/
│       └── store/
└── README.md
```

## Quick Start

### 1. Database

Create a PostgreSQL database and set its URL:

```bash
cd backend
cp .env.example .env
# Edit .env: set DATABASE_URL and JWT secrets
```

### 2. Backend

```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```

API runs at **http://localhost:4000**. Default super admin: `superadmin@101hrmgmt.local` / `SuperAdmin@101`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at **http://localhost:5173**. Proxy forwards `/api` to the backend.

## API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST   | `/api/v1/auth/login` | Login |
| POST   | `/api/v1/auth/refresh-token` | Refresh access token |
| POST   | `/api/v1/auth/logout` | Logout (authenticated) |
| GET/POST/PUT/DELETE | `/api/v1/users` | User CRUD (Admin+) |
| POST   | `/api/v1/attendance/mark` | Mark present (User) |
| GET    | `/api/v1/attendance/my` | Own attendance |
| GET    | `/api/v1/attendance/team` | Team attendance (Admin+) |
| POST   | `/api/v1/leaves/apply` | Apply for leave |
| GET    | `/api/v1/leaves/my` | My leave requests |
| GET    | `/api/v1/leaves/pending` | Pending approvals (Admin+) |
| PUT    | `/api/v1/leaves/:id/approve` | Approve leave |
| PUT    | `/api/v1/leaves/:id/reject` | Reject leave |
| PUT    | `/api/v1/leaves/:id/cancel` | Cancel own request |
| GET    | `/api/v1/leave-balance/my` | Own balance |
| GET    | `/api/v1/leave-balance/:userId` | User balance (Admin+) |
| GET    | `/api/v1/reports/attendance` | Attendance report |
| GET    | `/api/v1/reports/leaves` | Leaves report |

## Roles

- **Super Admin**: Full access; manage admins and users; configure policies; audit.
- **Admin**: Manage users in their unit; approve/reject leave; team attendance; unit reports.
- **User**: Mark own attendance; apply for leave; view own balance and history.

## Sprints (from roadmap)

- **Sprint 1** — Foundation ✅ (this repo)
- **Sprint 2** — User CRUD UI, attendance button, leave balance init
- **Sprint 3** — Leave application + approval flow, balance display
- **Sprint 4** — Dashboards, team calendar, reports, notifications
- **Sprint 5** — Audit logs, holiday calendar, Docker, deploy

## License

Proprietary — 101HRMgmt.
