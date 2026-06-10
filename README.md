# Todo-App

A modern, lightweight task management application built with Vue 3, designed to help you organise and track your daily tasks with ease.

**This is the frontend SPA.** It connects to the [Todo-App-Backend](https://github.com/JGH0/Todo-App-Backend) REST API for user accounts, data persistence, themes, and the AI assistant.

## About

Todo-App aims to provide a clean and intuitive interface for managing your to-do lists. It supports categorising tasks, setting dates and times, and toggling reminders and sync options — all within a responsive layout that works on desktop and mobile.

## Features

- **Add tasks** with a title, date, and time
- **Categorise tasks** using customisable category chips
- **Sync, Reminder, and Repeat** toggles per task
- **Sidebar navigation** with favourites and quick filters
- **AI assistant** integration (Ask AI)
- **Theme browser** — download and install community themes
- **Responsive design** — adapts to mobile screens

## Tech Stack

- [Vue 3](https://vuejs.org/) — progressive JavaScript framework
- [Pinia](https://pinia.vuejs.org/) — state management
- [Vue Router](https://router.vuejs.org/) — client-side routing
- [Vite](https://vitejs.dev/) — fast development build tool

---

## Self-Hosting with Docker (Recommended)

The entire stack (frontend + backend + database) runs via Docker Compose.
All setup is in the [Todo-App-Backend](https://github.com/JGH0/Todo-App-Backend) repository.

### Quick Start

```bash
# 1. Clone the backend repo (includes all Docker config)
git clone https://github.com/JGH0/Todo-App-Backend.git
cd Todo-App-Backend

# 2. Start the full stack
docker compose up -d

# 3. Open the app
#    Frontend: http://localhost:3000
#    Backend:  http://localhost:8080
```

### What Gets Deployed

| Service | Image | Purpose |
|---------|-------|---------|
| `todo-frontend` | Built from `docker/frontend/Dockerfile` | Nginx serving the Vue SPA, proxies `/api/` to backend |
| `todo-backend` | Built from `docker/backend/Dockerfile` | PHP 8.2 + Apache running the CodeIgniter REST API |
| `todo-db` | `mariadb:11` | MariaDB database |

### How the Frontend Container Works

At **container start**, the frontend:
1. Clones the latest code from `https://github.com/JGH0/Todo-App.git`
2. Installs npm dependencies and builds the SPA
3. Starts nginx on port 80 (mapped to host port 3000)

Every restart pulls fresh code — no image rebuild required.

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `FRONTEND_REPO` | `https://github.com/JGH0/Todo-App.git` | Git repo to clone at startup |
| `VITE_API_BASE_URL` | `/api/v1` | Backend API path (proxied through nginx) |

---

## Standalone Development (without Docker)

### Prerequisites

- Node.js `^20.19.0` or `>=22.12.0`

### Installation

```bash
npm install
```

### Run with JSON Server (Mock Backend)

```bash
mv db.sample.json db.json
npm run server
```

### Development

```bash
npm run dev
```

### Production Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

### Connect to a Real Backend

To connect to the Todo-App-Backend API, set the API URL in the app's settings
or configure it via the `VITE_API_BASE_URL` environment variable at build time.

---

## Docker Compose (for local development with rebuild)

If you want to rebuild the frontend image from source instead of cloning at runtime:

```yaml
# Example override — run from Todo-App-Backend project root
version: "3"
services:
  frontend:
    build:
      context: ./frontend  # Path to this repo
      dockerfile: Dockerfile
```

---

## Portainer Deployment

The stack is fully compatible with [Portainer](https://www.portainer.io/).

1. Add the [Todo-App-Backend](https://github.com/JGH0/Todo-App-Backend) repo as a stack
2. Deploy — Portainer builds and starts all three services
3. To update the frontend: restart the `todo-frontend` container
   (it clones fresh code at every startup)

---

## Authors

Made by [JGH0](https://www.github.com/JGH0), [Cametendo](https://www.github.com/Cametendo) and [yanisdjerrah](https://www.github.com/yanisdjerrah)

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
