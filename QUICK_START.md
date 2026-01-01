# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Supabase
1. Create account at [supabase.com](https://supabase.com)
2. Create a new project
3. Copy your **Project URL** and **anon key** from Settings → API

### 3. Create `.env.local` File
```env
NEXT_PUBLIC_SUPABASE_URL=your_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key_here
```

### 4. Set Up Database
1. In Supabase dashboard → SQL Editor
2. Copy all code from `supabase-setup.sql`
3. Paste and click **Run**

### 5. Make Yourself Admin
1. Sign up on the website
2. In Supabase → Authentication → Users, copy your UUID
3. In SQL Editor, run:
```sql
UPDATE profiles SET role = 'admin' WHERE id = 'YOUR_UUID';
```

### 6. Run the App
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## ✅ You're Ready!

- **Students**: Sign up and take tests
- **Admins**: Go to `/admin` to create tests and questions

## 📝 Next Steps

1. Create your first test in the admin panel
2. Add questions to the test
3. Take the test as a student
4. View results and analytics

For detailed instructions, see `SETUP.md`









