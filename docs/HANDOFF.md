# Feitico — Developer Handoff Document

**Last updated**: 2026-03-28
**Status**: Active development (single-tenant MVP)
**Audience**: Developer with no prior knowledge of this codebase

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Environment Setup](#3-environment-setup)
4. [Architecture Overview](#4-architecture-overview)
5. [Routing](#5-routing)
6. [Landing Page](#6-landing-page)
7. [Booking Wizard (Public)](#7-booking-wizard-public)
8. [Admin Panel](#8-admin-panel)
9. [Business Logic](#9-business-logic)
10. [Database Schema](#10-database-schema)
11. [RPC Functions and Triggers](#11-rpc-functions-and-triggers)
12. [Services Layer](#12-services-layer)
13. [Shared Utilities](#13-shared-utilities)
14. [Push Notifications and PWA](#14-push-notifications-and-pwa)
15. [WhatsApp Integration](#15-whatsapp-integration)
16. [Realtime](#16-realtime)
17. [Database Migrations (Chronological)](#17-database-migrations-chronological)
18. [Multi-Tenant Notes](#18-multi-tenant-notes)
19. [Deploy](#19-deploy)
20. [Key Constraints and Non-Obvious Behaviors](#20-key-constraints-and-non-obvious-behaviors)

---

## 1. Project Overview

Feitico is a **salon booking SaaS** — a single-tenant web application for beauty salons to manage bookings, professionals, services, and clients.

There are two distinct surfaces:

| Surface | URL | Access |
|---------|-----|--------|
| Landing page (customer-facing) | `/` | Public — no login |
| Admin panel (salon owner) | `/admin` | Supabase Auth required |

Customers use the landing page to browse services and book appointments through a 5-step wizard. All bookings conclude with a WhatsApp redirect carrying the confirmation details. Salon owners manage everything through the admin panel: confirming bookings, configuring professionals and services, viewing financial reports, and monitoring the agenda.

The system is currently deployed as a single salon instance. The database schema contains multi-tenant stubs (`tenants`, `platform_users`, etc.) for future expansion, but they are not active.

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| UI Framework | React 18 + TypeScript |
| Build Tool | Vite |
| Styling | TailwindCSS + Shadcn/UI (Radix primitives) |
| Data Fetching | TanStack Query (React Query) |
| Forms | React Hook Form + Zod |
| Backend | Supabase (PostgreSQL + Auth + Storage + Realtime + Edge Functions) |
| PWA | VitePWA with custom service worker (`src/sw.ts`) |
| Push Notifications | Web Push API (VAPID) via Supabase Edge Function |
| Icons | Lucide React |
| Charts | Recharts |
| Excel Export | SheetJS (`xlsx`) |
| Deploy | Vercel (auto-deploy on push to `main`) |

---

## 3. Environment Setup

All environment variables are prefixed `VITE_` (client-side) or unprefixed (server-side/Vercel only).

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL (e.g., `https://xyz.supabase.co`) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Yes | Supabase public anon key |
| `VITE_SUPABASE_PROJECT_ID` | Yes | Supabase project ID (used for Edge Function URLs) |
| `VITE_AUTH_STORAGE_KEY` | Yes | localStorage key for persisting auth session |
| `VITE_AUTH_SESSION_MAX_DAYS` | No | Session max age in days (default: 2) |
| `VITE_AUTH_INACTIVITY_HOURS` | No | Inactivity timeout in hours |
| `VITE_ADMIN_ALLOWED_EMAILS` | Yes | Comma-separated list of authorized admin emails |
| `VITE_VAPID_PUBLIC_KEY` | Yes | Web Push VAPID public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes (Vercel only) | Service role key — used by `notify-admin-push` Edge Function. Never expose to the browser. |

Create a `.env.local` from `.env.example` for local development. The `SUPABASE_SERVICE_ROLE_KEY` must only be configured in the Vercel dashboard or Supabase Edge Function secrets.

---

## 4. Architecture Overview

```
Browser (PWA)
├── Landing Page (public, /)
│   ├── Header, Hero, Services, Gallery, About, Video, Testimonials, Footer
│   └── Booking Wizard (5 steps → WhatsApp redirect)
│
└── Admin Panel (/admin, auth-gated)
    ├── Avisos (notifications)
    ├── Dashboard (KPIs)
    ├── Financeiro (financial analytics + Excel export)
    ├── Agenda (calendar view)
    ├── Salão (salon config, collapsible cards)
    ├── Profissionais (staff + availability + exceptions + financial)
    ├── Serviços (catalog)
    ├── Agendamentos (booking list + manual creation)
    └── Clientes (client database)

Service Layer (src/services/)
├── bookingService ──────────────► Supabase: bookings, professional_exceptions
├── professionalService ──────────► Supabase: professionals, professional_*
├── clientService ────────────────► Supabase: clients, client_aliases, bookings
├── adminDashboardService ────────► Supabase: bookings, professionals, services
├── notificationService ──────────► Supabase: bookings
└── salonService / servicesService → Supabase: salons, services

Supabase Backend
├── PostgreSQL (21 tables + 2 RPCs + 2 triggers)
├── Auth (email/password, JWT)
├── Storage (images: logos/, hero/, about/, professionals/, gallery/)
├── Realtime (bookings channel per salon_id)
└── Edge Functions (notify-admin-push)

External
├── WhatsApp (wa.me redirect after booking)
└── Vercel (hosting, auto-deploy from GitHub main branch)
```

### Data flow summary

1. Browser loads React app from Vercel CDN.
2. All data reads/writes go through the Supabase JavaScript client (REST or Realtime WebSocket).
3. Row Level Security (RLS) on all tables — the anon key is safe to expose because RLS restricts what it can access.
4. The service role key is only used inside the `notify-admin-push` Edge Function running on Supabase's servers.
5. After any booking creation, a fire-and-forget call to the Edge Function delivers a Web Push to the admin's subscribed devices.

---

## 5. Routing

The app uses React Router with three routes:

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | `Index` | Public landing page |
| `/admin` | `Admin` | Admin panel (auth-gated) |
| `*` (catch-all) | — | Redirect to `/` |

There is no complex nested routing. The admin panel manages its own internal tab/section state within `Admin.tsx`.

---

## 6. Landing Page

The landing page is a single scrollable page assembled from the following sections, rendered in order:

```
Header → Hero → Services → Gallery → About → VideoSection → Testimonials → Booking → Footer
```

### Header.tsx

Fixed navbar at the top of the page. Displays the salon logo (or name as fallback). Navigation links:

- Início, Serviços, Galeria, Sobre, Depoimentos, Agendar

Behavior:
- Applies a glass dark effect once the user scrolls more than 50px.
- Mobile: hamburger menu collapses/expands the nav links.
- All links use smooth scroll to the corresponding section.

### Hero.tsx

Full-viewport-height section with a background image from `salon.hero_image_url`.

Displays:
- `salon.hero_title` (primary headline)
- `salon.hero_subtitle` (rendered in gold/accent color)
- `salon.hero_description` (supporting text)

Two CTAs:
- "Agendar Horário" — scrolls to the Booking section
- "Ver Serviços" — scrolls to the Services section

### Services.tsx

Grid of service cards. Layout: 1 column on mobile, 2 on tablet, 3+ on desktop.

Each card shows:
- Service image
- Name, description
- Price and duration
- "Agendar" button
- Special badge for `is_combo = true` services

Clicking "Agendar" calls `onBook(service)` — a callback passed down from the parent `Index` component — which scrolls to the Booking section and pre-selects that service in Step 2 of the wizard.

### Gallery.tsx

Photo grid of salon images: 2 columns on mobile, 3 on tablet, 4 on desktop. Hover state reveals the image caption. The entire section is hidden if there are no gallery images.

### About.tsx

Two-column layout (image on left, text on right). Renders:
- `salon.about_image_url`
- `salon.about_title`
- `salon.about_text`

### VideoSection.tsx

Embeds a YouTube video via iframe. Automatically extracts the video ID from `salon.video_url` (handles both `watch?v=` and `youtu.be/` URL formats). The entire section is hidden if `salon.video_url` is null.

### Testimonials.tsx

Card grid showing customer testimonials with star ratings (1–5), quote text, author name, and author photo. Hidden if there are no active testimonials.

### Footer.tsx

Three-column layout:
1. Brand info + social links (Instagram, Facebook)
2. Contact info (phone, WhatsApp, address)
3. Opening hours (Portuguese day names: Segunda, Terça, etc.)

Footer credit: "Desenvolvido por GM Tech Solution" with a WhatsApp link to the developer.

---

## 7. Booking Wizard (Public)

`Booking.tsx` implements a 5-step wizard for customers to schedule an appointment. State is managed locally within the component.

### Step 1 — Professional (Profissional)

Displays a grid of active professionals. The selected professional's card gets `border-primary` highlight. Selection clears any previously chosen time slot and confirmation data.

### Step 2 — Services (Serviços)

Dropdown list of services linked to the selected professional (via `professional_services` join table). Multiple services can be selected. Each entry shows name, price, and duration. Changing the selection clears the time slot and confirmation state.

### Step 3 — Date (Data)

Inline calendar using `date-fns` with the `pt-BR` locale.

Days are disabled if:
- The date is in the past.
- The weekday is not present in the professional's `professional_availability` records.
- The date has a `day_off` exception in `professional_exceptions`.
- The date has a full-day `blocked` exception in `professional_exceptions` (i.e., a blocked exception with no specific time range).

### Step 4 — Time Slot (Horário)

A `<select>` dropdown with available time slots grouped into three visual categories:

| Group | Label | Range |
|-------|-------|-------|
| Manhã | ☀️ Manhã | Before 12:00 |
| Tarde | 🌤️ Tarde | 12:00–18:00 |
| Noite | 🌙 Noite | After 18:00 |

Slots are generated by `getAvailableSlots()` (see [Business Logic](#9-business-logic) for the full algorithm).

### Step 5 — Customer Info (Seus Dados)

Fields: full name, phone/WhatsApp.

On phone field blur: calls `lookupClientByPhone()` to check if this phone number belongs to a returning client. If found, auto-fills the name field. This is purely a UX convenience — the customer can override the auto-filled value.

Validation:
- Name: minimum 2 characters
- Phone: minimum 10 digits

### Confirmation

Shows a full summary of the booking: professional, services (with individual prices), total price, total duration, date, and time. Customer confirms by clicking "Confirmar".

Submission calls `createBooking.mutateAsync()`. On success, the user is redirected to WhatsApp with a pre-formatted confirmation message (see [WhatsApp Integration](#15-whatsapp-integration)).

---

## 8. Admin Panel

`Admin.tsx` is the root of the authenticated admin surface.

### Auth Flow

1. On mount, checks for an existing session via `supabase.auth.getSession()`.
2. If no session, renders a login form.
3. The email is validated against `VITE_ADMIN_ALLOWED_EMAILS`. An email not in that list is rejected even if Supabase auth succeeds.
4. Email is persisted to localStorage for convenience on next login.
5. Password field has a show/hide eye toggle.
6. Session expires after `VITE_AUTH_SESSION_MAX_DAYS` (default 2 days). A modal prompts the user to re-login — the custom event `feitico:session-expired` triggers this modal.
7. When a new booking arrives via Realtime, the browser tab title changes to `(N) Feitiço Admin` where N is the unread count, and a sound alert plays.

### Admin Tabs

Navigation order and purpose:

| Tab | Component | Purpose |
|-----|-----------|---------|
| Avisos | `AdminAvisos` | Notification center for pending and overdue bookings |
| Dashboard | (inline) | KPIs: total bookings, revenue, commissions, per-professional breakdown |
| Financeiro | `AdminFinanceiro` | Full financial analytics with Excel export |
| Agenda | `AdminCalendar` | Day-view calendar grouped by professional |
| Salão | `AdminSalon` | Salon configuration (collapsible sections) |
| Profissionais | `AdminProfessionals` | Professional CRUD + availability + exceptions + financials |
| Serviços | `AdminServices` | Service catalog CRUD |
| Agendamentos | `AdminBookings` | Booking list with filters and manual booking creation |
| Clientes | `AdminClients` | Client database with search and stats |

---

### AdminAvisos.tsx

Three sections:

1. **Aguardando Confirmação** — Bookings with `status = 'pending'`.
2. **Confirmados Hoje** — Bookings with `status = 'confirmed'` scheduled for today.
3. **Confirmados em Atraso** — Bookings with `status = 'confirmed'` whose scheduled time has passed.

Each booking card shows the customer name, scheduled time, services list, and a WhatsApp reminder button. Clicking the reminder button:
- Sends a WhatsApp message via `buildReminderMessage()`
- Marks `reminder_sent_at` in the database
- Button turns green and shows "Enviado"

Uses the `useAdminNotificationsRealtime` hook for live updates.

---

### AdminBookings.tsx

Booking list with filters:

| Filter | Options |
|--------|---------|
| Date range | De / Até |
| Professional | Dropdown of all professionals |
| Status | Chips: Todos / Pendentes / Confirmados / Concluídos / Cancelados |

Per-booking status actions:

| Current status | Available actions |
|---------------|-------------------|
| `pending` | Confirmar, Cancelar |
| `confirmed` | Concluir, Cancelar |
| `completed` | None |
| `cancelled` | None |

WhatsApp reminder button available for `pending` and `confirmed` bookings.

**Manual booking creation modal** (walk-in or scheduled):
- Fields: customer name, phone, professional, services, date, time, notes
- Commission and profit are calculated live as services are selected
- On submit, calls `createBooking.mutateAsync()` with `booking_type: 'walk_in'` (if no time) or `'scheduled'`

---

### AdminCalendar.tsx

Day-view calendar for the agenda.

Two display modes:
- **Grouped by professional**: Each professional has a collapsible section showing their bookings for the day.
- **Flat list**: All bookings for the day in a single list.

Navigation: previous/next day arrows + an inline date picker.

Per-booking actions mirror `AdminBookings` (Confirmar/Cancelar for pending, Concluir/Cancelar for confirmed). WhatsApp reminder button also present.

Receives real-time booking updates via `useRealtimeBookings`.

---

### AdminSalon.tsx

Collapsible card sections for salon configuration:

| Section | Default | Fields |
|---------|---------|--------|
| Informações Básicas | Open | name, phone, address, WhatsApp (DDI + number), Instagram, Facebook, video URL |
| Imagens | Open | logo upload, hero image upload |
| Sobre o Salão | Closed | `about_text` textarea |
| Textos do Site | Closed | hero_title, hero_subtitle, hero_description, about_title, tagline, about_image upload, seo_title, seo_description |
| Horário de Funcionamento | Closed | Day toggles + time ranges via `OpeningHoursEditor` |
| Galeria de Fotos | Closed | Image upload + sort order via `AdminGallery` |
| Depoimentos | Closed | Full CRUD via `AdminTestimonials` |

Form state is persisted to `localStorage` under the key `feitico:form:admin-salon` for PWA offline resilience. The draft is restored on load and cleared on successful save.

---

### AdminProfessionals.tsx

Professional list with search and add/edit/delete actions.

Clicking a professional card opens a detail panel (with `border-primary` highlight on the selected card). The detail panel has 4 sub-tabs:

| Sub-tab | Purpose |
|---------|---------|
| Disponibilidade | Weekly schedule: per-weekday start/end time windows |
| Exceções | Time-off entries: day_off, partial block, or custom hours for a specific date |
| Serviços | Link/unlink services; optional per-professional price, duration, buffer, and commission overrides |
| Financeiro | Financial metrics for this professional filtered by date range |

---

### AdminServices.tsx

Service catalog with:
- Pagination and name search
- Fields per service: name, description, price, duration (minutes), buffer_minutes, category, image, `is_combo` flag, active flag, sort_order
- Sort order adjustable via up/down arrows or drag-and-drop

---

### AdminFinanceiro.tsx

Full financial analytics page.

**Filters**: Date range (De/Até) + professional dropdown ("Todos" or specific professional).

**Summary cards**:

| Card | Description |
|------|-------------|
| Faturamento Total | Revenue from `completed` bookings |
| Comissões Pagas | Total commissions from completed bookings |
| Lucro Líquido | Revenue minus commissions |
| Ticket Médio | Average booking value |
| Atendimentos | Count of completed bookings |
| A Receber | Revenue from `confirmed` (not yet completed) bookings |

**Por Profissional table**: Nome, Atend., Faturamento, Comissão, Lucro, Ticket Médio, Ocupação (min)

**Por Serviço table**: Serviço, Qtd. Atend., Faturamento, % do Total (with visual participation bar)

**Comissões a Pagar**: Professionals who have `confirmed` (not yet `completed`) bookings — showing the commission amount that will be owed when those bookings are completed.

**Clientes section**:
- Top clients by total revenue: name, visit count, total spent, average ticket, top services, last visit
- New vs. returning client counts
- Average return interval (days between visits)

**Export Excel**: Generates a 3-sheet XLSX file named `financeiro_YYYY-MM.xlsx` with sheets: Resumo, Por Profissional, Por Serviço.

---

### AdminClients.tsx

Client database with:
- Search by name or phone digits
- Columns: Nome, Telefone (masked as `****1234` for privacy), Agendamentos, Total gasto, Ticket médio, Última visita, WhatsApp button
- Stats are computed from `confirmed` + `completed` bookings at query time
- Infinite pagination: 30 clients per page, "Carregar mais" button

---

## 9. Business Logic

This section documents the non-obvious logic that is critical to understand before modifying the system.

### Booking Status Flow

```
pending → confirmed → completed
    ↓          ↓
 cancelled  cancelled
```

- `completed` is a terminal state — no further status change is allowed.
- `cancelled` is a terminal state.
- The transition from `confirmed` to `completed` is the point at which the booking counts toward financial reports and commissions become "paid."

---

### Commission Calculation

```
if commission_type === "percentage":
  commission_amount = total_price × (commission_value / 100)

if commission_type === "fixed":
  commission_amount = commission_value

profit_amount = total_price - commission_amount
```

**Override hierarchy** (highest to lowest priority):
1. `professional_services.commission_override_type` + `commission_override_value` (per professional per service)
2. `professionals.commission_type` + `commission_value` (professional default)

`commission_amount` and `profit_amount` are stored directly on the `bookings` row at creation time as a **historical snapshot**. This means subsequent changes to commission rates do not retroactively alter past booking data.

---

### Time Slot Generation (`getAvailableSlots`)

Called in Step 4 of the booking wizard for a given professional + date combination.

Algorithm:

1. Load `professional_availability` records for the weekday of the requested date.
2. Load `professional_exceptions` for the exact date.
3. If a `day_off` exception exists → return `[]` immediately.
4. If `custom_hours` exception exists → use those time windows instead of the weekly schedule.
5. Build a list of blocked ranges from any `blocked` exceptions with start/end times.
6. Load all existing `pending` and `confirmed` bookings for that professional on that date.
7. Iterate in 5-minute increments across the availability windows:
   - Skip past times (if the date is today).
   - Skip if the slot's time range overlaps any blocked range.
   - Skip if the slot overlaps an existing booking (applies a 60-minute grace margin for overtime).
   - The required slot window = `total_occupied_minutes` (duration + buffer).
   - Add to results if clear.

The returned slots are what the customer sees in the dropdown in Step 4.

---

### Double-Booking Prevention

Two layers:

**Layer 1 — Client-side pre-check**: `check_booking_conflict` RPC is called before the `INSERT`. If it returns `true`, the booking is rejected with a user-facing error before touching the database.

**Layer 2 — Server-side enforcement**: PostgreSQL trigger `prevent_booking_conflict` fires `BEFORE INSERT OR UPDATE` on the `bookings` table. If a conflict is found, the trigger raises an exception and the insert is rolled back.

Conflict logic: a conflict exists when there is an existing `pending` or `confirmed` booking for the same professional on the same date where the time ranges overlap:

```sql
existing_start < new_slot_end AND existing_end > new_slot_start
```

Walk-in bookings (`booking_time IS NULL`) skip the time conflict check.

---

### Professional Exception Handling

`professional_exceptions` rows drive availability for a specific date:

| `type` | `start_time` / `end_time` | Effect |
|--------|--------------------------|--------|
| `day_off` | NULL / NULL | Entire day blocked; date greyed out in calendar |
| `blocked` | Specific range | That time range excluded from available slots |
| `custom_hours` | Specific range | Only those hours available (weekly schedule ignored for that day) |

On booking creation, `createBooking()` validates server-side: if a `day_off` exception exists for the booking date, it throws an error regardless of what the client sent.

---

### Client Deduplication

The `upsert_client_by_phone` SQL function handles deduplication:

1. Normalizes the phone number by stripping all non-digit characters.
2. Attempts insert into `clients` with `(salon_id, phone_normalized)` as the unique key.
3. On conflict: updates `preferred_name` to the latest name provided, updates `last_seen_at`.
4. Tracks all name variations in `client_aliases` with a `usage_count`.
5. Returns the client UUID.

After a booking is created, an async fire-and-forget call updates `bookings.client_id` with the returned UUID. This means `client_id` may be briefly null immediately after booking creation — do not treat a null `client_id` as an error.

On the booking form (Step 5), `lookupClientByPhone()` queries `clients` by normalized phone to auto-fill the name field for returning customers.

---

## 10. Database Schema

### Core Tables

#### `salons`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| name | text | |
| active | boolean | |
| address | text | |
| phone | text | |
| whatsapp | text | |
| instagram | text | |
| facebook | text | |
| logo_url | text | Storage path |
| hero_image_url | text | Storage path |
| video_url | text | YouTube URL |
| about_text | text | |
| opening_hours | JSONB | `{ "mon": { open: "09:00", close: "18:00", active: true }, ... }` |
| slug | text | |
| hero_title | text | |
| hero_subtitle | text | Rendered in gold on landing page |
| hero_description | text | |
| about_title | text | |
| about_image_url | text | |
| tagline | text | |
| seo_title | text | |
| seo_description | text | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

#### `professionals`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| salon_id | UUID | FK → salons |
| name | text | |
| photo_url | text | |
| commission_type | text | `'percentage'` or `'fixed'` |
| commission_value | numeric | |
| active | boolean | |
| created_at | timestamptz | |

#### `services`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| salon_id | UUID | FK → salons |
| name | text | |
| description | text | |
| price | numeric | |
| duration | integer | Minutes |
| buffer_minutes | integer | Rest/cleanup time after service |
| category | text | |
| image_url | text | |
| is_combo | boolean | |
| active | boolean | |
| sort_order | integer | |
| created_at | timestamptz | |

#### `professional_services`

Junction table linking professionals to the services they perform, with optional per-professional overrides.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| professional_id | UUID | FK → professionals |
| service_id | UUID | FK → services |
| active | boolean | |
| custom_price | numeric | Overrides service.price if set |
| custom_duration_minutes | integer | Overrides service.duration if set |
| custom_buffer_minutes | integer | Overrides service.buffer_minutes if set |
| commission_override_type | text | `'percentage'` or `'fixed'` — overrides professional default |
| commission_override_value | numeric | |

#### `professional_availability`

Weekly recurring availability windows per professional.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| professional_id | UUID | FK → professionals |
| weekday | integer | 0 = Sunday, 6 = Saturday |
| start_time | time | e.g., `09:00` |
| end_time | time | e.g., `18:00` |
| active | boolean | |

#### `professional_exceptions`

Date-specific overrides to the weekly availability.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| professional_id | UUID | FK → professionals |
| date | date | The specific date |
| type | text | `'day_off'`, `'blocked'`, `'custom_hours'` |
| start_time | time | Null for `day_off` |
| end_time | time | Null for `day_off` |
| reason | text | Human-readable note |
| created_at | timestamptz | |

#### `bookings`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| salon_id | UUID | FK → salons |
| professional_id | UUID | FK → professionals |
| client_id | UUID | FK → clients (nullable, async-filled) |
| customer_name | text | Denormalized snapshot |
| customer_phone | text | Denormalized snapshot |
| booking_date | date | |
| booking_time | time | Null for walk-in |
| booking_type | text | `'scheduled'`, `'walk_in'`, `'waitlist'` |
| services | JSONB | Snapshot of selected services at booking time |
| status | text | `'pending'`, `'confirmed'`, `'completed'`, `'cancelled'` |
| total_price | numeric | Sum of service prices |
| total_duration | integer | Sum of service durations (minutes) |
| total_occupied_minutes | integer | total_duration + total buffer (used for conflict detection) |
| total_buffer_minutes | integer | Sum of buffer_minutes |
| commission_amount | numeric | Historical snapshot at booking time |
| profit_amount | numeric | Historical snapshot at booking time |
| notes | text | Admin notes |
| reminder_sent_at | timestamptz | Set when WhatsApp reminder is sent |
| created_at | timestamptz | |

#### `clients`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| salon_id | UUID | FK → salons |
| phone_normalized | text | Digits only — UNIQUE with salon_id |
| preferred_name | text | Most recently provided name |
| last_seen_at | timestamptz | |
| created_at | timestamptz | |
| updated_at | timestamptz | |
| merged_into_id | UUID | Self-referential — for future duplicate merging feature |

#### `client_aliases`

Tracks every name variant a client has ever used.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| client_id | UUID | FK → clients |
| alias_name | text | |
| usage_count | integer | |
| last_used_at | timestamptz | |

#### `gallery_images`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| salon_id | UUID | FK → salons |
| image_url | text | Storage path |
| caption | text | |
| sort_order | integer | |
| created_at | timestamptz | |

#### `testimonials`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| salon_id | UUID | FK → salons |
| author_name | text | |
| author_image | text | |
| content | text | |
| rating | integer | 1–5 |
| active | boolean | |
| created_at | timestamptz | |

#### `push_subscriptions`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| salon_id | UUID | FK → salons |
| endpoint | text | Push service URL |
| p256dh | text | ECDH public key |
| auth | text | Authentication secret |
| device_label | text | Human-readable label |
| created_at | timestamptz | |

#### `audit_logs`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| action | text | |
| created_at | timestamptz | |
| description | text | |
| details | JSONB | Arbitrary structured data |
| ip_address | text | |
| module | text | |
| user_email | text | |
| user_name | text | |

---

## 11. RPC Functions and Triggers

### `check_booking_conflict`

```sql
check_booking_conflict(
  p_professional_id   UUID,
  p_booking_date      DATE,
  p_booking_time      TIME,
  p_total_occupied_minutes INTEGER,
  p_exclude_id        UUID  -- optionally exclude a booking (for edits)
) RETURNS BOOLEAN
```

Returns `true` if the proposed slot overlaps with any existing `pending` or `confirmed` booking for the same professional on the same date.

Overlap condition:
```sql
existing_start < proposed_end AND existing_end > proposed_start
```

### `upsert_client_by_phone`

```sql
upsert_client_by_phone(
  p_salon_id  UUID,
  p_phone     TEXT,
  p_name      TEXT
) RETURNS UUID
```

1. Strips non-digits from `p_phone` to get `phone_normalized`.
2. Inserts a new `clients` row or updates `preferred_name` and `last_seen_at` on conflict.
3. Upserts into `client_aliases` with `usage_count` increment.
4. Returns the client UUID.

### `prevent_booking_conflict` (Trigger)

- Type: `BEFORE INSERT OR UPDATE`
- Table: `bookings`
- If `booking_time IS NOT NULL`, runs the same overlap check as `check_booking_conflict`.
- Raises `EXCEPTION` if a conflict is found, rolling back the statement.
- This is the server-side guarantee — the client-side check is a UX pre-flight only.

---

## 12. Services Layer

All Supabase interactions are encapsulated in `src/services/`. Components and hooks import from here — never call the Supabase client directly from components.

| File | Key Exports |
|------|------------|
| `bookingService.ts` | `getBookings`, `createBooking`, `getAvailableSlots`, `calculateCommission`, `generateWhatsAppMessage` |
| `clientService.ts` | `getClientsPage`, `lookupClientByPhone`, `buildClientWhatsAppUrl` |
| `professionalService.ts` | Full CRUD for professionals, availability records, exception records, service links |
| `adminDashboardService.ts` | `getDashboardOverview`, `getFinanceiroByService`, `getFinanceiroProfissional`, `getFinanceiroClientes` |
| `notificationService.ts` | `getNotificationBuckets`, `markReminderSent`, `updateBookingStatus`, `buildReminderMessage` |
| `salonService.ts` | `getSalon`, `getPrimarySalonId` |
| `servicesService.ts` | Full CRUD for salon services |
| `galleryService.ts` | Gallery image CRUD (upload, delete, reorder) |
| `testimonialService.ts` | Testimonial CRUD |

### Notes on `createBooking`

`createBooking` in `bookingService.ts` does several things in sequence:

1. Calls `check_booking_conflict` RPC — throws if conflict found.
2. Validates that no `day_off` exception exists for the booking date.
3. Calculates `commission_amount` and `profit_amount` using the override hierarchy.
4. Inserts the booking row.
5. Fire-and-forget: calls `upsert_client_by_phone` and updates `bookings.client_id`.
6. Fire-and-forget: calls the `notify-admin-push` Edge Function.

Steps 5 and 6 are intentionally non-blocking — failures there do not fail the booking creation.

---

## 13. Shared Utilities

Located in `src/lib/`.

### `utils.ts`

- `cn(...inputs)` — Merges Tailwind class names using `clsx` + `tailwind-merge`.
- `formatDuration(minutes: number) → string` — e.g., `90` → `"1h 30min"`, `45` → `"45min"`.

### `phone.ts`

Handles all WhatsApp URL construction and phone number formatting.

- `normalizeWhatsAppPhone(phone)` — strips non-digits, injects Brazilian country code (`55`) if not present.
- `splitWhatsAppPhone(phone)` — returns `{ ddi, number }`.
- `buildWhatsAppUrl(phone, message)` — returns `wa.me/{phone}?text={encoded}` (mobile).
- `buildWhatsAppWebUrl(phone, message)` — returns `web.whatsapp.com/send?phone={phone}&text={encoded}` (desktop).

The booking and reminder flows use `buildWhatsAppUrl` on mobile and `buildWhatsAppWebUrl` on desktop (detected via `navigator.userAgent`).

### `bookingStatus.ts`

- `STATUS_LABELS` — maps status values to Portuguese labels:
  - `pending` → "Pendente"
  - `confirmed` → "Confirmado"
  - `completed` → "Concluído"
  - `cancelled` → "Cancelado"
- `STATUS_TEXT_COLORS` — maps status values to Tailwind text color classes.

### `dateUtils.ts`

- `defaultDateFrom()` — returns the first day of the current month as `YYYY-MM-DD`.
- `defaultDateTo()` — returns today as `YYYY-MM-DD`.

Used as default values for date range filters in Financeiro and Dashboard.

### `pushNotifications.ts`

- `getPushStatus()` — returns `'unsupported'`, `'denied'`, `'subscribed'`, or `'unsubscribed'`.
- `subscribeToPush(salonId)` — registers the browser push subscription with the database.
- `unsubscribeFromPush()` — removes the subscription from the database and unregisters from the browser.

### `notificationSound.ts`

- `playNotificationSound()` — plays an alert sound when a new booking arrives via Realtime.
- `prewarmAudio()` — pre-loads the audio context on the first user interaction with the admin panel. Required to bypass iOS's policy of blocking audio playback until a user gesture occurs. Must be called inside a click handler.

---

## 14. Push Notifications and PWA

### PWA Configuration

- Strategy: `injectManifest` (VitePWA) with a custom service worker at `src/sw.ts`.
- The service worker uses Workbox for precaching static assets.
- Runtime cache: NetworkFirst strategy for Supabase REST API requests (50 entries max, 5-minute TTL).
- `public/manifest.webmanifest`: app name, icons, `display: standalone`, theme color.
- `usePwaInstall` hook: detects the `beforeinstallprompt` browser event and surfaces an install banner in the admin panel.
- Form drafts (AdminSalon, Booking wizard) are persisted to `localStorage` for offline resilience. Drafts survive page refreshes and are cleared on successful save.

### Push Notification Flow

1. Admin clicks the Bell icon in the admin panel header.
2. Browser permission prompt appears.
3. On grant: `subscribeToPush(salonId)` is called, which:
   - Gets the VAPID public key from `VITE_VAPID_PUBLIC_KEY`.
   - Registers the browser subscription with the Push API.
   - Saves `{ endpoint, p256dh, auth }` to `push_subscriptions` in Supabase.
4. When a new booking is created (`createBooking`), a fire-and-forget HTTP call is made to the `notify-admin-push` Edge Function.
5. The Edge Function:
   - Fetches all `push_subscriptions` for the salon.
   - Sends a Web Push payload via VAPID to each endpoint.
   - Notification payload: `{ title: "Novo agendamento!", body: "{customer_name} às {time}", data: { url: "/admin" } }`.
   - Removes stale subscriptions that return 410 or 404 from the push service.
6. The service worker (`src/sw.ts`) receives the `push` event and calls `self.registration.showNotification(...)`.
7. On notification click, the service worker navigates the user to `/admin`.

---

## 15. WhatsApp Integration

All booking completion flows redirect the user (or admin) to WhatsApp with a pre-formatted message. No WhatsApp API key or Business API is used — this is a plain `wa.me` URL redirect.

### Post-booking message (customer-facing)

Generated by `generateWhatsAppMessage()` in `bookingService.ts`. Sent to the **salon's WhatsApp** number. Contains:

- Customer name + phone
- Salon name + address
- Professional name
- Services list with individual prices
- Total price, total duration, buffer time, total occupied time
- Booking type (agendado / walk-in / lista de espera)
- Date formatted as `dd/MM/yyyy` + time

### Reminder message (admin-triggered)

Generated by `buildReminderMessage()` in `notificationService.ts`. Sent to the **customer's WhatsApp** from the admin panel (Avisos, Bookings, Calendar). Simpler format: salon name, appointment date/time, services.

After sending, `markReminderSent()` sets `reminder_sent_at` on the booking and the reminder button changes state.

### URL strategy

```
Mobile:  https://wa.me/{phone}?text={encoded_message}
Desktop: https://web.whatsapp.com/send?phone={phone}&text={encoded_message}
```

Platform is detected via `navigator.userAgent`. All phone numbers are normalized to E.164 format (digits only, with `55` country code for Brazil).

---

## 16. Realtime

`useRealtimeBookings(salonId, onNewBooking?)` in `src/hooks/` manages the Supabase Realtime subscription.

- Subscribes to the `bookings` Postgres channel filtered by `salon_id = {salonId}`.
- On any change event (INSERT, UPDATE, DELETE):
  - Invalidates the `bookings` React Query cache.
  - Invalidates the `available-slots` React Query cache.
- On INSERT specifically:
  - Calls `onNewBooking()` callback (if provided).
  - The callback in `Admin.tsx` triggers:
    - `playNotificationSound()`
    - A toast notification
    - Increment of the browser tab title badge counter: `(N) Feitiço Admin`

---

## 17. Database Migrations (Chronological)

| Migration | Purpose |
|-----------|---------|
| `20260317181814` | Core schema foundation: salons, professionals, services, bookings, availability |
| `20260317224027` | Schema updates |
| `20260317231656` | `professional_exceptions`, `professional_availability`, `professional_services` tables |
| `20260323152419` | RLS policies and service role grants |
| `20260323152507` | Additional RLS / configuration |
| `20260325202625` | Schema refinement |
| `20260325210000` | `check_booking_conflict` RPC + `prevent_booking_conflict` DB trigger |
| `20260326000000` | Seed: initial salon record |
| `20260326101000` | Allow `'waitlist'` as a valid `booking_type` |
| `20260326120000` | Salon landing page dynamic fields (hero_title, hero_subtitle, hero_description, about_title, tagline, seo_title, seo_description, about_image_url) |
| `20260326120001` | Performance indexes on `bookings`, `professional_availability` |
| `20260326170000` | Remove active multi-tenant tables (stubs retained for future expansion) |
| `20260326180000` | Indexes for pagination and RLS performance |
| `20260326190000` | Add `reminder_sent_at` to `bookings` |
| `20260327000000` | `push_subscriptions` table with RLS |
| `20260327010000` | `clients` + `client_aliases` tables; `upsert_client_by_phone` RPC; `client_id` FK on `bookings` |
| `20260328000000` | Backfill `bookings.client_id` from `customer_phone` → `clients.phone_normalized` for all existing records |

---

## 18. Multi-Tenant Notes

The database contains multi-tenant tables (`tenants`, `platform_users`, `tenant_branding`, `tenant_settings`, `tenant_details`, `subscription_plans`, `tenant_subscriptions`) that are **not currently active**. They were retained as stubs when the initial multi-tenant structure was removed in migration `20260326170000`.

For the current deployment, there is one salon record and one set of admin credentials. The `salon_id` is resolved via `getPrimarySalonId()` in `salonService.ts`, which fetches the first active salon record.

All tables that are salon-scoped have a `salon_id` column and RLS policies that enforce tenant isolation. This design makes future multi-tenant expansion possible without schema changes.

---

## 19. Deploy

- **Host**: Vercel
- **Trigger**: Auto-deploy on push to `main` branch
- **Build command**: `vite build`
- **Output directory**: `dist`
- **Environment variables**: Set in the Vercel dashboard (not in `.env` files in the repository)
- `SUPABASE_SERVICE_ROLE_KEY` is a server-side secret — configure it in Vercel's environment settings, not in any client-accessible variable.

The Supabase Edge Function `notify-admin-push` is deployed separately to the Supabase project. It must have `SUPABASE_SERVICE_ROLE_KEY` and the VAPID private key configured as Supabase secrets.

---

## 20. Key Constraints and Non-Obvious Behaviors

These are the behaviors most likely to confuse a developer encountering the codebase for the first time.

**1. `client_id` on bookings is intentionally nullable.**
It is populated asynchronously after booking creation. A null `client_id` does not mean the booking is invalid — the `customer_name` and `customer_phone` columns are the authoritative denormalized source of truth for all booking display.

**2. `commission_amount` and `profit_amount` are historical snapshots.**
They are calculated at booking creation time and stored. Changing a professional's commission rate later does not retroactively alter existing bookings. The financial reports read these stored values, not live calculations.

**3. The double-booking prevention is two-layered on purpose.**
The client-side `check_booking_conflict` RPC call is a UX pre-flight. The `prevent_booking_conflict` PostgreSQL trigger is the real guarantee. Never remove the trigger in the belief that the client-side check is sufficient.

**4. `total_occupied_minutes` is not the same as `total_duration`.**
`total_occupied_minutes = total_duration + total_buffer_minutes`. This is the value used for conflict detection — it accounts for the cleanup/rest time after a service before the professional can take the next booking.

**5. `prewarmAudio()` must be called on a user gesture.**
iOS blocks audio playback until the user has interacted with the page. The admin panel calls `prewarmAudio()` on its first click event. If this call is removed or delayed, notification sounds will silently fail on iOS.

**6. Form drafts in localStorage are active.**
AdminSalon persists its form state to `feitico:form:admin-salon`. If you see unexpected pre-filled values in AdminSalon during development, clear localStorage.

**7. `VITE_ADMIN_ALLOWED_EMAILS` is a second auth gate.**
Supabase Auth is the primary gate. The allowed emails list is a second check in the client. A Supabase account that is not in the allowed list will be rejected even if authentication succeeds. Add new admin emails to this env var.

**8. Walk-in bookings skip time conflict detection.**
Any booking with `booking_time = NULL` (booking_type `'walk_in'`) bypasses the conflict trigger. This is intentional — walk-ins are unscheduled and not placed on the time grid.

**9. The `services` column on `bookings` is a JSONB snapshot.**
It captures the exact service details (name, price, duration, etc.) at the moment of booking. Editing a service's price or name afterward does not affect existing booking records. Financial reports read from this snapshot for accuracy.

**10. The `notify-admin-push` Edge Function cleans up stale subscriptions.**
When the push service returns 410 (Gone) or 404 for a subscription endpoint, the Edge Function deletes that row from `push_subscriptions`. This is normal behavior — browser push subscriptions expire or are revoked by the user.
