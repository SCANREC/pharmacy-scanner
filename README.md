# SCANREC — Pharmacy Verification System

SCANREC is a lightweight pharmacy barcode scanning system designed to validate and log serialized pharmaceutical products using GS1 data standards and DSCSA-aligned fields.

This is an **MVP-first system** focused on reliability before scale.

---

## Core Purpose

The system provides a simple, end-to-end flow:

**Scan → Parse GS1 → Store in Supabase → Display Result → Persist History**

No advanced AI, automation, or enterprise features are included in the MVP stage.

---

## Tech Stack

* Next.js (App Router)
* TypeScript
* Tailwind CSS
* Supabase (database)
* Vercel (deployment)
* GitHub (source control)

---

## System Flow

1. User triggers scan (simulated or camera input)
2. GS1 barcode is parsed into structured fields:

   * GTIN
   * Serial
   * Lot
   * Expiry
3. Scan result is classified:

   * Match
   * Mismatch
   * Unresolved
4. Data is written to Supabase (`compliance_log`)
5. Result page displays scan output
6. History page retrieves persistent scan logs

---

## Database Schema (Supabase)

Table: `compliance_log`

| Field      | Type      | Description                   |
| ---------- | --------- | ----------------------------- |
| id         | uuid      | Primary key                   |
| created_at | timestamp | Auto timestamp                |
| gtin       | text      | Product identifier            |
| serial     | text      | Serialized unit               |
| lot        | text      | Batch number                  |
| expiry     | text      | Expiration date               |
| status     | text      | match / mismatch / unresolved |
| raw_scan   | text      | Original barcode string       |

---

## Development Rules

### MVP Scope Only

This project intentionally excludes:

* AI decision systems
* predictive analytics
* multi-tenant architecture
* enterprise scaling features

We only build:

> A fully working scan → database → history pipeline

---

### Branching Strategy

* `main` → production (Vercel live)
* `dev` → active development

Never commit directly to `main` without testing.

---

### Workflow

1. Create task in Trello
2. Implement in GitHub (`dev` branch)
3. UI built in v0 (if needed)
4. Deploy via Vercel
5. Test on real device
6. Merge to `main`

---

## Definition of Done

A feature is only complete when:

* It works in production (Vercel)
* Data is correctly stored in Supabase
* It passes mobile testing
* No runtime errors or broken flows

---

## Current Focus (MVP Phase)

We are currently building and validating:

* Scan input flow
* GS1 parsing logic
* Supabase write integration
* Result page accuracy
* History persistence

---

## Future Phases (Not in MVP)

After MVP stability is confirmed:

* AI-assisted validation
* anomaly detection
* compliance automation
* advanced audit reporting

---

## Philosophy

We prioritize:

* Simplicity over complexity
* Working systems over advanced systems
* Reliability over feature count
* End-to-end correctness over scalability design

---

## License

Internal SCANREC LLC system — not for public distribution.
* or make a **1-page “what to build first” cheat sheet**
* or tighten your Supabase + scan flow so everything actually connects cleanly end-to-end
