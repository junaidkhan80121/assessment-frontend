# ELD Trip Planner - Frontend

This is the frontend for the FMCSA-compliant ELD Trip Planner application, built with React, Vite, Tailwind CSS, Mapbox/Leaflet, and Redux Toolkit.

## Prerequisites

- Node.js (v18+ recommended)
- npm or yarn
- Backend running locally (for API access)

## Tech Stack

- **Framework**: React 19 + TypeScript
- **Bundler**: Vite
- **Styling**: Tailwind CSS + CSS Variables (Dark/Light Mode)
- **State Management**: Redux Toolkit (RTK Query for API calls)
- **Forms & Validation**: React Hook Form + Zod
- **Animations**: Framer Motion + GSAP
- **Map**: React Leaflet (OpenStreetMap via CartoDB tiles)
- **Icons**: Lucide React
- **PDF Export**: jsPDF

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file (copy from `.env.example`) and configure the API URL:
   ```bash
   cp .env.example .env
   # Ensure VITE_API_URL is set correctly (e.g., /api for local dev proxy)
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## Production Build

To build the project for production:
```bash
npm run build
```
This will compile TypeScript and bundle the app into the `dist/` directory using Vite.

## Design System

The app features a comprehensive design system with CSS variables located in `src/index.css` and extended in `tailwind.config.ts`. It supports both Light and Dark modes (`next-themes`) and includes custom keyframe animations for UI elements (like the Map marker pulse and UI shimmer effects).
