# TaskPlanet Social — Mini Social Post Application

[![Tech Stack](https://img.shields.io/badge/Stack-MERN-1E50FF?style=for-the-badge)](https://github.com)
[![Styling](https://img.shields.io/badge/Styling-Pure_CSS_Modules_(No_Tailwind)-059669?style=for-the-badge)](https://github.com)
[![Assignment](https://img.shields.io/badge/Assignment-3W_Full_Stack_Internship-FF6B00?style=for-the-badge)](https://play.google.com/store/apps/details?id=com.taskplanet)

> 
---

#


## 🛠️ Tech Stack

- **Frontend**: React.js (Vite), Pure CSS / CSS Modules (Strictly **No TailwindCSS**)
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (Mongoose ORM) — *Exactly two collections: `users` and `posts`*
- **Authentication**: JWT (JSON Web Tokens) with 7-day expiration + bcrypt password hashing (work factor: 12)

---



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


```





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

