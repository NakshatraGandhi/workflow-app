# ⚡ WorkFlow – Role-Based Approval & Workflow Management System

A full-stack application built with **React + Node.js (Express) + MySQL**.

---

## 📁 Project Structure

```
workflow-app/
├── backend/
│   ├── config/
│   │   └── db.js               # MySQL connection pool
│   ├── controllers/
│   │   ├── authController.js   # Module 1 – Login/Auth
│   │   └── requestController.js# Modules 2,3,4,5 – Requests, Workflow, Logs, Dashboard
│   ├── middleware/
│   │   └── auth.js             # JWT authenticate + role-based authorize
│   ├── routes/
│   │   ├── auth.js             # POST /api/login
│   │   └── requests.js         # All /api/requests routes
│   ├── schema.sql              # Database schema + seed data
│   ├── server.js               # Express entry point
│   ├── .env.example            # Environment variables template
│   └── package.json
└── frontend/
    ├── public/
    │   └── index.html
    └── src/
        ├── context/
        │   └── AuthContext.js  # Global auth state
        ├── components/
        │   ├── Layout.js       # Sidebar + navigation
        │   └── StatusBadge.js  # Status/Priority badge components
        ├── pages/
        │   ├── Login.js        # Module 1 – Login UI
        │   ├── Dashboard.js    # Module 5 – Dashboard (all roles)
        │   ├── CreateRequest.js# Module 2 – Request creation form
        │   └── RequestDetail.js# Module 3,4 – Workflow actions + Timeline
        ├── utils/
        │   └── api.js          # Axios instance with JWT interceptors
        ├── App.js              # Routes + protected routes
        ├── index.js
        ├── index.css           # Full design system
        └── package.json
```

---

## 🚀 Setup Instructions

### 1. Database Setup

```bash
# Open MySQL and run:
mysql -u root -p < backend/schema.sql
```

This creates the `workflow_db` database with tables and 3 seed users.

### 2. Backend Setup

```bash
cd backend
npm install

# Copy and configure environment
cp .env.example .env
# Edit .env with your MySQL credentials and a JWT secret
```

Edit `.env`:
```
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=workflow_db
JWT_SECRET=change_this_to_a_long_random_string
JWT_EXPIRES_IN=7d
```

```bash
npm run dev   # development with nodemon
# OR
npm start     # production
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm start     # Runs on http://localhost:3000
```

---

## 👥 Demo Users (password: `password`)

| Role    | Email                   |
|---------|-------------------------|
| User    | user@example.com        |
| Manager | manager@example.com     |
| Admin   | admin@example.com       |

---

## 🔌 API Reference

### Auth (Module 1)
| Method | Endpoint     | Access | Description        |
|--------|-------------|--------|--------------------|
| POST   | /api/login   | Public | Login, returns JWT |

### Requests (Module 2)
| Method | Endpoint           | Access | Description          |
|--------|--------------------|--------|----------------------|
| POST   | /api/requests      | User   | Create new request   |

### Dashboard (Module 5)
| Method | Endpoint                | Access         | Description             |
|--------|-------------------------|----------------|-------------------------|
| GET    | /api/requests/my-requests| User          | Get own requests        |
| GET    | /api/requests           | Manager, Admin | Get all requests        |
| GET    | /api/requests/:id       | All roles      | Get single request      |

**Query params:** `status`, `category`, `from_date`, `to_date`, `page`, `limit`

### Workflow Engine (Module 3)
| Method | Endpoint                  | Access   | Description          |
|--------|---------------------------|----------|----------------------|
| PATCH  | /api/requests/:id/status  | All roles| Update request status|

**Body:** `{ "status": "Approved", "comment": "optional" }`

### Action Log (Module 4)
| Method | Endpoint                  | Access   | Description        |
|--------|---------------------------|----------|--------------------|
| GET    | /api/requests/:id/logs    | All roles| Get activity log   |

---

## 🔄 Workflow State Machine

```
Submitted ──────────────────────────────────────────────────► Approved ──► Closed ──► Reopened
    │                                                              ▲              │
    ├──────────────────────────────────────────────────────────────┘              │
    │                                                                             │
    ▼                                                                             ▼
Rejected       Needs Clarification ──(User resubmits)──► Submitted          (cycle)
```

| From                  | To                    | Who      |
|-----------------------|-----------------------|----------|
| Submitted             | Approved              | Manager  |
| Submitted             | Rejected              | Manager  |
| Submitted             | Needs Clarification   | Manager  |
| Needs Clarification   | Submitted             | User     |
| Approved              | Closed                | Admin    |
| Closed                | Reopened              | Admin    |

---

## 🛡️ Security Features (Module 6)
- JWT authentication on all protected routes
- Role-based middleware (`authenticate` + `authorize`)
- Input validation via `express-validator` on all POST/PATCH routes
- Workflow engine validates transitions server-side (cannot be bypassed from frontend)
- Users can only view/act on their own requests
- SQL injection protection via parameterized queries (mysql2)

---

## 🎨 UI Features (Module 7)
- Sidebar layout with role-based navigation
- Dashboard stat cards
- Status & priority badges
- Sortable, filterable, paginated request table
- Timeline activity log on request detail
- Confirmation modal for workflow actions
- Loading states & error handling throughout
- Role-based button rendering (no invalid actions shown)
