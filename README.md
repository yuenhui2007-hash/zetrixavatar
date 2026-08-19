# 🤖 Zetrix AI Academy

**Interactive AI Learning Platform** — Master AI tools and workflows through 6 specialized courses with hands-on lessons, quizzes, and progress tracking.

---

## 🌐 Live Demo

| Frontend (GitHub Pages) | Backend (Render) |
|------------------------|------------------|
| [yuenhui2007-hash.github.io/zetrixavatar](https://yuenhui2007-hash.github.io/zetrixavatar) | `https://learnai-backend-n0df.onrender.com/api` |

---

## 📚 Courses Offered

| Course | Description | Level |
|--------|-------------|-------|
| 🧠 **AI Brain** | AI fundamentals, neural networks, deep learning basics | Beginner |
| 💻 **AI Coding** | Programming with AI assistance, debugging protocols | Intermediate |
| 🎭 **Avatar Foundations** | AI avatar creation, voice synthesis, digital identity | Beginner |
| 🏢 **Business Automation** | Workflow automation, AI-powered business tools | Intermediate |
| ⚡ **Personal Productivity** | AI assistants, time management, smart scheduling | Beginner |
| 📈 **Sales & Marketing** | AI-driven marketing, lead generation, content creation | Intermediate |

---

## ✨ Features

- **📖 Segmented Learning** — Bite-sized lessons with progress tracking
- **📝 Interactive Quizzes** — Test your knowledge after each segment
- **🃏 Flashcards** — Spaced repetition for key concepts
- **📊 Progress Dashboard** — Visual progress bars and completion stats
- **🏆 Certificates** — Earn certificates on course completion
- **🔐 Multi-Auth** — Local signup, Google OAuth, Apple Sign-In
- **📱 PWA Ready** — Install as a mobile app
- **🌙 Dark/Light Mode** — Theme switching support

---

## 🏗️ Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│   Backend API   │────▶│   Database      │
│   (GitHub Pages)│◄────│   (Render)      │◄────│   (MongoDB      │
│   Static HTML   │     │   Express.js    │     │   or In-Memory) │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Vanilla HTML5, CSS3, JavaScript (no framework) |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB (Mongoose) or In-Memory fallback |
| **Auth** | JWT, Passport.js, Google & Apple OAuth |
| **Hosting** | GitHub Pages (frontend), Render (backend) |

---

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yuenhui2007-hash/zetrixavatar.git
cd zetrixavatar
```

### 2. Setup Backend

```bash
cd backend
npm install
```

Create a `.env` file:

```env
PORT=10000
JWT_SECRET=your-secret-key-here
MONGODB_URI=mongodb+srv://...  # Optional — falls back to in-memory
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
APPLE_CLIENT_ID=...
APPLE_TEAM_ID=...
APPLE_KEY_ID=...
```

Start the server:

```bash
npm start
# or
npm run dev
```

### 3. Frontend (Static)

The frontend is pure static HTML/CSS/JS. Open `index.html` in a browser, or serve with any static server:

```bash
# Python 3
python -m http.server 8080

# Node.js
npx serve .
```

Visit: `http://localhost:8080`

---

## 📁 Project Structure

```
zetrixavatar/
├── index.html                    # Main academy landing page
├── academy-level1.html … level6.html  # Academy progression levels
├── course-*.html                 # 6 course pages (interactive)
├── css/
│   ├── styles.css                # Main styles
│   ├── course-engine.css         # Course-specific styles
│   └── znotes-style.css          # Notes/exam styling
├── js/
│   ├── course-engine.js          # Segmented learning engine
│   ├── auth.js                   # Authentication logic
│   ├── auth-guard.js             # Route protection
│   ├── academy.js                # Academy progress tracking
│   ├── tutor.js / tutor-v2.js    # AI tutor integration
│   ├── theme.js                  # Dark/light mode
│   └── ...                       # Other utilities
├── backend/
│   ├── server.js                 # Express entry point
│   ├── middleware/
│   │   └── auth.js               # JWT auth middleware
│   ├── config/
│   │   └── database.js           # MongoDB / in-memory layer
│   ├── routes/
│   │   ├── auth.js               # Login, register, me
│   │   ├── oauth.js              # Google & Apple OAuth
│   │   ├── users.js              # User management
│   │   ├── study.js              # Study plans & progress
│   │   ├── certificates.js       # Certificate generation
│   │   ├── materials.js          # Course materials
│   │   ├── workbooks.js          # Workbook data
│   │   ├── analytics.js          # Usage analytics
│   │   └── admin.js              # Admin dashboard
│   └── package.json
└── images/                       # SVG assets, mascot, backgrounds
```

---

## 🔑 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: `10000`) |
| `JWT_SECRET` | Yes | Secret for JWT token signing |
| `MONGODB_URI` | No | MongoDB connection string (falls back to in-memory) |
| `GOOGLE_CLIENT_ID` | No | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth client secret |
| `APPLE_CLIENT_ID` | No | Apple Sign-In client ID |
| `APPLE_TEAM_ID` | No | Apple Developer Team ID |
| `APPLE_KEY_ID` | No | Apple Private Key ID |

---

## 🔗 API Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/auth/register` | POST | No | Register new user |
| `/api/auth/login` | POST | No | Login with email/password |
| `/api/auth/me` | GET | Yes | Get current user |
| `/api/auth/logout` | POST | Yes | Logout & clear cookie |
| `/api/oauth/google` | GET | No | Google OAuth callback |
| `/api/oauth/apple` | GET | No | Apple Sign-In callback |
| `/api/study/academy-progress` | GET/POST | Yes | Academy progress |
| `/api/certificates/me` | GET | Yes | User certificates |
| `/api/certificates/issue` | POST | Yes | Issue certificate |
| `/api/health` | GET | No | Health check |

---

## 🛡️ Security Features

- JWT-based authentication with 7-day expiry
- HTTP-only cookies for token storage
- CORS enabled for cross-origin requests
- Rate limiting on auth endpoints
- Helmet.js for HTTP security headers
- Input validation on all routes

---

## 📝 License

This project is proprietary. All rights reserved.

---

## 🙋 Support

For issues or feature requests, please open a GitHub Issue or contact the maintainer.

---

*Built with ❤️ by the Zetrix Team*
