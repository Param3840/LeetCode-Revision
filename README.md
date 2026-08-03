# 🚀 CodeRevise

<p align="center">

### **Never Forget a Solved LeetCode Problem Again.**

Automatically sync your LeetCode submissions, build a revision habit, maintain streaks, visualize your learning with GitHub-style heatmaps, and gamify your DSA journey.

</p>

---

## ✨ About CodeRevise

Every programmer solves hundreds of LeetCode problems.

The biggest problem isn't solving them.

The biggest problem is **forgetting them.**

Most developers solve problems once and rarely revisit them. Weeks later they struggle with the same questions again.

**CodeRevise** solves this problem by turning LeetCode into a complete revision platform.

Using a Chrome Extension, every accepted submission is automatically synchronized with your personal dashboard where you can:

- 📚 Organize solved problems
- 🔥 Build revision streaks
- 📅 Track consistency with heatmaps
- 🏆 Earn achievements
- ⭐ Mark favorites
- 📊 Analyze your progress
- 🎯 Revise instead of forgetting

Instead of simply solving problems, CodeRevise helps you **retain** them.

---

# 🌟 Features

## 🔐 Google Authentication

- Secure Google OAuth Login
- JWT Authentication
- Protected APIs
- Automatic Website ↔ Extension synchronization

---

## 🌐 Chrome Extension

Automatically detects

✅ Current Problem

✅ Accepted Submission

✅ Programming Language

✅ Source Code

✅ Difficulty

✅ Topics

and syncs everything directly to your CodeRevise account.

---

## 📚 Revision Dashboard

Manage all solved problems.

Features include

- Search
- Filters
- Favorites
- Review Queue
- Difficulty Filters
- Topic Filters
- Smart Revision

---

## 🔥 Revision Heatmap

GitHub-inspired activity heatmap designed specifically for revision.

Tracks

- Current Streak
- Longest Streak
- Revision Days
- Daily Activity
- Total Reviews

Revision history remains permanent even after resetting a problem.

---

## 🏆 Achievement System

Gamify your revision journey.

Unlock achievements for

- Solving problems
- Maintaining streaks
- Revising consistently
- Solving Hard questions
- Mastering Topics

Earn XP and level up as you improve.

---

## 👤 Profile Dashboard

View

- Personal Statistics
- Revision Heatmap
- XP Progress
- Levels
- Achievements
- Revision Analytics

---

## 📊 Analytics

Track

- Total Problems
- Easy / Medium / Hard
- Revision Count
- Favorite Problems
- Streaks
- Topic Distribution

---

# 🛠 Tech Stack

| Frontend | Backend | Database | Authentication | Extension | Deployment |
|----------|----------|----------|----------------|-----------|------------|
| Next.js | Node.js | MongoDB Atlas | Google OAuth + JWT | Chrome Extension (Manifest V3) | Vercel + Render |

---

# 🏗 Architecture

```text
                 Google OAuth
                       │
                       ▼
               Express Backend (Render)
                       │
               JWT Authentication
                       │
        ┌──────────────┴──────────────┐
        ▼                             ▼
 Next.js Website                Chrome Extension
   (Vercel)                          │
        │                            │
        └──────────────┬─────────────┘
                       ▼
                 MongoDB Atlas
```

---

# 🔄 How CodeRevise Works

```text
Open Website
      │
      ▼
Login with Google
      │
      ▼
Install Chrome Extension
      │
      ▼
Connect Extension
      │
      ▼
Open LeetCode
      │
      ▼
Solve Problem
      │
      ▼
Accepted Submission
      │
      ▼
Extension Detects Submission
      │
      ▼
Backend API
      │
      ▼
MongoDB
      │
      ▼
Dashboard Updated
      │
      ▼
Revision Dashboard
      │
      ▼
Heatmap Updated
      │
      ▼
Achievements Updated
```

---

# 🚀 Installation Guide

## Step 1️⃣ Visit CodeRevise

Open

**https://leet-code-revision.vercel.app**

Login using your **Google Account**.

This creates your personal CodeRevise workspace.

---

## Step 2️⃣ Install Chrome Extension

Download the latest **CodeRevise Chrome Extension** from the GitHub Release below:

### 📦 Download Extension

➡️ **[Download CodeRevise Extension](https://github.com/Param3840/LeetCode-Revision/releases/download/untagged-3570ab027b7da04bb5c2/extension.rar)**

After downloading:

1. Extract the downloaded **extension.rar** file.
2. Open **Google Chrome**.
3. Visit:

```text
chrome://extensions
```

4. Enable **Developer Mode**.
5. Click **Load unpacked**.
6. Select the extracted **CodeRevise Extension** folder.

✅ Your Chrome Extension is now installed successfully.

## Step 3️⃣ Connect Extension

Click the CodeRevise Extension.

Press

**Connect Account**

Login using **the same Google account** used on the website.

The extension automatically connects with your CodeRevise account.

---

## Step 4️⃣ Start Solving

Go to

https://leetcode.com

Solve problems normally.

Whenever an **Accepted** submission is detected,

CodeRevise automatically

- ☁️ Uploads the submission
- 📚 Stores the solution
- 🔥 Updates your heatmap
- 📈 Updates streaks
- 🏆 Updates achievements
- 🎯 Adds the problem to your revision dashboard

No manual sync required.

---

# 📂 Project Structure

```text
CodeRevise
│
├── backend
│
├── src
│
├── public
│
├── extension
│
└── README.md
```

---

# 🌍 Deployment

Frontend

**Vercel**

Backend

**Render**

Database

**MongoDB Atlas**

Authentication

**Google OAuth 2.0**

---

# 📸 Screenshots

- 🏠 Landing Page
- 📚 Dashboard
- 👤 Profile
- 🔥 Heatmap
- 🏆 Achievements
- 🧩 Chrome Extension

---

# 🚀 Future Roadmap

- AI Revision Suggestions
- Email Reminders
- Calendar Integration
- Notes
- Flashcards
- Weekly Reports
- Firefox Extension

---

# 👨‍💻 Author

**Paramveer Kumar Singh**

GitHub

https://github.com/Param3840

⭐ If you like this project, don't forget to **Star** the repository.
