# T.BulkMail - Bulk Email Campaign Platform

> A full-stack SaaS bulk email web application built with modern technologies. Send bulk emails effortlessly, manage campaigns, track results, and grow your business.

**Made with ❤️ by Tilak Dalai** — 2nd Year CSE Student @ GCEK | Software Developer & Gamer

---

## Features

- **Bulk Email Sending** — Send thousands of emails with SMTP (one-by-one with delay to avoid spam)
- **CSV Import** — Upload recipient lists from CSV files with column mapping
- **Email Templates** — Create, save, and reuse email templates with personalization placeholders `{name}`
- **Campaign Management** — Create, schedule, and track email campaigns
- **Real-time Analytics** — Track sent, failed, and delivery stats with interactive charts
- **Payment Gateway** — Razorpay integration for Pro & Enterprise plan purchases (UPI, Cards, Net Banking)
- **Admin Dashboard** — Manage users, view campaigns, approve upgrade requests
- **JWT Authentication** — Secure login/register with role-based access (USER/ADMIN)
- **Dark/Light Mode** — Automatically follows your system preference
- **Responsive Design** — Works beautifully on desktop, tablet, and mobile

---

## Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS 4 + shadcn/ui |
| **Database** | SQLite (via Prisma ORM) |
| **Authentication** | JWT + bcryptjs |
| **Email Sending** | Nodemailer (SMTP) |
| **Payments** | Razorpay |
| **Animations** | Framer Motion |
| **Charts** | Recharts |
| **CSV Parsing** | PapaParse |

---

## Prerequisites

Before you begin, make sure you have:

- **Node.js** v18+ (or Bun runtime)
- **npm** or **bun** package manager
- **Git** for cloning the repository
- A **Gmail account** (or any SMTP provider) for sending emails
- A **Razorpay account** (for payment integration)

---

## Quick Start (Download & Run Locally)

### Step 1: Clone or Download the Project

```bash
# Option A: Clone with Git
git clone <repository-url>
cd my-project

# Option B: Download ZIP
# 1. Download the project ZIP file
# 2. Extract it to your desired location
# 3. Open terminal in the extracted folder
```

### Step 2: Install Dependencies

```bash
# Using npm
npm install

# OR using Bun (faster)
bun install
```

### Step 3: Set Up Environment Variables

Create a `.env` file in the project root (or edit the existing one):

```env
# Database (SQLite - already configured)
DATABASE_URL=file:./db/custom.db

# Razorpay Payment Gateway (Test Mode)
# Sign up at https://dashboard.razorpay.com and get your test keys
RAZORPAY_KEY_ID=rzp_test_YourTestKeyId
RAZORPAY_KEY_SECRET=YourTestKeySecret

# JWT Secret (change this to a strong random string in production)
JWT_SECRET=your-super-secret-jwt-key-change-this

# SMTP Email Configuration
# For Gmail: Enable 2FA → Create App Password → Use it here
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="T.BulkMail <your-email@gmail.com>"

# Admin seed email (used during initial database seeding)
ADMIN_EMAIL=admin@bulkmail.com
```

### Step 4: Set Up the Database

```bash
# Push the database schema (creates tables)
npx prisma db push

# OR with Bun
bunx prisma db push

# Generate Prisma client
npx prisma generate

# Seed the database with admin and demo users
npx prisma db seed
# OR manually:
# bun run src/scripts/seed.ts
```

This creates:
- **Admin user**: `admin@bulkmail.com` / `admin123`
- **Demo user**: `demo@bulkmail.com` / `demo123`

### Step 5: Start the Development Server

```bash
# Using npm
npm run dev

# Using Bun
bun run dev
```

The app will be running at **http://localhost:3000**

### Step 6: Open in Browser

