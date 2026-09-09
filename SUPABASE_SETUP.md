# Supabase Setup — Student Management System

The app has been fully migrated from Firebase to Supabase.
Project: `https://wjxcileyccpxxautqxxx.supabase.co`

Do these steps **once** and the app works immediately.

---

## Step 1 — Create the database (required, 2 minutes)

1. Open the [Supabase Dashboard](https://supabase.com/dashboard) → your project
2. Go to **SQL Editor** → **New query**
3. Open the file **`supabase-schema.sql`** in this repo, copy **everything**, paste it, click **Run**
4. You should see `Success. No rows returned`

This creates 4 tables (`users`, `students`, `members`, `attendance_records`),
all security policies (admin / staff / viewer roles), and enables real-time sync.

Verify: **Table Editor** → you should see the 4 tables.

---

## Step 2 — Auth settings (recommended)

### Email confirmation
Supabase by default requires users to confirm their email before first login.
The app handles both modes, so pick whichever you want:

- **Keep it ON** (more secure): users sign up → get a confirmation email → then log in.
  The app shows them a "check your inbox" message automatically.
- **Turn it OFF** (simpler for students): **Authentication → Settings → Email Auth →
  Confirm email → OFF**. Users can log in immediately after signup.

### Site URL (important for password reset + Google login)
1. Go to **Authentication → URL Configuration**
2. Set **Site URL** to where your app is hosted
   (e.g. `https://gokulraj0708.github.io` or your custom domain)
3. Under **Redirect URLs**, add the same URL (and `http://localhost:8080` for testing)

---

## Step 3 — Google login (optional)

Email + password works out of the box. For the **Sign in with Google** button:

1. Supabase Dashboard → **Authentication → Providers → Google → Enable**
2. Create OAuth credentials in [Google Cloud Console](https://console.cloud.google.com/):
   - APIs & Services → Credentials → Create Credentials → OAuth client ID (Web)
   - Authorized redirect URI: copy it from the Supabase Google provider page
     (looks like `https://wjxcileyccpxxautqxxx.supabase.co/auth/v1/callback`)
3. Paste the **Client ID** + **Client Secret** back into Supabase → Save

---

## Step 4 — Move your existing Firebase data (if any)

Your old data is still in Firebase. Easiest path — no code needed:

1. Open the **old (Firebase) version** of the app, log in
2. **Export → Download** the student list PDF (it secretly carries the exact data)
3. Open the **new (Supabase) version**, log in (same email, sign up again — it's a new auth system)
4. **Import** that PDF → all students recreated exactly

Attendance history can't transfer this way (only student profiles travel in the PDF),
so export any attendance reports you need as PDFs first for your records.

After migration, you can shut down or ignore the old Firebase project.

---

## What changed in the code

| Before (Firebase)              | After (Supabase)                              |
|-------------------------------|-----------------------------------------------|
| `firebase-auth-compat.js` etc. | `@supabase/supabase-js@2`                     |
| Email/password via Firebase   | `supabase.auth.signUp / signInWithPassword`   |
| Google popup                  | `signInWithOAuth({ provider: "google" })`     |
| Firestore `students/{uid}/list` | Postgres table `students` (with `owner_id`) |
| Firestore `members` subcollection | Postgres table `members`                   |
| Firestore `attendance/.../records` | Postgres table `attendance_records`      |
| `onSnapshot` listeners        | Realtime `postgres_changes` channels          |
| Firestore security rules      | Row Level Security policies (in the `.sql`)   |

Everything else — UI, PDF export/import, attendance marking, roles
(admin/staff/viewer) — works exactly as before.

## Security note

The key in `index.html` (`sb_publishable_...`) is the **publishable key** —
it is designed to be public and safe in frontend code. Real protection comes
from the Row Level Security policies. **Never** put the `service_role` /
secret key in this repo — it bypasses all security.
