# ScanRec

ScanRec is a minimal barcode scanning system designed to capture and store raw scan data for later review.

This system is focused only on reliable scan capture and database persistence.

---

## Core Purpose

The system follows a simple, reliable flow:

**Scan → Store → Display History**

It captures raw barcode or DataMatrix scan strings and stores them in Supabase. No parsing, validation, or compliance logic is included in the current implementation scope.

---

## Tech Stack

- Vite (Current App Router. Going to change to Next.js for better security purposes later on)
- TypeScript
- Tailwind CSS
- Supabase (database)
- Vercel (deployment)
- GitHub (version control)

---

## System Flow

1. User performs a scan (camera or simulated input)
2. Raw scan string is captured by the frontend
3. Scan is written directly to Supabase
4. Dashboard retrieves and displays scan history

---

## Database Schema (Supabase)

### Table: `scans`

| Field | Type | Description |
|------|------|-------------|
| id | uuid | Primary key |
| created_at | timestamptz | Auto-generated timestamp |
| raw_scan | text | Raw barcode / DataMatrix string |

---

## Development Rules

### Current System Scope

This system is intentionally minimal.

We only build:

- Scan input capture
- Supabase storage
- Scan history display

We do NOT build:

- GS1 parsing
- DSCSA compliance logic
- GTIN/lot/expiry extraction
- validation or classification systems

---

## Workflow

1. Create task in Trello
2. Implement feature in development branch
3. Test locally and on mobile
4. Deploy to Vercel
5. Validate end-to-end flow
6. Merge into main

---

## Definition of Done

A feature is complete only when:

- Scan data is stored in Supabase
- Data appears correctly in dashboard
- Works on mobile devices
- No runtime errors in scan flow

---

## Current Focus

We are currently building:

- Scan input interface
- Supabase write integration
- Scan history dashboard

---

## Future Scope (Not currently implemented)

After system stability is confirmed:

- GS1 barcode parsing
- DSCSA compliance validation
- Structured product fields (GTIN, serial, lot, expiry)
- Audit and reporting systems

---

## Philosophy

We prioritize:

- Simplicity over complexity
- Working systems over perfect systems
- End-to-end functionality over feature depth
- Stability before intelligence

---

## License

Internal SCANREC system — not for public distribution
