# Project Structure Explained

This document explains the structure of the SSC Mock Test website for beginners.

## 📁 Folder Structure

```
mocktest/
├── app/                          # Next.js App Router (all pages go here)
│   ├── (auth)/                   # Authentication pages (grouped route)
│   │   ├── login/page.tsx        # Login page
│   │   └── signup/page.tsx       # Signup page
│   ├── dashboard/page.tsx        # Student dashboard (list of tests)
│   ├── test/[testId]/page.tsx    # Mock test page (dynamic route)
│   ├── results/[attemptId]/page.tsx  # Results page (dynamic route)
│   ├── admin/                    # Admin panel
│   │   ├── page.tsx              # Admin dashboard
│   │   └── tests/                 # Test management
│   │       ├── new/page.tsx      # Create new test
│   │       └── [testId]/         # Edit specific test
│   │           ├── edit/page.tsx # Edit test details
│   │           └── questions/page.tsx  # Manage questions
│   ├── layout.tsx                # Root layout (wraps all pages)
│   ├── page.tsx                  # Home page (redirects)
│   └── globals.css               # Global styles
│
├── components/                    # Reusable React components
│   ├── Navbar.tsx                # Navigation bar (used on all pages)
│   ├── TestPageClient.tsx        # Client component for test page
│   └── QuestionsManager.tsx      # Admin component for managing questions
│
├── lib/                          # Utility functions and helpers
│   └── supabase/                 # Supabase database client
│       ├── client.ts             # Browser-side Supabase client
│       ├── server.ts             # Server-side Supabase client
│       └── middleware.ts         # Auth middleware helper
│
├── types/                        # TypeScript type definitions
│   └── database.ts               # Database table types
│
├── middleware.ts                 # Next.js middleware (runs on every request)
├── package.json                  # Project dependencies
├── tsconfig.json                 # TypeScript configuration
├── tailwind.config.ts            # Tailwind CSS configuration
├── supabase-setup.sql            # Database setup script
└── README.md                     # Project documentation

```

## 🔑 Key Files Explained

### 1. **app/layout.tsx**
- Wraps all pages
- Sets up fonts and global HTML structure

### 2. **app/page.tsx**
- Home page that redirects users to login or dashboard

### 3. **app/(auth)/login/page.tsx** & **signup/page.tsx**
- Authentication pages
- Uses Supabase to sign users in/up

### 4. **app/dashboard/page.tsx**
- Shows list of available tests
- Students can click to start a test

### 5. **app/test/[testId]/page.tsx**
- Server component that loads test data
- Passes data to `TestPageClient` component

### 6. **components/TestPageClient.tsx**
- Main test-taking interface
- Handles timer, question navigation, answers
- Auto-submits when time ends

### 7. **app/results/[attemptId]/page.tsx**
- Shows test results
- Displays score, accuracy, subject-wise analysis

### 8. **app/admin/page.tsx**
- Admin dashboard
- Lists all tests
- Only accessible to admin users

### 9. **components/QuestionsManager.tsx**
- Admin interface for adding/editing/deleting questions

### 10. **lib/supabase/client.ts** & **server.ts**
- Supabase database clients
- `client.ts` for browser (client components)
- `server.ts` for server (server components)

### 11. **middleware.ts**
- Protects routes (requires login)
- Redirects unauthenticated users to login

### 12. **supabase-setup.sql**
- SQL script to create all database tables
- Sets up security policies
- Creates default subjects

## 🎯 How It Works

### User Flow:
1. **Sign Up/Login** → Creates account in Supabase
2. **Dashboard** → Sees available tests
3. **Start Test** → Creates test attempt, loads questions
4. **Take Test** → Answer questions, use timer, mark for review
5. **Submit** → Calculates score, saves results
6. **View Results** → See score, accuracy, analysis

### Admin Flow:
1. **Login as Admin** → Access admin panel
2. **Create Test** → Add test details (title, duration)
3. **Add Questions** → Add questions with options and correct answer
4. **Students Take Test** → Test appears on student dashboard

## 🔐 Security

- **Row Level Security (RLS)**: Database policies ensure users can only:
  - View their own test attempts
  - View their own responses
  - Admins can manage tests/questions
- **Middleware**: Protects routes, requires authentication
- **Role-based Access**: Admin vs Student roles

## 🎨 Styling

- **Tailwind CSS**: Utility-first CSS framework
- All styling done with Tailwind classes
- Responsive design (mobile-friendly)

## 📊 Database Tables

1. **profiles** - User profiles (extends auth.users)
2. **tests** - Test information
3. **questions** - Test questions
4. **subjects** - Subject categories
5. **test_attempts** - User test attempts
6. **test_responses** - User answers to questions

## 🚀 Next Steps

1. Customize colors in `tailwind.config.ts`
2. Add more features (test history, leaderboard, etc.)
3. Deploy to Vercel for production









