# LinkedIn Clone — React Native MVP

A basic LinkedIn-like mobile app built with **React Native (Expo)** and **Supabase**.

---

## ✅ Features

- Sign Up / Log In with email & password
- Stay logged in across app restarts
- Edit profile (name, bio, avatar photo)
- Create posts with optional images
- View a feed of all posts
- Like / Unlike posts
- View your own profile with post history

---

## 📁 Project Structure

```
/App.js                         ← Entry point
/app
  /screens
    LoginScreen.js              ← Login form
    SignupScreen.js             ← Signup form
    FeedScreen.js               ← Home feed
    CreatePostScreen.js         ← Create a new post
    ProfileScreen.js            ← User profile view
    EditProfileScreen.js        ← Edit profile form
  /components
    PostCard.js                 ← Reusable post card
  /services
    supabase.js                 ← Supabase client setup
  /navigation
    AppNavigator.js             ← Navigation + auth state
/supabase_setup.sql             ← Run this in Supabase SQL Editor
```

---

## 🚀 Setup Instructions

### Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click **New Project**
3. Fill in project name and password, choose a region
4. Wait for it to finish setting up (~1 min)

### Step 2: Set Up the Database

1. In your Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Paste the entire contents of `supabase_setup.sql`
4. Click **Run**

### Step 3: Create Storage Buckets

In your Supabase dashboard:
1. Go to **Storage** → click **New Bucket**
2. Name it `avatars`, turn **Public** ON → Create
3. Click **New Bucket** again
4. Name it `posts`, turn **Public** ON → Create

### Step 4: Get Your Supabase Keys

1. In Supabase dashboard → **Settings** → **API**
2. Copy:
   - **Project URL** (looks like `https://abcdefgh.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)

### Step 5: Add Keys to the App

Open `app/services/supabase.js` and replace:

```js
const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_PUBLIC_KEY';
```

With your actual values from Step 4.

### Step 6: Enable Email Auth

1. In Supabase dashboard → **Authentication** → **Providers**
2. Make sure **Email** is enabled (it usually is by default)
3. Optionally disable **Confirm email** for easier testing:
   - Authentication → Settings → disable "Enable email confirmations"

### Step 7: Install and Run

```bash
# Install dependencies
npm install

# Start the Expo development server
npx expo start
```

Then scan the QR code with the **Expo Go** app on your phone.

---

## 🛠️ Tech Stack

| Layer       | Technology                     |
|-------------|-------------------------------|
| Framework   | React Native via Expo SDK 51   |
| Language    | JavaScript (no TypeScript)     |
| Navigation  | React Navigation v6            |
| Backend     | Supabase (Auth + DB + Storage) |
| Database    | PostgreSQL (via Supabase)      |
| Storage     | Supabase Storage               |

---

## ⚠️ Common Issues

**"relation users does not exist"**
→ Run the SQL file in the Supabase SQL Editor

**Images not uploading**
→ Make sure the `avatars` and `posts` buckets exist and are set to **Public**

**Login not working**
→ Check your Supabase URL and anon key in `supabase.js`

**"Email not confirmed" error**
→ Disable email confirmation in Supabase Auth settings (for testing)

---

## 📝 Notes

- This is a college MVP project — not for production use
- No custom backend, no Express, no JWT handling — all handled by Supabase
- Keep logic in components or simple files for readability
