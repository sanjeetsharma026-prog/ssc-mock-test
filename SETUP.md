# Complete Setup Guide

## Step 1: Install Dependencies

Open your terminal in the project directory and run:

```bash
npm install
```

## Step 2: Set Up Supabase

1. Go to [https://supabase.com](https://supabase.com) and create a free account
2. Click "New Project"
3. Fill in your project details:
   - Name: `ssc-mock-test` (or any name you prefer)
   - Database Password: Create a strong password (save it!)
   - Region: Choose closest to you
4. Wait for the project to be created (takes 1-2 minutes)

## Step 3: Get Supabase Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (under "Project URL")
   - **anon/public key** (under "Project API keys")

## Step 4: Create Environment File

1. Create a file named `.env.local` in the root directory
2. Add the following content (replace with your actual values):

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

**Example:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Step 5: Set Up Database

1. In your Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Open the file `supabase-setup.sql` from this project
4. Copy ALL the SQL code from that file
5. Paste it into the Supabase SQL Editor
6. Click **Run** (or press Ctrl+Enter)
7. Wait for "Success. No rows returned" message

This will create:
- All necessary tables (profiles, tests, questions, subjects, etc.)
- Row Level Security (RLS) policies
- Default subjects (Mathematics, English, General Knowledge, Reasoning)
- Triggers for automatic profile creation

## Step 6: Create Admin User

After signing up normally:

1. In Supabase dashboard, go to **Authentication** → **Users**
2. Find your user account and copy the **UUID** (User ID)
3. Go to **SQL Editor** again
4. Run this query (replace `YOUR_USER_UUID` with your actual UUID):

```sql
UPDATE profiles 
SET role = 'admin' 
WHERE id = 'YOUR_USER_UUID';
```

5. Click **Run**

Now you can access the admin panel!

## Step 7: Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Step 8: Create Your First Test (Admin)

1. Sign up or log in
2. Go to `/admin` (or click "Admin" in the navbar if you're an admin)
3. Click "Create New Test"
4. Fill in test details:
   - Title: e.g., "SSC CGL Mock Test 1"
   - Description: (optional)
   - Duration: e.g., 60 minutes
5. Click "Create Test"
6. Click "Manage Questions" on your test
7. Click "Add Question" and fill in:
   - Select a subject
   - Enter question text
   - Enter 4 options (A, B, C, D)
   - Select correct answer
   - Set marks (default: 1)
   - Set negative marks (default: 0.25)
8. Repeat step 7 to add more questions

## Step 9: Take a Test (Student)

1. Log in as a student (or create a new account)
2. Go to Dashboard
3. Click "Start Test" on any available test
4. Answer questions, use navigation palette, mark for review
5. Submit when done (or wait for auto-submit when time ends)
6. View your results!

## Troubleshooting

### "Failed to fetch" errors
- Check that your `.env.local` file has correct Supabase credentials
- Make sure you've run the SQL setup script
- Restart the development server after creating `.env.local`

### Can't access admin panel
- Make sure you've updated your user role to 'admin' in the database
- Check that you're logged in with the correct account

### Questions not showing
- Make sure you've added questions to the test via admin panel
- Check that the test has `total_questions > 0`

### Authentication errors
- Clear browser cookies and try again
- Check Supabase dashboard → Authentication → Settings for any restrictions

## Project Structure

```
├── app/                      # Next.js pages
│   ├── (auth)/              # Login & Signup
│   ├── dashboard/             # Student dashboard
│   ├── test/[testId]/      # Mock test page
│   ├── results/[attemptId]/ # Results page
│   └── admin/              # Admin panel
├── components/              # Reusable components
├── lib/                     # Utilities & Supabase clients
├── types/                   # TypeScript types
└── supabase-setup.sql      # Database setup script
```

## Next Steps

- Add more tests and questions
- Customize styling in `tailwind.config.ts`
- Add more subjects if needed
- Deploy to Vercel for production

## Need Help?

- Check Supabase documentation: https://supabase.com/docs
- Check Next.js documentation: https://nextjs.org/docs
- Review the code comments in the files








