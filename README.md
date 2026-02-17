<p align="center">
  <h1 align="center">DineView</h1>
  <p align="center">QR-Based Restaurant Ordering Web App with AR Menu Viewing</p>
</p>

<p align="center">
  <a href="#"><img src="https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen?logo=node.js" alt="Node.js" /></a>
  <a href="#"><img src="https://img.shields.io/badge/pnpm-9.15.0-F69220?logo=pnpm" alt="pnpm" /></a>
  <a href="#"><img src="https://img.shields.io/badge/turborepo-2.3-EF4444?logo=turborepo" alt="Turborepo" /></a>
  <a href="#"><img src="https://img.shields.io/badge/Next.js-15-000000?logo=next.js" alt="Next.js" /></a>
  <a href="#"><img src="https://img.shields.io/badge/Express-4.x-000000?logo=express" alt="Express" /></a>
  <a href="#"><img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL" /></a>
  <a href="#"><img src="https://img.shields.io/badge/Redis-7-DC382D?logo=redis&logoColor=white" alt="Redis" /></a>
  <a href="#"><img src="https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma" alt="Prisma" /></a>
  <a href="#"><img src="https://img.shields.io/badge/WebXR-AR-ff69b4?logo=webxr" alt="WebXR" /></a>
  <a href="#"><img src="https://img.shields.io/badge/license-MIT-blue" alt="License" /></a>
</p>

---

