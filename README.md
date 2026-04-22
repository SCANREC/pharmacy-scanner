SCANREC — MVP Pharmacy Scan System

SCANREC is a minimal pharmacy barcode scanning system designed to capture and store raw scan data for later review.

This is an MVP focused only on reliable scan capture and database persistence.

Core Purpose

The system follows a simple, reliable flow:

Scan → Store → Display History

It captures raw barcode or DataMatrix scan strings and stores them in Supabase. No parsing, validation, or compliance logic is included in the MVP.

Tech Stack
Next.js (App Router)
TypeScript
Tailwind CSS
Supabase (database)
Vercel (deployment)
GitHub (version control)
System Flow
User performs a scan (camera or simulated input)
Raw scan string is captured by the frontend
Scan is written directly to Supabase
Dashboard retrieves and displays scan history
Database Schema (Supabase)

Table: scans

Field	Type	Description
id	uuid	Primary key
created_at	timestamptz	Auto-generated timestamp
raw_scan	text	Raw barcode / DataMatrix string
Development Rules
MVP Scope Only

This system intentionally stays minimal:

We only build:

Scan input capture
Supabase storage
Scan history display

We do NOT build:

GS1 parsing
DSCSA compliance logic
GTIN/lot/expiry extraction
validation or classification systems
Workflow
Create task in Trello
Implement feature in dev branch
Test locally and on mobile
Deploy to Vercel
Validate end-to-end flow
Merge into main
Definition of Done

A feature is complete only when:

Scan data is stored in Supabase
Data appears in dashboard correctly
Works on mobile devices
No runtime errors in scan flow
Current MVP Focus

We are currently building:

Scan input interface
Supabase write integration
Scan history dashboard
Future Phases (Not in MVP)

After MVP stability is confirmed:

GS1 barcode parsing
DSCSA compliance validation
structured product fields (GTIN, serial, lot, expiry)
audit and reporting systems
Philosophy

We prioritize:

Simplicity over complexity
Working systems over perfect systems
End-to-end functionality over feature depth
Stability before intelligence
License

Internal SCANREC LLC system — not for public distribution.
