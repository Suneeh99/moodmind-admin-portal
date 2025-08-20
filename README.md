# MoodMind Admin Portal

A web-based admin dashboard for the MoodMind platform built with **Next.js**, **Tailwind CSS**, and **Firebase**. This portal allows administrators to manage users, monitor platform analytics, track user mood trends, and approve or reject consultant applications.

---

## ✨ Features

- 👥 **User Management**: View, update, or remove registered users.
- 📊 **Analytics Dashboard**: Track global mood trends, app usage, and engagement.
- 🧠 **Mood Monitoring**: Visualize individual and overall user mood statistics.
- ✅ **Consultant Approval**: Review and approve/reject consultant sign-up requests.
- 🔐 **Secure Firebase Auth**: Admin login via Firebase Authentication.
- ⚡ **Real-Time Updates**: Firebase Firestore powers live analytics and user tracking.

---

## 🛠 Tech Stack

- **Framework**: Next.js (React)
- **Styling**: Tailwind CSS
- **Backend/Database**: Firebase (Auth, Firestore, Hosting)
- **Charts/Analytics**: Chart.js or Recharts (customizable)

---

## 📦 Installation Guide

### ⚙️ Requirements

- Node.js (v18+ recommended)
- npm or yarn
- Firebase CLI (for local emulation or deployment)
- Access to Firebase project

### 🔽 Clone and Setup

```bash
git clone https://github.com/your-org/moodmind-admin-portal.git
cd moodmind-admin-portal
npm install
```

### 🔐 Environment Configuration

Create a `.env.local` file in the root directory with the following Firebase keys:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

These values can be found in your Firebase project settings.

---

## 🚀 Running the App Locally

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

---

## 🚢 Deploy to Firebase Hosting

Make sure Firebase CLI is installed and logged in:

```bash
firebase login
firebase init
npm run build
firebase deploy
```

> Firebase Hosting is optional; you can also deploy on Vercel, Netlify, or any static host.

---


## 🧪 Testing

```bash
npm run lint
npm run test
```

---

## ✅ Admin Features Summary

| Feature               | Description                                  |
|----------------------|----------------------------------------------|
| 🔐 Login             | Only admins can access the dashboard         |
| 👤 User Control      | Ban, edit or view user profiles              |
| 📉 Mood Insights     | Daily/weekly/monthly sentiment charts        |
| ✅ Consultant Review | Approve or reject new consultant applications|

---

## 🤝 Contributing

1. Fork the repo
2. Create a new branch (`git checkout -b feature/your-feature`)
3. Commit your changes
4. Open a Pull Request



## 💡 Roadmap Ideas

- Notification system for pending consultants
- Export analytics to CSV
- Role-based admin access (e.g. moderator, superadmin)
