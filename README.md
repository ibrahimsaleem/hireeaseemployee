# Aplyease Employee Portal

A **completely independent** full-stack app for Aplyease employees.  
It has its own backend + frontend, sharing only the Supabase database with the main app.

```
employee-portal/
  server/          ← Express API (Node.js backend)
  src/             ← React frontend (Vite)
  package.json     ← single package.json for both
```

---

## Architecture

```
Employees → Employee Portal Frontend (Vercel)
               ↕ HTTPS / JWT
            Employee Portal API (Render) ← this server
               ↕ SQL
            Supabase PostgreSQL (shared DB)
```

- No dependency on the main Aplyease backend
- Employees log in with their existing credentials
- Same database, separate server, separate frontend URL

---

## Local Development

### 1. Install dependencies
```bash
cd employee-portal
npm install
```

### 2. Configure environment
The `.env` file is already set up. For local dev it should contain:
```env
DATABASE_URL=postgresql://...supabase...
NODE_TLS_REJECT_UNAUTHORIZED=0
SESSION_SECRET=your-secret
GEMINI_API_KEY=your-key
GEMINI_PUBLIC_MODEL=gemini-2.5-flash
PORT=3001

VITE_API_URL=http://localhost:3001
```

### 3. Start everything
```bash
# Terminal 1 — backend API on http://localhost:3001
npm run dev:server

# Terminal 2 — frontend on http://localhost:5174
npm run dev

# Or both at once:
npm run dev:all
```

### 4. Login
Go to `http://localhost:5174` and log in with any EMPLOYEE account.

---

## Deploy to Production

### Backend — Deploy to Render

1. Push to GitHub (the whole `aplyease-2` repo or just `employee-portal/`)

2. Create a new **Web Service** on [render.com](https://render.com):
   - **Root Directory**: `employee-portal`
   - **Build Command**: `npm install`
   - **Start Command**: `npx tsx server/index.ts`
   - **Runtime**: Node

3. Set environment variables in Render dashboard:
   ```
   DATABASE_URL        = your Supabase connection string
   SESSION_SECRET      = any long random string
   GEMINI_API_KEY      = your Gemini key
   GEMINI_API_KEY_2    = fallback Gemini key
   GEMINI_PUBLIC_MODEL = gemini-2.5-flash
   NODE_TLS_REJECT_UNAUTHORIZED = 0
   NODE_ENV            = production
   PORT                = 3001
   ```

4. Your API will be live at: `https://aplyease-employee-api.onrender.com`

### Frontend — Deploy to Vercel

1. Create a new project on [vercel.com](https://vercel.com):
   - **Root Directory**: `employee-portal`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Framework Preset**: Vite

2. Set environment variable:
   ```
   VITE_API_URL = https://aplyease-employee-api.onrender.com
   ```

3. Your employee portal will be live at: `https://your-name.vercel.app`

> The CORS config in `server/index.ts` already allows all `*.vercel.app` origins.

---

## API Routes

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/login` | Login (EMPLOYEE/ADMIN only) |
| GET | `/api/auth/user` | Get current user |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/clients` | List assigned clients |
| GET | `/api/client-profiles/:userId` | Get client profile |
| GET | `/api/resume-profiles/:clientId` | List resume profiles |
| GET | `/api/applications` | List applications (paginated) |
| POST | `/api/applications` | Submit new application |
| PATCH | `/api/applications/:id` | Update application status |
| GET | `/api/stats/employee/:id` | Employee stats |
| GET | `/api/payment-transactions/:clientId` | Payment history |
| POST | `/api/generate-resume/:clientId` | AI tailor resume |
| POST | `/api/generate-pdf` | Compile LaTeX → PDF |
| GET | `/api/health` | Health check |
