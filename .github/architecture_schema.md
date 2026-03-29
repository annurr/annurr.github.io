# Annurr Portfolio & Blog - Architecture Schema

This project is a dynamic portfolio and blog management system designed to be lightweight but robust.

## 1. Core Technologies
- **Frontend Hosting:** GitHub Pages
- **Backend & Database:** Supabase (PostgreSQL)
- **Frontend Stack:** Vanilla HTML, CSS, JavaScript (No heavy JS frameworks)
- **External Libraries:** DOMPurify (Sanitization), Math.js (Calculator Computation)
- **Public APIs:** Aladhan API (Prayer Time Fetching)

## 2. Architecture Diagram

[ Frontend (GitHub Pages) ]
  |-- index.html : Main portfolio page. Dynamically fetches its text and layout configuration from Supabase.
  |-- blog.html  : Public blog page. Fetches and displays published blog posts from the database.
  |-- tools.html : Public and premium toolkit. The premium section is gated by active admin JWT check.
  |-- admin.html : Secure dashboard to manage posts, edit homepage config, and view frontend audit logs.
  |-- /assets    : Static files, schemas, and icons.
  |-- /js & /css : Scripts and stylesheets for application logic and UI.

       |  (REST API / fetch via supabase-js or standard HTTP requests)
       v

# Architecture Schema
[Frontend: GitHub Pages | Backend: Supabase/PostgreSQL]

## 1. Tables & RLS Policies
- `blog_posts` 
  - (PK: `id`, cols: `title`, `excerpt`, `content`, `image`, `tags`, `deleted`, `created_at`, `updated_at`)
  - RLS: Public=SELECT, Admin=ALL
- `homepage_config`
  - (PK: `id`='global_config_v1', cols: `config`, `updated_at`)
  - RLS: Public=SELECT, Admin=ALL
- `audit_logs`
  - (PK: `id`, cols: `event_type`, `description`, `actor`, `created_at`)
  - RLS: Admin=SELECT, INSERT
- `heartbeat_logs`
  - (PK: `id`, cols: `created_at`)
  - RLS: Admin=SELECT
- `github_action_logs`
  - (PK: `id`, cols: `status`, `error_message`, `created_at`)
  - RLS: Admin=SELECT, Anon=INSERT

## 2. Keep-Alive Workflows
- **GitHub Action** (`.github/workflows/keep_alive.yml`)
  - cron: `0 0 * * *`
  - ping: `GET /rest/v1/`
  - log: `POST /rest/v1/github_action_logs` (using Anon key).
- **pg_cron Heartbeat**
  - cron: `0 0 * * *`  
  - job: `INSERT INTO public.heartbeat_logs (created_at) VALUES (NOW());`
  - System `postgres` role bypasses RLS for insertion.

## 3. UI Component Lifecycle
- **Tab Manager:** `admin.html` orchestrates view states (e.g. `audit-log-view`, `system-monitor-view`) using `setActiveTab()`. Prior to rendering the new active tab, all sibling components are hidden via `display: none` to prevent DOM attachment leakage/overlapping across states.
