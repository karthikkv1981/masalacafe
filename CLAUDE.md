# MasalaCafe — South Indian Catering Platform

## Project Overview

**MasalaCafe** is a full-stack web application for ordering South Indian catering by the tray. Users can browse a menu, customize items, build orders for events (10–500 guests), and submit catering requests. The platform handles the complete ordering workflow from menu browsing through checkout and confirmation.

### Key Features

- **Menu Browsing**: Search and filter dishes across categories (breakfast, appetizers, biryanis, curries, breads, sweets)
- **Customization**: Quantity selection, add-ons/preferences, and kitchen notes per item
- **Shopping Cart**: Persistent cart with real-time price calculations
- **Checkout Flow**: Event details, delivery preferences, and order review
- **Admin Panel**: Menu management and order administration
- **Responsive Design**: Mobile-optimized UI with category filters and hero imagery

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, TanStack Start, TypeScript |
| **Routing** | TanStack Router v1.170 |
| **State** | TanStack Query (React Query), Zod validation |
| **Styling** | Tailwind CSS v4, Radix UI components |
| **Backend/Database** | Supabase (PostgreSQL) |
| **Forms** | React Hook Form + Zod |
| **Build Tool** | Vite v8, Bun (package manager) |
| **Tooling** | ESLint, Prettier |

---

## Running the App

### Prerequisites

- **Node.js** (v18+) with npm
- Supabase credentials (`.env` file with API keys)

### Development

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:5173)
npm run dev
```

### Production

```bash
# Build
npm run build

# Preview build locally
npm run preview
```

### Code Quality

```bash
# Lint
npm run lint

# Format
npm run format
```

---

## Project Structure

```
src/
├── routes/              # TanStack Router file-based routes
│   ├── index.tsx        # Homepage / menu browser
│   ├── cart.tsx         # Shopping cart page
│   ├── checkout.tsx     # Checkout & event details
│   ├── confirmation.tsx # Order confirmation
│   ├── review.tsx       # Order review step
│   ├── auth.tsx         # Authentication flows
│   └── _authenticated/  # Protected routes (admin)
├── components/          # Reusable UI components
│   ├── site-header.tsx
│   ├── site-footer.tsx
│   ├── menu-item-dialog.tsx  # Customization modal
│   ├── order-progress.tsx
│   ├── admin-shell.tsx
│   └── ui/              # Radix UI primitives (button, dialog, input, etc.)
├── lib/
│   ├── cart.tsx         # Cart context & state management
│   ├── format.ts        # Format utilities (money, etc.)
│   ├── category-images.ts  # Image fallbacks & addon options
│   └── utils.ts         # Misc helpers (cn, classnames)
├── integrations/
│   └── supabase/
│       └── client.ts    # Supabase client initialization
├── hooks/
│   └── use-mobile.tsx   # Responsive hooks
├── assets/              # Static images (hero image, etc.)
├── router.tsx           # Router configuration
└── root.tsx / __root.tsx  # App layout wrapper
```

---

## Database Schema (Supabase)

### Tables

**categories**
- `id` (UUID, PK)
- `slug` (text, unique) — URL-friendly name
- `name` (text) — Display name
- `description` (text, nullable)
- `sort_order` (int)

**menu_items**
- `id` (UUID, PK)
- `category_id` (FK → categories)
- `name` (text)
- `description` (text, nullable)
- `price` (numeric)
- `serving_size` (text, nullable) — e.g., "Serves 10–12"
- `image_url` (text, nullable)
- `is_available` (boolean)
- `sort_order` (int)

**orders** (catering requests)
- Customer details, event info, delivery address
- Order items (line items from cart)
- Timestamps and status tracking

---

## Key Components & Hooks

### `useCart()` (`lib/cart.tsx`)
Manages shopping cart state (items, totals, persistence).
- `addLine()` — Add item to cart
- `itemCount` — Total items
- `subtotal` — Total price

### `useMenu()` (`routes/index.tsx`)
Fetches categories and menu items from Supabase using React Query.

### `CustomizeDialog()` (`routes/index.tsx`)
Modal for quantity, add-ons, and kitchen notes before adding to cart.

---

## Styling & Design

- **Tailwind CSS v4** with a warm, gradient aesthetic
- **Radix UI** for accessible, unstyled components
- **CSS Variables** for theming (`--gradient-veil`, `--shadow-glow`, etc.)
- **Responsive Breakpoints**: Mobile-first with `sm:`, `lg:` utilities
- **Hero Section**: Full-width image with semi-transparent veil overlay
- **Category Chips**: Horizontal scroll filter bar (sticky at top)

---

## Environment Variables (`.env`)

```env
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

---

## Deployment

- Built with **Lovable** (Lovable.dev) — enables sync with GitHub and CI/CD
- Statically generated frontend → CDN
- Supabase backend (serverless PostgreSQL + auth)
- Recommended: Vercel, Netlify, or any static host for the frontend

---

## Development Notes

- **Cart Persistence**: Uses browser localStorage (see `lib/cart.tsx`)
- **Image Fallbacks**: If `image_url` is missing, a function generates fallback images per category
- **Add-on Options**: Defined in `ADDON_OPTIONS` constant (e.g., "No nuts", "Extra spicy")
- **Type Safety**: Full TypeScript with Zod for form validation
- **SEO**: Metadata in route definitions for og:title, og:description, etc.

---

## Common Tasks

### Add a New Menu Item
1. Create row in `menu_items` table (Supabase)
2. Assign `category_id`, `price`, `serving_size`
3. Optionally upload `image_url` or rely on fallback

### Customize the Menu Categories
Edit `categories` table or modify `ADDON_OPTIONS` in `lib/category-images.ts`

### Modify Checkout Flow
Update `routes/checkout.tsx` and `routes/review.tsx`

### Update Styling
Modify Tailwind CSS config in `tailwind.config.ts` or change CSS variable values in global styles.

---

## Support & Resources

- **TanStack Start**: https://tanstack.com/start
- **Supabase Docs**: https://supabase.com/docs
- **Tailwind CSS**: https://tailwindcss.com
- **Radix UI**: https://radix-ui.com
