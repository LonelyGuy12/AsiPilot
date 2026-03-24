# FrontendForge

A browser-based IDE exclusively for frontend and web development, powered by ASI-1 Mini AI with multi-agent code review.

## Features

- **Monaco Code Editor** — Full VS Code editing experience in the browser
- **AI Inline Completions** — Context-aware code suggestions powered by ASI-1 Mini
- **Multi-Agent Code Review** — Security, Performance, Style, and Documentation agents
- **GitHub Integration** — Import repos, get reviews, generate PR-ready fixes
- **Live Preview** — Real-time HTML/CSS/JS preview with console output
- **Integrated Terminal** — Full terminal emulator via WebSocket

## Tech Stack

- **Client**: React 18, TypeScript, Vite, Tailwind CSS, Monaco Editor, Zustand
- **Server**: Node.js, Express, Socket.io, ASI-1 Mini API
- **Infrastructure**: Docker Compose, Redis

## Getting Started

```bash
# Install dependencies
npm install

# Copy environment config
cp .env.example .env
# Edit .env with your ASI1_API_KEY and GITHUB_TOKEN

# Start development (client only)
npm run dev

# Start everything (needs Redis)
npm run dev:all
```

## Project Structure

```
packages/
  shared/    — TypeScript types, constants, utilities
  server/    — Express API server + AI agents
  client/    — React IDE + landing page
```

## License

MIT
