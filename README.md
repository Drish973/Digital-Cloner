# Digital Clone

A living dossier for the digital you.

Digital Clone is a stylized OSINT-inspired workspace that turns public signals into a visual, interactive map of risk. Instead of presenting a dry audit report, it gives you a cinematic view of a person’s footprint across GitHub, LinkedIn, websites, and uploaded documents — then helps you explore how that footprint could be exploited.

## What it does

This project lets you:

- scan a person’s public digital trail from a simple form
- inspect a structured risk dashboard with findings, logs, and summaries
- switch between analyst, manager, and admin perspectives
- explore a graph-style view of relationships and exposure paths
- replay attack scenarios and compare scan outcomes
- simulate risk-reduction actions like removing exposed email, enabling MFA, or hiding sensitive details

In short: it turns scattered online breadcrumbs into a readable, almost forensic portrait of digital exposure.

## The vibe

Think of it as part of a cyber-investigation lab, a threat modeling studio, and a design prototype all rolled into one.

You are not just reading a report — you are stepping into a control room for digital identity risk.

## Tech stack

- Frontend: React + TypeScript + Vite
- UI libraries: React Flow, Tailwind CSS, Lucide icons
- Backend: Python service expected to expose the API endpoints used by the frontend
- Data layer: local SQLite-backed storage is used in the current implementation

## Project structure

- frontend/ — the interactive React experience
- backend/ — the API layer and persistence logic
- docs/ — supporting notes and project material

## Run locally

### 1) Frontend

```bash
cd frontend
npm install
npm run dev
```

The app is designed to talk to a backend service running on localhost:8000.

### 2) Backend

Start your backend API service so the frontend can reach the endpoints it expects, including:

- /api/scan
- /api/scans
- /api/upload-resume
- /api/admin/stats
- /api/admin/reset

If your backend is running correctly, the UI will load and begin interacting with it normally.

## What to expect

When you launch the app, you’ll see a dashboard that feels less like a traditional app and more like a threat intelligence console. You can enter a target profile, trigger a scan, and watch the system build a narrative around their public footprint.

## Why this exists

The goal is simple: make digital exposure visible.

Not as a wall of raw data, but as something understandable, interactive, and actionable.

## License

This project is intended for experimentation and demonstration purposes.
