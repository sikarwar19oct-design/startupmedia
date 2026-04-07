# StartupMedia 🚀

A high-retention, premium storytelling platform for the next generation of builders.

## 🎨 Features
- **Noir Design**: Deep black and orange premium aesthetic.
- **Motion Effects**: Anti-gravity floating elements and section reveals.
- **Admin Dashboard**: Effortless story management.
- **Hybrid Storage**: Local JSON for dev, Supabase Postgres for production.

---

## 🛠️ Supabase Setup (Fixes Vercel Publishing)
To enable the "Publish" button on your live Vercel site for **FREE** (no credit card needed):

### 1. Create Supabase Project
- Login to [Supabase](https://supabase.com) with GitHub.
- Create a new project called `startup-media`.
- Go to **Project Settings** → **API** and copy `Project URL` and `anon public` key.

### 2. Connect to Vercel
- Go to **Vercel Dashboard** → **Settings** → **Environment Variables**.
- Add these:
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
- **Redeploy** your latest deployment.

### 3. Run the SQL Schema
- In Supabase, go to the **SQL Editor** and run this:

```sql
CREATE TABLE IF NOT EXISTS articles (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  image TEXT,
  category TEXT,
  excerpt TEXT,
  content TEXT,
  read_time TEXT,
  date TEXT,
  trending BOOLEAN DEFAULT false,
  author TEXT
);

-- Public access (No Auth required for MVP)
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Access" ON articles FOR ALL USING (true) WITH CHECK (true);
```

---

## 💻 Local Development
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

**Admin Dashboard (Local)**: `http://localhost:3000/admin/dashboard`
**Admin Editor (Local)**: `http://localhost:3000/admin/editor`