Open [http://localhost:3000](http://localhost:3000) in your browser and:
1. Register a new account, OR
2. Login with the demo credentials above

---

## SMTP Setup Guide (Gmail)

To send real emails, you need to configure SMTP:

1. **Go to your Google Account** → [myaccount.google.com](https://myaccount.google.com)
2. **Enable 2-Step Verification** (if not already enabled)
3. **Create an App Password**:
   - Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
   - Select "Mail" and your device
   - Generate the password
4. **Update your `.env`**:
   ```env
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=the-16-char-app-password
   ```
5. **Restart the server**

> **Note**: Without valid SMTP credentials, the app will still work but emails won't actually be sent. Campaign creation and UI will function normally.

---

## Razorpay Payment Setup

To enable real payment processing:

1. **Sign up at** [dashboard.razorpay.com](https://dashboard.razorpay.com)
2. **Go to Settings → API Keys**
3. **Generate Test Mode keys** (for development)
4. **Update your `.env`**:
   ```env
   RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXXXX
   RAZORPAY_KEY_SECRET=XXXXXXXXXXXXXXXXXXXXXX
   ```
5. **Restart the server**

### Testing Payments

Use these Razorpay test card numbers in test mode:
- **Card Number**: `4111 1111 1111 1111`
- **Expiry**: Any future date
- **CVV**: Any 3 digits
- **Name**: Any name

### Going Live

When ready for production:
1. Switch to Live Mode keys in Razorpay Dashboard
2. Update `.env` with live keys (`rzp_live_...`)
3. Set up webhook URL for payment notifications

---

## Project Structure

```
my-project/
├── .env                          # Environment variables
├── prisma/
│   └── schema.prisma             # Database schema
├── public/
│   ├── logo.svg                  # App logo
│   ├── tilak-profile.png         # Creator photo
│   └── robots.txt
├── src/
│   ├── app/
│   │   ├── layout.tsx            # Root layout
│   │   ├── page.tsx              # Main SPA page
│   │   ├── globals.css           # Global styles
│   │   └── api/
│   │       ├── auth/             # Auth endpoints (login, register, me)
│   │       ├── campaigns/        # Campaign CRUD + send + export
│   │       ├── templates/        # Email templates CRUD
│   │       ├── admin/            # Admin endpoints (users, dashboard, upgrade-requests, campaigns)
│   │       ├── profile/          # User profile endpoints
│   │       └── payments/         # Payment endpoints (create-order, verify, history)
│   ├── components/
│   │   ├── app/                  # App-specific components
│   │   │   ├── LandingPage.tsx   # Home/landing page
│   │   │   ├── LoginPage.tsx     # Login form
│   │   │   ├── RegisterPage.tsx  # Registration form
│   │   │   ├── PricingPage.tsx   # Plans + Razorpay checkout
│   │   │   ├── DashboardPage.tsx # User dashboard with analytics
│   │   │   ├── CreateCampaignPage.tsx  # Campaign wizard
│   │   │   ├── CampaignsPage.tsx # Campaign history
│   │   │   ├── CampaignDetailPage.tsx  # Campaign detail + email preview
│   │   │   ├── TemplatesPage.tsx # Email templates manager
│   │   │   ├── ProfilePage.tsx   # Profile + payment + plan management
│   │   │   ├── Navbar.tsx        # Top navigation bar
│   │   │   ├── Sidebar.tsx       # Side navigation (logged in)
│   │   │   ├── AdminDashboardPage.tsx   # Admin overview
│   │   │   ├── AdminUsersPage.tsx       # Admin user management
│   │   │   └── AdminCampaignsPage.tsx   # Admin campaign viewer
│   │   └── ui/                   # shadcn/ui components
│   ├── contexts/
│   │   └── AuthContext.tsx       # Auth state management
│   ├── hooks/                    # Custom React hooks
│   ├── lib/
│   │   ├── api.ts               # API helper functions
│   │   ├── auth.ts              # JWT auth utilities
│   │   ├── csv.ts               # CSV parsing helpers
│   │   ├── db.ts                # Prisma client instance
│   │   ├── email.ts             # Nodemailer email sending
│   │   ├── limits.ts            # Plan limit enforcement
│   │   └── utils.ts             # Utility functions
│   └── scripts/
│       └── seed.ts              # Database seed script
└── README.md
```

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |

### Campaigns
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/campaigns` | List user campaigns |
| GET | `/api/campaigns/detail?id=` | Get campaign detail + email logs |
| POST | `/api/campaigns` | Create new campaign |
| POST | `/api/campaigns/send` | Send a campaign |
| GET | `/api/campaigns/export?campaignId=` | Export campaign logs as CSV |

### Templates
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/templates` | List user templates |
| POST | `/api/templates` | Create template |
| PUT | `/api/templates` | Update template |
| DELETE | `/api/templates` | Delete template |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payments/create-order` | Create Razorpay payment order |
| POST | `/api/payments/verify` | Verify payment & upgrade user |
| GET | `/api/payments/history` | Get payment history |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/dashboard` | Admin dashboard stats |
| GET | `/api/admin/users` | List all users (paginated) |
| PUT | `/api/admin/users` | Block/unblock/upgrade/downgrade user |
| DELETE | `/api/admin/users` | Delete user |
| GET | `/api/admin/campaigns` | List all campaigns (paginated) |
| GET | `/api/admin/upgrade-requests` | List upgrade requests |
| PUT | `/api/admin/upgrade-requests` | Approve/reject upgrade request |

### Profile
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/profile` | Get user profile + stats |
| PUT | `/api/profile` | Update profile / change password |
| DELETE | `/api/profile` | Delete account |

---

## Plan Limits

| Feature | Free | Pro (₹499/mo) | Enterprise (₹999/mo) |
|---------|------|---------------|----------------------|
| Emails per campaign | 10 | 500 | Unlimited |
| Campaigns per day | 3 | 50 | Unlimited |
| Email templates | 1 | Unlimited | Unlimited |
| CSV import | ❌ | ✅ | ✅ |
| Advanced analytics | ❌ | ✅ | ✅ |
| API access | ❌ | ❌ | ✅ |
| Priority support | ❌ | ✅ | ✅ |
| Custom integrations | ❌ | ❌ | ✅ |

---

## Deployment Guide

### Deploy to Vercel (Frontend + API)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and import your repo
3. Set environment variables in Vercel dashboard
4. Deploy!

> **Note**: Vercel's serverless functions have a 10-second timeout on the free plan, which may not be enough for sending bulk emails. Consider using Render or Railway for the backend.

### Deploy to Render (Full Stack)

1. Push your code to GitHub
2. Go to [render.com](https://render.com) and create a new Web Service
3. Connect your GitHub repo
4. Set build command: `npm run build`
5. Set start command: `npm run start`
6. Add environment variables
7. Deploy!

### Using a Cloud Database (Optional)

For production, you may want to switch from SQLite to PostgreSQL:

1. Update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. Set `DATABASE_URL` to your PostgreSQL connection string
3. Run `npx prisma migrate dev` to create migrations
4. Run `npx prisma db seed` to seed the database

Free PostgreSQL options:
- [Neon](https://neon.tech) — Free tier available
- [Supabase](https://supabase.com) — Free tier available
- [Railway](https://railway.app) — Free trial

---

## Troubleshooting

### "Failed to send emails" error
- Check your SMTP credentials in `.env`
- For Gmail, ensure you're using an **App Password**, not your regular password
- Make sure 2-Step Verification is enabled on your Google account

### "Payment order creation failed"
- Verify your Razorpay API keys in `.env`
- Ensure you're using **Test Mode** keys during development
- Check the Razorpay dashboard for error logs

### "Prisma Client not found"
- Run `npx prisma generate` to regenerate the Prisma client
- Restart the development server

### Database issues
- Run `npx prisma db push` to sync the schema
- For a fresh start: delete `db/custom.db` and run `npx prisma db push` again

---

## License

This project is open source and available for personal and educational use.

---

**Built with ❤️ by [Tilak Dalai](https://github.com/tilakdalai)**

*2nd Year CSE Student @ Government College of Engineering, Kalahandi (GCEK)*
*Software Developer | Gamer | Tech Enthusiast*