**DineView** is a full-stack, multi-tenant SaaS platform that transforms the restaurant dining experience. Customers scan a QR code at their table to browse the menu, preview dishes in augmented reality, and place orders -- all from their phone. Kitchen staff see orders in real time on a dedicated Kitchen Display System, while restaurant owners manage everything through a comprehensive admin panel.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [AR Integration](#ar-integration)
- [WebSocket Events](#websocket-events)
- [Environment Variables](#environment-variables)
- [Seed Data](#seed-data)
- [License](#license)

---

## Overview

DineView replaces paper menus and manual order-taking with a seamless digital workflow:

1. **Scan** -- A customer scans the QR code on their table.
2. **Browse** -- The full restaurant menu loads instantly (Redis-cached, 5-min TTL), complete with photos, allergen info, and nutrition details.
3. **Preview in AR** -- On supported devices, customers can see a 3D model of a dish on their table via WebXR. Non-AR devices get an interactive 3D viewer as a fallback.
4. **Order** -- Items are added to a cart and submitted in a single tap.
5. **Track** -- Real-time order status updates are pushed over WebSocket (Placed -> Accepted -> Preparing -> Ready -> Served -> Paid).
6. **Manage** -- Restaurant staff use the admin panel for menu management, order tracking (kanban board), analytics, and more.

---

## Features

### Customer-Facing
- QR code scan-to-order flow (no app install required)
- Mobile-first responsive menu with category navigation
- Dish detail pages with photos, allergens, and nutrition info
- AR dish preview via WebXR (Android) with fallback 3D viewer (iOS / desktop)
- Cart management and one-tap order placement
- Real-time order status tracking via WebSocket

### Kitchen & Staff
- Kitchen Display System (KDS) with real-time order queue
- Order status management (Placed -> Accepted -> Preparing -> Ready -> Served)
- Waiter notification system via WebSocket rooms
- Role-based access control (5 roles with granular permissions)

### Admin Panel
- Dashboard with key metrics and revenue analytics
- Menu CRUD: categories, dishes, pricing, photos, 3D assets
- Order management with kanban board view
- Table and QR code management (generate, regenerate, download)
- Staff management (invite, assign roles)
- Restaurant settings and configuration
- Analytics: revenue trends, top dishes, order statistics

### Platform
- Multi-tenant SaaS architecture with tenant isolation
- 14 EU allergen tracking (Regulation 1169/2011)
- Subscription tiers: Free, Starter, Professional, Enterprise
- Rate limiting on auth and QR scan endpoints
- Redis-cached public menu (5-minute TTL)
- S3-compatible asset storage via MinIO (presigned upload URLs)

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Monorepo** | pnpm 9 workspaces + Turborepo 2 |
| **Frontend** | Next.js 15 (App Router), React 19, TypeScript 5 |
| **State Management** | Redux Toolkit + RTK Query |
| **Styling** | Tailwind CSS 3, Lucide Icons, clsx + tailwind-merge |
| **AR / 3D** | Three.js 0.170, @react-three/fiber, @react-three/drei, WebXR Device API |
| **Backend** | Express 4, TypeScript, Pino logger |
| **ORM** | Prisma 6 |
| **Database** | PostgreSQL 16 (Alpine) |
| **Cache** | Redis 7 (Alpine) |
| **Object Storage** | MinIO (S3-compatible) |
| **Real-time** | Socket.IO 4 (typed server/client events) |
| **Validation** | Zod (shared between frontend and backend) |
| **Auth** | JWT (access + refresh tokens) + session tokens for customers |
| **Infrastructure** | Docker Compose |

---

## Architecture

```
                         +-----------+
                         |  Browser  |
                         +-----+-----+
                               |
                    +----------+----------+
                    |                     |
              +-----+------+     +-------+--------+
              | Next.js 15 |     | Socket.IO WS   |
              | (port 3000)|     | (port 4000/ws)  |
              +-----+------+     +-------+--------+
                    |                     |
                    +----------+----------+
                               |
                         +-----+-----+
                         | Express   |
                         | API :4000 |
                         +-----+-----+
                               |
              +----------------+----------------+
              |                |                |
        +-----+-----+   +-----+-----+   +-----+-----+
        | PostgreSQL |   |   Redis   |   |   MinIO   |
        |   :5433    |   |   :6379   |   | :9000/:9001|
        +-----+-----+   +-----------+   +-----------+
              |
        +-----+-----+
        |  Prisma   |
        |   ORM     |
        +-----------+
```

### Request Flow

**Customer ordering:**
```
QR Scan -> GET /api/scan/:token -> Session token issued
        -> GET /api/menu (Redis cache) -> Browse menu
        -> POST /api/orders -> Order created -> WebSocket broadcast to kitchen
        -> Kitchen updates status -> WebSocket broadcast to customer table
```

**Admin operations:**
```
POST /api/auth/login -> JWT issued (access + refresh)
     -> All /api/admin/* routes require JWT + tenant context + RBAC permission check
```

---

## Getting Started

### Prerequisites

| Tool | Version |
|---|---|
| Node.js | >= 20.0.0 |
| pnpm | 9.15.0 |
| Docker & Docker Compose | Latest stable |

### Installation

```bash
# 1. Clone the repository
git clone <repository-url>
cd dineview

# 2. Install dependencies
pnpm install

# 3. Start infrastructure services (PostgreSQL, Redis, MinIO)
docker compose -f docker/docker-compose.yml up -d
```

> **Note:** The Docker Compose file maps PostgreSQL to port **5433** on the host to avoid conflicts with any local PostgreSQL instance running on the default port 5432.

```bash
# 4. Set up environment variables
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env if needed (defaults work with Docker Compose)

# 5. Run database migrations and seed data
cd apps/api
npx prisma migrate dev
npx prisma db seed
cd ../..

# 6. Start the development servers
pnpm dev
```

This starts both services concurrently via Turborepo:

| Service | URL |
|---|---|
| **API server** | http://localhost:4000 |
| **Web app** | http://localhost:3000 |
| **MinIO Console** | http://localhost:9001 |
| **Prisma Studio** | Run `pnpm db:studio` -> http://localhost:5555 |

### Available Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start all apps in development mode |
| `pnpm build` | Build all packages and apps |
| `pnpm lint` | Lint all packages and apps |
| `pnpm db:migrate` | Run Prisma migrations |
| `pnpm db:seed` | Seed the database |
| `pnpm db:studio` | Open Prisma Studio |
| `pnpm clean` | Remove all build artifacts and node_modules |

---

## Project Structure

```
dineview/
├── apps/
│   ├── api/                          # Express.js backend
│   │   ├── prisma/
│   │   │   ├── schema.prisma         # Database schema (13 models, 7 enums)
│   │   │   └── seed.ts               # Seed data script
│   │   └── src/
│   │       ├── config/               # Database, Redis, S3, logger config
│   │       ├── middleware/            # Auth, RBAC, tenant, validation, rate limiting
│   │       ├── modules/              # Feature modules (13 total)
│   │       │   ├── analytics/        # Dashboard stats, revenue, top dishes
│   │       │   ├── asset/            # S3 presigned uploads, AR asset management
│   │       │   ├── auth/             # JWT login, refresh, logout, me
│   │       │   ├── category/         # Menu category CRUD + reorder
│   │       │   ├── dish/             # Dish CRUD + availability toggle
│   │       │   ├── health/           # Health check (DB + Redis)
│   │       │   ├── menu/             # Public menu (Redis-cached)
│   │       │   ├── order/            # Customer + admin order management
│   │       │   ├── qr/               # QR code generation + regeneration
│   │       │   ├── restaurant/       # Restaurant settings
│   │       │   ├── session/          # QR scan -> session token
│   │       │   ├── staff/            # Staff CRUD
│   │       │   └── table/            # Table CRUD
│   │       ├── routes/               # Route aggregation
│   │       ├── utils/                # Shared utilities
│   │       ├── websocket/            # Socket.IO setup + handlers
│   │       │   └── handlers/         # Order, notification, session handlers
│   │       ├── app.ts                # Express app setup
│   │       └── server.ts             # HTTP + WebSocket server entry
│   │
│   └── web/                          # Next.js 15 frontend
│       └── src/app/
│           ├── (admin)/admin/        # Admin panel routes
│           │   ├── analytics/        # Revenue charts, top dishes
│           │   ├── categories/       # Category management
│           │   ├── dashboard/        # Overview dashboard
│           │   ├── kitchen/          # Kitchen Display System (KDS)
│           │   ├── login/            # Admin login
│           │   ├── menu/             # Dish management (list, create, edit)
│           │   ├── orders/           # Order kanban board
│           │   ├── settings/         # Restaurant settings
│           │   ├── staff/            # Staff management
│           │   └── tables/           # Table + QR management
│           └── (customer)/           # Customer-facing routes
│               ├── actions/          # Post-order actions
│               ├── cart/             # Shopping cart
│               ├── dish/[id]/        # Dish detail
│               │   └── ar/           # AR / 3D dish preview
│               ├── menu/             # Menu browsing
│               ├── orders/           # Order tracking
│               └── scan/[token]/     # QR code landing
│
├── packages/
│   └── shared/                       # Shared package (@dineview/shared)
│       └── src/
│           ├── constants/            # Roles, allergens, order states, permissions
│           ├── types/                # TypeScript interfaces and types
│           ├── utils/                # Shared utility functions
│           └── validators/           # Zod schemas (auth, menu, order, table, etc.)
│
├── docker/
│   └── docker-compose.yml            # PostgreSQL 16, Redis 7, MinIO
│
├── turbo.json                        # Turborepo pipeline config
├── pnpm-workspace.yaml               # pnpm workspace definition
├── tsconfig.base.json                # Shared TypeScript config
└── package.json                      # Root scripts and dev dependencies
```

---

## API Endpoints

All endpoints are prefixed with `/api`.

### Public / Customer

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/health` | Health check (DB + Redis status) | None |
| `GET` | `/scan/:qrToken` | Scan QR code, get session token | Rate limited |
| `GET` | `/menu` | Get full menu (Redis-cached) | Optional session |
| `GET` | `/menu/categories/:slug` | Get category by slug | Optional session |
| `GET` | `/menu/dishes/:dishId` | Get dish detail | Optional session |
| `POST` | `/orders` | Place an order | Session |
| `GET` | `/orders/my` | Get orders for current session | Session |

### Authentication

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/auth/login` | Login with email/password | Rate limited |
| `POST` | `/auth/refresh` | Refresh access token | Refresh token |
| `POST` | `/auth/logout` | Logout (revoke tokens) | JWT |
| `GET` | `/auth/me` | Get current user profile | JWT |

### Admin -- Tables & QR

| Method | Endpoint | Description | Permission |
|---|---|---|---|
| `GET` | `/admin/tables` | List all tables | `table:read` |
| `POST` | `/admin/tables` | Create a table | `table:write` |
| `GET` | `/admin/tables/:id` | Get table by ID | `table:read` |
| `PATCH` | `/admin/tables/:id` | Update table | `table:write` |
| `DELETE` | `/admin/tables/:id` | Delete table | `table:write` |
| `POST` | `/admin/qr/tables/:tableId/generate` | Generate QR code | `qr:write` |
| `GET` | `/admin/qr/tables/:tableId` | Get QR code for table | `qr:read` |
| `POST` | `/admin/qr/tables/:tableId/regenerate` | Regenerate QR code | `qr:write` |

### Admin -- Menu Management

| Method | Endpoint | Description | Permission |
|---|---|---|---|
| `GET` | `/admin/categories` | List all categories | `category:read` |
| `POST` | `/admin/categories` | Create category | `category:write` |
| `PATCH` | `/admin/categories/reorder` | Reorder categories | `category:write` |
| `GET` | `/admin/categories/:id` | Get category by ID | `category:read` |
| `PATCH` | `/admin/categories/:id` | Update category | `category:write` |
| `DELETE` | `/admin/categories/:id` | Delete category | `category:write` |
| `GET` | `/admin/dishes` | List all dishes | `dish:read` |
| `POST` | `/admin/dishes` | Create dish | `dish:write` |
| `GET` | `/admin/dishes/:id` | Get dish by ID | `dish:read` |
| `PATCH` | `/admin/dishes/:id` | Update dish | `dish:write` |
| `DELETE` | `/admin/dishes/:id` | Delete dish | `dish:write` |
| `PATCH` | `/admin/dishes/:id/availability` | Toggle dish availability | `dish:toggle_availability` |

### Admin -- Orders

| Method | Endpoint | Description | Permission |
|---|---|---|---|
| `GET` | `/admin/orders` | List all orders | `order:read` (via `/orders/admin`) |
| `GET` | `/admin/orders/:orderId` | Get order detail | `order:read` |
| `PATCH` | `/admin/orders/:orderId/status` | Update order status | `order:update_status` |

### Admin -- Assets, Analytics, Restaurant, Staff

| Method | Endpoint | Description | Permission |
|---|---|---|---|
| `POST` | `/admin/assets/upload` | Get presigned upload URL | `asset:write` |
| `PUT` | `/admin/assets/:id` | Update AR asset metadata | `asset:write` |
| `POST` | `/admin/assets/:id/link/:dishId` | Link asset to dish | `asset:write` |
| `GET` | `/admin/assets/:id` | Get asset by ID | `asset:read` |
| `GET` | `/admin/analytics/dashboard` | Dashboard metrics | `analytics:read` |
| `GET` | `/admin/analytics/revenue` | Revenue analytics | `analytics:read` |
| `GET` | `/admin/analytics/top-dishes` | Top-selling dishes | `analytics:read` |
| `GET` | `/admin/restaurant` | Get restaurant settings | `restaurant:read` |
| `PATCH` | `/admin/restaurant` | Update restaurant settings | `restaurant:write` |
| `GET` | `/admin/staff` | List all staff | `staff:read` |
| `POST` | `/admin/staff` | Create staff member | `staff:write` |
| `GET` | `/admin/staff/:id` | Get staff member | `staff:read` |
| `DELETE` | `/admin/staff/:id` | Remove staff member | `staff:write` |

---

## AR Integration

DineView uses a progressive approach to 3D dish visualization:

### WebXR (Android Chrome)
On supported devices, the app uses the **WebXR Device API** to render 3D dish models directly on the customer's table surface via their phone camera. The implementation uses:
- **Three.js** for 3D rendering
- **@react-three/fiber** as the React renderer for Three.js
- **@react-three/drei** for helper components (environment, controls, loaders)

### Fallback 3D Viewer (iOS / Desktop)
On devices without WebXR support, dishes are displayed in an interactive 3D viewer with:
- Orbit controls (rotate, zoom, pan)
- Studio lighting and environment mapping
- Auto-rotation for idle presentation

### Asset Pipeline
1. Admin uploads a 3D model (GLB/GLTF) via the presigned URL endpoint
2. The file is stored in MinIO (S3-compatible)
3. The asset record is created and linked to a dish
4. Customers access the AR/3D view from the dish detail page at `/dish/:id/ar`

---

## WebSocket Events

DineView uses typed Socket.IO events for real-time communication. Clients join specific rooms based on their role:

| Room | Format | Audience |
|---|---|---|
| Restaurant | `restaurant:{restaurantId}` | All staff |
| Table | `restaurant:{restaurantId}:table:{tableId}` | Customers at a table |
| Kitchen | `restaurant:{restaurantId}:kitchen` | Kitchen staff (KDS) |
| Waiters | `restaurant:{restaurantId}:waiters` | Waiters |

### Key Events

| Event | Direction | Description |
|---|---|---|
| `join:restaurant` | Client -> Server | Join restaurant-wide updates |
| `join:table` | Client -> Server | Join table-specific updates |
| `join:kitchen` | Client -> Server | Join kitchen order feed |
| `join:waiters` | Client -> Server | Join waiter notifications |
| `order:new` | Server -> Client | New order placed |
| `order:statusUpdate` | Server -> Client | Order status changed |

---

## Environment Variables

### API (`apps/api/.env`)

| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://dineview:dineview_dev@localhost:5433/dineview` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `JWT_ACCESS_SECRET` | Secret for signing access tokens | -- |
| `JWT_REFRESH_SECRET` | Secret for signing refresh tokens | -- |
| `JWT_SESSION_SECRET` | Secret for signing customer session tokens | -- |
| `PORT` | API server port | `4000` |
| `NODE_ENV` | Environment | `development` |
| `CORS_ORIGIN` | Allowed CORS origin | `http://localhost:3000` |
| `S3_ENDPOINT` | MinIO/S3 endpoint | `http://localhost:9000` |
| `S3_ACCESS_KEY` | MinIO/S3 access key | -- |
| `S3_SECRET_KEY` | MinIO/S3 secret key | -- |
| `S3_BUCKET` | S3 bucket name | `dineview-assets` |
| `S3_REGION` | S3 region | `us-east-1` |

### Web (`apps/web`)

The Next.js app communicates with the API. Configure the API URL as needed:

| Variable | Description | Default |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `http://localhost:4000/api` |
| `NEXT_PUBLIC_WS_URL` | WebSocket server URL | `http://localhost:4000` |

---

## Seed Data

Running `npx prisma db seed` populates the database with a demo restaurant:

| Entity | Details |
|---|---|
| **Restaurant** | Bella Vista (Italian restaurant) |
| **Users** | 5 users across all roles |
| **Categories** | 4 menu categories |
| **Dishes** | 12 Italian dishes with photos, allergens, and nutrition |
| **Tables** | 6 tables with QR codes |

### Test Credentials

| Role | Email | Password |
|---|---|---|
| Owner | `owner@bellavista.com` | `password123` |

> Additional users with Manager, Kitchen Staff, and Waiter roles are also seeded. Check the seed file at `apps/api/prisma/seed.ts` for full details.

---

## Role-Based Access Control

DineView implements a hierarchical RBAC system with five roles:

| Role | Level | Capabilities |
|---|---|---|
| `SUPER_ADMIN` | 100 | Platform-wide access, manage all tenants |
| `OWNER` | 80 | Full restaurant management, staff management |
| `MANAGER` | 60 | Menu, orders, tables, analytics |
| `KITCHEN_STAFF` | 40 | View orders, update order status (KDS) |
| `WAITER` | 20 | View orders, mark as served |

Permissions are enforced at the middleware level using `requirePermission()` guards on every admin route.

---

## License

This project is licensed under the [MIT License](LICENSE).

---

<p align="center">
  Built with Express.js, Next.js, Prisma, and Three.js
</p>
