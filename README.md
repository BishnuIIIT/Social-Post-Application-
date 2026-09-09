# TaskPlanet Social — Mini Social Post Application

[![Tech Stack](https://img.shields.io/badge/Stack-MERN-1E50FF?style=for-the-badge)](https://github.com)
[![Styling](https://img.shields.io/badge/Styling-Pure_CSS_Modules_(No_Tailwind)-059669?style=for-the-badge)](https://github.com)
[![Assignment](https://img.shields.io/badge/Assignment-3W_Full_Stack_Internship-FF6B00?style=for-the-badge)](https://play.google.com/store/apps/details?id=com.taskplanet)

> A modern mini social post application inspired by the **Social Page in the TaskPlanet app** ([Play Store Link](https://play.google.com/store/apps/details?id=com.taskplanet)), built as part of the **3W Full Stack Internship Assignment**.

---

## 📱 TaskPlanet App Inspiration & UI Highlights

- **TaskPlanet Brand Theme**: Signature Royal Blue (`#1E50FF`) and energetic orange accents, with crisp white surfaces and responsive card layout.
- **Mobile Bottom Navigation Bar**: Just like the native TaskPlanet app on Android, mobile users enjoy an app-like bottom navigation bar (**Feed**, **Create Post**, **My Posts**, and **Logout**).
- **Feed Filtering & Tabs**:
  - 🌐 **All Feed**: Public feed showing all community posts.
  - 👤 **My Posts**: Filter to view only your own created posts.
  - 🔥 **Trending**: Sort by highest engagement and likes.
- **Instant Optimistic UI Updates**: Likes and comments update on screen with **0ms perceived latency** without waiting for network roundtrips.
- **Save Usernames of Likers & Commenters**: Full transparency with an interactive **"Liked by..."** banner and modal showing every username who liked the post.

---


## 🛠️ Tech Stack

- **Frontend**: React.js (Vite), Pure CSS / CSS Modules (Strictly **No TailwindCSS**)
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (Mongoose ORM) — *Exactly two collections: `users` and `posts`*
- **Authentication**: JWT (JSON Web Tokens) with 7-day expiration + bcrypt password hashing (work factor: 12)

---

## 🗄️ Database Schema Design (Strictly 2 Collections)

### 1. `users` Collection
```json
{
  "_id": "ObjectId(...)",
  "username": "alex_rivera",
  "email": "alex@taskplanet.com",
  "password": "<bcrypt_hash>",
  "createdAt": "2026-09-09T03:00:00.000Z"
}
```

### 2. `posts` Collection (Embedded Likes & Comments)
```json
{
  "_id": "ObjectId(...)",
  "author": "ObjectId(...)",
  "username": "alex_rivera",
  "text": "Excited to join the TaskPlanet Social community!",
  "imageUrl": "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
  "likes": [
    {
      "user": "ObjectId(...)",
      "username": "sarah_chen",
      "createdAt": "2026-09-09T03:10:00.000Z"
    }
  ],
  "comments": [
    {
      "_id": "ObjectId(...)",
      "user": "ObjectId(...)",
      "username": "david_kumar",
      "text": "Welcome to TaskPlanet! Glad to have you here.",
      "createdAt": "2026-09-09T03:15:00.000Z"
    }
  ],
  "createdAt": "2026-09-09T03:05:00.000Z"
}
```

---

## 🚀 Running Locally

### Prerequisites
- Node.js (v18 or higher)
- MongoDB instance (Local MongoDB or free MongoDB Atlas cluster)

### Step 1: Clone Repository
```bash
git clone <your-repository-url>
cd "Build a Mini Social Post Application"
```

### Step 2: Configure Environment Variables

#### Backend (`backend/.env`)
Create `backend/.env` using `backend/.env.example`:
```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/taskplanet-social?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_here
CLIENT_URL=http://localhost:5173
```

#### Frontend (`frontend/.env`)
Create `frontend/.env` using `frontend/.env.example`:
```env
VITE_API_URL=http://localhost:5000/api
```

### Step 3: Install Dependencies
```bash
# Install root, backend, and frontend dependencies
npm run install:all
```

### Step 4: Start the Applications
Open two terminal windows:

**Terminal 1 (Backend API):**
```bash
cd backend
npm run dev
# Server runs on http://localhost:5000
```

**Terminal 2 (Frontend Web App):**
```bash
cd frontend
npm run dev
# Frontend runs on http://localhost:5173
```

Open `http://localhost:5173` in your browser.

---

## 🌐 Deployment Guide (Deliverables: Step 5)

### 1. Database (MongoDB Atlas)
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and create a free M0 cluster.
2. Under **Network Access**, add `0.0.0.0/0` (allow from anywhere) so Render can connect.
3. Under **Database Access**, create a user with read/write credentials.
4. Copy the connection string: `mongodb+srv://<user>:<password>@cluster.mongodb.net/taskplanet-social`.

### 2. Backend Deployment (Render)
1. Push your code to a public GitHub repository.
2. Sign in to [Render](https://render.com) and click **New Web Service**.
3. Connect your repository and select the `backend` folder as the **Root Directory**.
4. Set:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Add Environment Variables:
   - `MONGODB_URI` = `<your_mongo_atlas_connection_string>`
   - `JWT_SECRET` = `<random_32_character_string>`
   - `CLIENT_URL` = `<your_frontend_vercel_url>`
   - `PORT` = `10000`
6. Click **Deploy**. Your API will be live at `https://<your-backend>.onrender.com`.

### 3. Frontend Deployment (Vercel)
1. Sign in to [Vercel](https://vercel.com) and click **Add New Project**.
2. Select your repository and set the **Root Directory** to `frontend`.
3. Framework Preset: **Vite**.
4. Add Environment Variable:
   - `VITE_API_URL` = `https://<your-backend>.onrender.com/api`
5. Click **Deploy**. Vercel will automatically use `frontend/vercel.json` for SPA routing.

---

## 📡 REST API Reference

| Method | Endpoint | Auth Required | Description |
|---|---|:---:|---|
| `GET` | `/api/health` | No | Uptime health check probe |
| `POST` | `/api/auth/signup` | No | Register account (`username`, `email`, `password`) |
| `POST` | `/api/auth/login` | No | Authenticate user (`email`, `password`) |
| `GET` | `/api/posts?page=1&limit=10&filter=all&sort=latest` | Optional | Paginated community posts list |
| `POST` | `/api/posts` | **Yes** | Create post (`text`, `imageUrl` or both) |
| `POST` | `/api/posts/:id/like` | **Yes** | Instant toggle like/unlike (records username) |
| `POST` | `/api/posts/:id/comments` | **Yes** | Add comment (records username & text) |

---

