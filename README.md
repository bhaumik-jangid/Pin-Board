# 📌 PinBoard — Collaborative Infinite Corkboard

A production-grade real-time collaborative sticky note board.  
Built with React 19, Node.js, MongoDB, Redis, Socket.IO, Docker, and Jenkins.

---

## Architecture

Browser → NGINX (port 80)
├── /api/auth/*    → auth-service:3001   (JWT, bcrypt)
├── /api/boards/*  → board-service:3002  (notes, boards)
├── /socket.io/*   → realtime-service:3003 (Socket.IO)
└── /*             → frontend:80 (React SPA)
MongoDB:   pinboard-auth  (users)
pinboard-board (boards, notes)
Redis:     pubsub + session store

## Tech Stack

| Layer      | Technology                        |
|------------|-----------------------------------|
| Frontend   | React 19, TypeScript, Vite, Tailwind |
| Animation  | Framer Motion                     |
| Drag       | react-rnd                         |
| State      | Zustand                           |
| Backend    | Node.js, Express, TypeScript      |
| Database   | MongoDB 7 (Mongoose)              |
| Cache      | Redis 7                           |
| Realtime   | Socket.IO 4                       |
| Auth       | JWT + bcryptjs                    |
| DevOps     | Docker, NGINX, Jenkins            |

## Quick Start (Development)

```bash
# 1. Clone and install
git clone <repo-url>
cd pinboard
npm install

# 2. Start infrastructure
docker-compose -f docker-compose.dev.yml up -d

# 3. Copy env file
cp .env.example .env
# Edit .env — set a strong JWT_SECRET

# 4. Start services (4 terminals)
cd services/auth-service    && npm run dev   # port 3001
cd services/board-service   && npm run dev   # port 3002
cd services/realtime-service && npm run dev  # port 3003
cd frontend                 && npm run dev   # port 5173
```

Open http://localhost:5173

## Production Deployment

```bash
# 1. Set environment variables
cp .env.example .env
# Fill in JWT_SECRET, REGISTRY, etc.

# 2. Build and start all containers
docker-compose up --build -d

# 3. Check all services are healthy
docker-compose ps

# 4. Open http://localhost
```

## Jenkins CI/CD Setup

```bash
# 1. Start Jenkins
docker-compose -f docker-compose.jenkins.yml up -d

# 2. Open http://localhost:8080

# 3. Install plugins:
#    - Docker Pipeline
#    - Git
#    - Credentials Binding

# 4. Add credentials:
#    ID: dockerhub-creds  → Docker Hub username/password
#    ID: dockerhub-username → Docker Hub username (string)

# 5. Create Pipeline job → point to this repo's Jenkinsfile
```

## Microservices

| Service          | Port | Responsibility                    |
|-----------------|------|-----------------------------------|
| auth-service    | 3001 | Registration, login, JWT          |
| board-service   | 3002 | Boards, notes, CRUD, search       |
| realtime-service| 3003 | Socket.IO, presence, live sync    |
| NGINX           | 80   | Reverse proxy, SSL termination    |
| MongoDB         | 27017| Data persistence                  |
| Redis           | 6379 | PubSub, sessions                  |

## Docker Images

| Image                         | Source      |
|-------------------------------|-------------|
| nginx:1.27-alpine             | Docker Hub  |
| mongo:7                       | Docker Hub  |
| redis:7-alpine                | Docker Hub  |
| jenkins/jenkins:lts-jdk17     | Docker Hub  |
| pinboard/frontend             | Custom build|
| pinboard/auth-service         | Custom build|
| pinboard/board-service        | Custom build|
| pinboard/realtime-service     | Custom build|

## Features

- 📌 Interactive sticky notes — drag, resize, 5 types, 6 colors
- 🔒 4 corner pins — remove all to unlock board panning
- 🔄 Real-time collaboration via Socket.IO
- 🗺️ Infinite canvas with smooth pan/zoom
- 🔔 Reminder system with browser notifications
- 🔍 Full-text search with type/color filters
- 📋 Templates — brainstorm, sprint, study, retro
- 🗂️ Archive — restore deleted notes
- 👥 Live presence — collaborator avatars + cursors
EOF