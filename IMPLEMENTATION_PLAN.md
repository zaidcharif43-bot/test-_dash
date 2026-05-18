# Intelligent Dashboard - Implementation Plan

## 1) Frontend (done as starter)
- Next.js App Router + TypeScript + Tailwind
- Main shell: Sidebar + KPI + Analytics + Kanban + Workflows + Notifications
- Next step: convert static sections into reusable components under `src/components`

## 2) Backend API
Recommended stack:
- Next.js Route Handlers or NestJS (if you want strict module architecture)
- PostgreSQL + Prisma ORM
- Redis (queues + cache + realtime counters)
- BullMQ for automations and scheduled jobs

Core modules:
- Auth + RBAC (Admin, Manager, CM, Client, Designer, Sales)
- Clients/Leads
- Publications + Editorial calendar
- Campaigns + Budgets + ROI
- Tasks + Assignation + Deadlines
- Workflows (trigger/action engine)
- Notifications (in-app + email + WhatsApp)
- Unified inbox connectors
- Analytics aggregation

## 3) Realtime Layer
- WebSocket (Socket.IO) for:
  - New messages
  - KPI live updates
  - Workflow execution events
  - Notification stream

## 4) Integrations
- Meta APIs (Instagram/Facebook)
- LinkedIn API
- TikTok API (if available for your use case)
- WhatsApp Business API
- Email provider (Resend/SendGrid)

## 5) Suggested database entities
- users, roles, permissions
- clients, leads
- social_accounts
- publications, publication_status, publication_assets
- campaigns, campaign_metrics
- tasks, task_comments
- workflows, workflow_runs
- notifications
- messages, conversations
- analytics_daily

## 6) Security and operations
- JWT + refresh tokens + session revocation
- Per-role route guards
- Audit logs on sensitive actions
- Rate limiting on public endpoints
- Sentry + structured logs + backups

## 7) Delivery phases
1. Auth + RBAC + base layout
2. Clients + Leads + Tasks
3. Publications + Calendar
4. Campaigns + Analytics dashboards
5. Workflow automation engine
6. Inbox + connectors
7. Hardening + observability + CI/CD
