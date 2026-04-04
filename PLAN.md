# Nail Portfolio & Booking Site — Action Plan

Phase 0 — Project Setup (do # this once, before writing any real code)

Scaffold with npx create-next-app@latest — TypeScript, App Router, Tailwind
Set up GitHub repo immediately, before anything else
Create accounts (if not already): Cloudinary, Resend, Vercel, UptimeRobot
Create the 2nd Appwrite project (this one is for the nail site, Bloomer keeps the first)
Install Playwright and Vitest, configure both before touching features
Set up Vercel deployment from GitHub — configure so every push to main auto-deploys
Set up UptimeRobot pointing at the Vercel URL — 5 minute ping interval, email alert to you

Phase 1 — Admin Panel (build before the public site)
The site has nothing to show until she can upload. Start here.

Password-protected /admin route using Appwrite auth (just one account — hers)
Upload form: image (goes to Cloudinary), name, shape tag, color tags, style tags, price (optional)
Cloudinary upload with automatic WebP conversion and thumbnail generation on upload
Appwrite document created per design storing: name, all tags, Cloudinary URL, thumbnail URL, price, date
Edit and delete existing designs
View all uploaded designs in a simple list

Appwrite DB schema to define at this point:
Collection: designs

- $id: string
- name: string
- shape: enum (round, oval, square, squoval, almond, coffin, stiletto, lipstick)
- price: number (optional)
- tags: string[] (cottagecore, siren, rock, minimalist, seasonal, etc.)
- thumbnail_urls?: string[]
- image_urls: string[]
- $created_at: datetime
- $updatedAt: datetime

Phase 2 — Public Gallery
The main product. This is what visitors see.

Hero carousel at the top — auto-advancing, manual prev/next controls, loops
Left sidebar filter menu — multi-select shape, color, style filters that combine
Search bar — search by design name
Gallery grid of nail cards — image, name, price if set, shape badge
Grid density toggle — let visitor switch between ~3, ~6, ~10 columns per view
Click on a card → detail view (modal or page) with full image and all tags
Filters and search update the grid without full page reload

Phase 3 — Booking Form
High value, low complexity. Build this before touching payments.

Booking page/section with a form: name, contact email/phone, preferred date, notes, optional design reference (pick from gallery or upload inspo image)
On submit: Resend API call sends a formatted email to her personal inbox with all the details
Visitor gets a simple confirmation message on screen
No calendar management, no backend scheduling — just the email ping for now

Phase 4 — Shop (future, don't build yet)

Add price field usage to gallery cards and detail pages
Stripe integration for deposit or full payment on booking
Order confirmation email to both her and the client via Resend
Basic order log in the admin panel

Testing Strategy
Write one Playwright test per phase as you go — don't batch them at the end.

Phase 1 test: admin can log in and reach /admin
Phase 2 tests: gallery loads with designs visible, filter by shape returns correct results, search by name works
Phase 3 test: booking form submits successfully, confirmation message appears
Vitest integration tests for API routes: upload saves to Cloudinary and writes to Appwrite, booking triggers Resend email

CI pipeline via GitHub Actions:

On every push: run Vitest, then run Playwright against Vercel's auto-generated preview URL
Only merges to main if tests pass
This is your "I broke something" safety net

Monitoring

UptimeRobot: pings the live URL every 5 minutes, emails you if it goes down — set up in Phase 0
Vercel: sends deployment failure emails by default, nothing to configure
Cloudinary dashboard: watch storage and bandwidth usage monthly

Stack Summary
ConcernToolFrameworkNext.js 16.2 (App Router, TypeScript)StylingTailwind CSSAuth + DBAppwrite (2nd project)Image storageCloudinaryBooking emailsResendHostingVercelE2E testsPlaywrightIntegration testsVitestUptime monitoringUptimeRobot

Build Order Summary
Phase 0 — Setup & infrastructure
Phase 1 — Admin panel (upload, edit, delete)
Phase 2 — Public gallery (browse, filter, search)
Phase 3 — Booking form (email notification)
Phase 4 — Shop / payments (later, when she's actively booking)
