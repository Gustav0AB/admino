# Admino — Frontend

React Native + Expo app for the Admino platform. Supports web, iOS, and Android from a single codebase.

---

## Prerequisites

- Node.js (v20+)
- npm
- For iOS: Xcode + iOS Simulator
- For Android: Android Studio + Emulator
- For web: just a browser

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment

```bash
cp .env.example .env
```

By default the app runs in **mock mode** — no backend required. See [Environment Variables](#environment-variables) to switch to a live backend.

### 3. Run the app

```bash
npm start          # Interactive menu — choose platform
npm run web        # Web (localhost:8081)
npm run ios        # iOS Simulator
npm run android    # Android Emulator
```

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | `http://localhost:3000` | Backend API base URL |
| `EXPO_PUBLIC_API_MODE` | `MOCK` | `MOCK` or `LIVE` — explicit mode override |
| `EXPO_PUBLIC_USE_MOCK` | `true` | Fallback toggle if `API_MODE` is not set |
| `EXPO_PUBLIC_VERSION` | `1.0.0` | App version string |

**Resolution order:**
1. `EXPO_PUBLIC_API_MODE=LIVE` → always live
2. `EXPO_PUBLIC_API_MODE=MOCK` → always mock
3. `EXPO_PUBLIC_USE_MOCK=false` → live
4. Default → mock

### Switching to the dev backend

```env
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_API_MODE=LIVE
EXPO_PUBLIC_USE_MOCK=false
```

> The backend must be running. See `admino-api/` for setup instructions.

---

## Mock Accounts

When running in mock mode, use these credentials on the sign-in screen:

| Role | Email | Password | Access |
|---|---|---|---|
| System Admin | `admin@admino.app` | `password` | All screens including Admin panel |
| Coach (Org Owner) | `coach@admino.app` | `password` | Org-level screens |
| Athlete (Client) | `athlete@admino.app` | `password` | Client-level screens |

> **Note:** In mock mode any password is accepted — only the email is validated to determine the role.

### Mock data included

- **5 athletes:** John, Maria, Carlos, Sara, Luca (all under `org-demo-1`)
- **4 training plans:** Base Endurance, Strength Phase I, Sprint Development, Off-Season Recovery
- **Organization branding:** Demo Athletics (primary color `#2563EB`)

---

## Project Structure

```
admino/
├── app/                        # Expo Router — file-based routing
│   ├── _layout.tsx             # Root layout (providers, splash, fonts)
│   ├── index.tsx               # Entry point (auth redirect)
│   ├── (auth)/
│   │   └── sign-in.tsx         # Login screen
│   └── (drawer)/               # Authenticated area (drawer navigation)
│       ├── index.tsx           # Dashboard / component showcase
│       ├── planning.tsx        # Training planning
│       ├── expenses.tsx        # Expense tracking
│       ├── admin.tsx           # System admin panel (SYSTEM_ADMIN only)
│       └── layout-example.tsx  # Layout reference
│
└── src/
    ├── features/               # Self-contained feature modules
    │   ├── expenses/           # Expense tracking (full: API, store, components, screens)
    │   ├── auth/               # Auth (in progress)
    │   └── planning/           # Planning (in progress)
    │
    └── shared/
        ├── api/
        │   ├── apiService.ts   # Mock ↔ Live request switcher
        │   ├── client.ts       # HTTP client with auth headers
        │   ├── useApiQuery.ts  # React Query wrapper
        │   └── mocks/          # Mock data (athletes, plans, login, branding)
        ├── services/
        │   └── authService.ts  # Login — handles mock and real auth
        ├── store/              # Zustand stores (auth, org, sidebar, theme)
        ├── hooks/              # useAuth, useColors, useNetworkStatus, etc.
        ├── components/         # 40+ shared UI components
        ├── theme/              # Design tokens, colors, typography, breakpoints
        ├── config/
        │   └── env.ts          # ENV resolution logic
        ├── types/              # Shared TypeScript types (auth, api, org)
        ├── i18n/               # i18next setup — English locale
        └── utils/              # date, storage, logger helpers
```

### Feature module structure

Each feature under `src/features/` follows this pattern:

```
features/<name>/
├── api.ts          # API calls (mock & real)
├── store.ts        # Zustand slice
├── types.ts        # Feature-specific types
├── helpers.ts      # Utility functions
├── components/     # UI components
└── screens/        # Screen-level components
```

---

## Navigation

The app uses Expo Router with two layout groups:

- `(auth)` — unauthenticated routes (`/sign-in`)
- `(drawer)` — authenticated routes behind a drawer navigator

**Responsive sidebar behavior:**
- **Desktop (≥1020px):** permanent sidebar, collapsible (220px expanded / 60px collapsed)
- **Mobile/Tablet (<1020px):** slide-in drawer

**Role-based access:** the Admin screen is gated by `<RoleGuard role="SYSTEM_ADMIN" />` — other roles see a fallback.

---

## Tech Stack

| Concern | Library |
|---|---|
| Framework | React Native 0.81 + Expo 54 |
| Navigation | Expo Router + React Navigation Drawer |
| State | Zustand 5 |
| Data fetching | TanStack React Query 5 |
| Storage | AsyncStorage + Expo SecureStore |
| i18n | i18next |
| Fonts | Instrument Sans, Inter (Google Fonts) |

---

## Scripts

| Command | Description |
|---|---|
| `npm start` | Start Expo dev server (interactive) |
| `npm run web` | Web on `localhost:8081` |
| `npm run ios` | iOS Simulator |
| `npm run android` | Android Emulator |
| `npm run lint` | ESLint |
| `npm run type-check` | TypeScript check (no emit) |

---

## Path Aliases

Configured in `babel.config.js` and `tsconfig.json`:

| Alias | Resolves to |
|---|---|
| `@/*` | `src/*` |
| `@shared/*` | `src/shared/*` |
| `@features/*` | `src/features/*` |
