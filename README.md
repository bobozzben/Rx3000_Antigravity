# Rx3000 - FoxPro to Modern Web Accounting System

Rx3000 is a modern full-stack web application designed to replace legacy FoxPro accounting systems. It features a mouse-free, high-speed keyboard interface (`FoxProGrid`) crafted specifically for warehouse staff.

## Technology Stack
- **Frontend**: React 19, TypeScript, Vite, AG Grid Community, Tailwind CSS, Zustand, Axios
- **Backend**: Node.js, Express, TypeScript, Prisma ORM
- **Database**: PostgreSQL 16 (Port 5432)
- **Dev Tools**: pnpm monorepo, concurrently, ngrok

## Quick Start Guide

### 1. Launch Database (PostgreSQL 16)
```bash
docker-compose up -d
```

### 2. Install Dependencies (If not already installed)
```bash
npm install -g pnpm@7.33.6
pnpm install
```

### 3. Database Migration & Seed
```bash
pnpm --filter backend exec prisma migrate dev --name init
pnpm --filter backend exec prisma db seed
```

### 4. Run Development Servers
```bash
pnpm dev
```
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3001`

### 5. Remote Access (ngrok)
```bash
pnpm ngrok
```

## FoxPro Keyboard Navigation Guide
- **Enter**: Next editable cell / next row / auto-append new row at end
- **Tab / Shift+Tab**: Move focus left / right
- **Up / Down Arrow**: Vertical line navigation
- **Direct Typing**: Immediate edit mode (no mouse click needed)
- **F2**: Toggle cell edit mode
- **F4**: Open Search Modal (Product / Vendor search)
- **F12**: Save purchase order
