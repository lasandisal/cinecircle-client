# CineCircle Client (`cinecircle-fe`)

Frontend single-page application for **CineCircle** — A Social Watch-Decision Platform for TV & Film.

## Tech Stack
- **Framework**: React 19 + TypeScript (Vite)
- **Styling**: Tailwind CSS
- **State Management**: Redux Toolkit & React-Redux
- **Routing**: React Router (`react-router-dom`)
- **Real-Time**: Socket.io-client
- **HTTP Client**: Axios
- **Icons**: Lucide React

## Project Structure
```text
src/
├── assets/        # Static assets
├── components/    # Common and layout UI components
├── hooks/         # Custom hooks and typed Redux hooks
├── pages/         # Views (Home, Solo, Group, Detail, Watchlist, Profile, Auth)
├── routes/        # App routing definitions
├── services/      # Axios API client and Socket.io service
├── store/         # Redux store and feature slices
├── types/         # TypeScript type definitions
├── App.tsx        # Application root with Provider & Router
├── index.css      # Tailwind CSS styling and theme
└── main.tsx       # Vite entry point
```

## Setup & Running
1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure environment:
   ```bash
   cp .env.example .env
   ```
3. Run development server:
   ```bash
   npm run dev
   ```
4. Build for production:
   ```bash
   npm run build
   ```
