<div align="center">

# 🧠 CoachGenie — Phase 1

**An AI-powered coaching and mentoring platform**

[![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?style=flat&logo=python&logoColor=white)](https://www.python.org/)
[![React](https://img.shields.io/badge/React-18%2B-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![Next.js](https://img.shields.io/badge/Next.js-14%2B-000000?style=flat&logo=next.js&logoColor=white)](https://nextjs.org/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat)](CONTRIBUTING.md)

> CoachGenie uses AI to deliver personalized coaching and mentoring experiences — helping users set goals, track progress, and get intelligent guidance on demand.

</div>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [Contributing](#-contributing)
- [Roadmap](#-roadmap)
- [License](#-license)

---

## 🌟 Overview

CoachGenie Phase 1 is the foundational release of an intelligent coaching platform. It combines a **Next.js** frontend with a **Python** backend to provide users with AI-driven mentoring sessions, goal tracking, and personalized feedback.

This phase focuses on:
- Core AI coaching conversation flow
- User authentication and profile management
- Session history and progress tracking
- REST API for seamless frontend–backend communication

---

## ✨ Features

- 🤖 **AI-Powered Coaching** — Conversational AI that understands user goals and provides actionable guidance
- 👤 **User Profiles** — Personalized dashboards with coaching history and progress metrics
- 🎯 **Goal Tracking** — Set, monitor, and update short-term and long-term goals
- 💬 **Session Management** — Start, pause, and resume coaching sessions
- 📊 **Progress Insights** — Visual progress reports generated from session data
- 🔐 **Secure Auth** — JWT-based authentication with protected routes

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Next.js 14 (App Router) |
| **Styling** | Tailwind CSS |
| **Backend** | Python 3.10+, Django / Flask |
| **AI Integration** | OpenAI API / Anthropic Claude API |
| **Database** | PostgreSQL |
| **Auth** | JWT (JSON Web Tokens) |
| **API** | RESTful JSON API |
| **Deployment** | Vercel (frontend), Railway / Render (backend) |

---

## 📁 Project Structure

```
Coachgenie_Phase1/
├── frontend/                   # Next.js application
│   ├── app/                    # App Router pages & layouts
│   │   ├── (auth)/             # Login / Signup pages
│   │   ├── dashboard/          # User dashboard
│   │   ├── session/            # Coaching session UI
│   │   └── layout.tsx          # Root layout
│   ├── components/             # Reusable UI components
│   ├── lib/                    # API clients, utilities
│   ├── public/                 # Static assets
│   └── next.config.js
│
├── backend/                    # Python API server
│   ├── app/                    # Core application
│   │   ├── models/             # Database models
│   │   ├── routes/             # API route handlers
│   │   ├── services/           # Business logic & AI integration
│   │   └── utils/              # Helpers & middleware
│   ├── migrations/             # Database migrations
│   ├── tests/                  # Unit & integration tests
│   ├── requirements.txt
│   └── manage.py / app.py
│
├── .env.example                # Environment variable template
├── docker-compose.yml          # Local dev environment
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:

- **Node.js** >= 18.x and **npm** / **yarn**
- **Python** >= 3.10 and **pip**
- **PostgreSQL** >= 14
- **Git**

```bash
# Verify versions
node -v
python --version
psql --version
```

---

### Backend Setup

```bash
# 1. Clone the repository
git clone https://github.com/amanbendkule2001/Coachgenie_Phase1.git
cd Coachgenie_Phase1/backend

# 2. Create and activate a virtual environment
python -m venv venv
source venv/bin/activate        # On Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Copy environment variables
cp ../.env.example .env
# Edit .env with your database credentials and API keys

# 5. Apply database migrations
python manage.py migrate        # Django
# or
flask db upgrade                # Flask

# 6. Start the development server
python manage.py runserver      # Django  → http://localhost:8000
# or
flask run                       # Flask   → http://localhost:5000
```

---

### Frontend Setup

```bash
# 1. Navigate to the frontend directory
cd ../frontend

# 2. Install dependencies
npm install
# or
yarn install

# 3. Copy environment variables
cp ../.env.example .env.local
# Set NEXT_PUBLIC_API_URL to your backend URL

# 4. Start the development server
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔧 Environment Variables

Create a `.env` file in the backend directory and a `.env.local` file in the frontend directory based on `.env.example`:

```env
# ── Backend ────────────────────────────────────
DATABASE_URL=postgresql://user:password@localhost:5432/coachgenie
SECRET_KEY=your-django-or-flask-secret-key
DEBUG=True

# AI Provider (choose one)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# JWT
JWT_SECRET=your-jwt-secret
JWT_EXPIRY=3600

# ── Frontend ───────────────────────────────────
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_APP_NAME=CoachGenie
```

> ⚠️ **Never commit `.env` files** — they are listed in `.gitignore`.

---

## 📡 API Reference

Base URL: `http://localhost:8000/api/v1`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/register` | Register a new user |
| `POST` | `/auth/login` | Authenticate and receive JWT |
| `GET` | `/users/me` | Get current user profile |
| `GET` | `/sessions` | List all coaching sessions |
| `POST` | `/sessions` | Start a new coaching session |
| `POST` | `/sessions/:id/message` | Send a message in a session |
| `GET` | `/goals` | List user goals |
| `POST` | `/goals` | Create a new goal |
| `PATCH` | `/goals/:id` | Update goal progress |

All protected routes require the `Authorization: Bearer <token>` header.

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

```bash
# 1. Fork the repository
# 2. Create your feature branch
git checkout -b feature/your-feature-name

# 3. Commit your changes (use conventional commits)
git commit -m "feat: add goal milestone notifications"

# 4. Push to your branch
git push origin feature/your-feature-name

# 5. Open a Pull Request against main
```

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines on code style, branch naming, and PR requirements.

---

## 🗺 Roadmap

**Phase 1 (Current)**
- [x] Core AI coaching conversation
- [x] User auth and profile management
- [x] Session history
- [x] Goal creation and tracking

**Phase 2 (Planned)**
- [ ] Real-time coaching via WebSockets
- [ ] Multi-modal input (voice, file upload)
- [ ] Coach marketplace (human + AI coaches)
- [ ] Mobile app (React Native)
- [ ] Analytics dashboard for coaches

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

Built with ❤️ by [Aman Bendkule](https://github.com/amanbendkule2001) and contributors.

⭐ **Star this repo** if you find it useful!

</div>
