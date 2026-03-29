# Reimbursement Management Backend

Node.js and PostgreSQL backend for multi-company reimbursement workflows with role-based access, dynamic approval sequencing, and currency normalization.

## Current Highlights

- Company-first onboarding with admin auto-creation
- JWT auth and role-based access control
- Company-scoped user management and manager mapping
- Expense submission with duplicate detection and currency conversion
- OCR text parsing stub for receipt extraction
- Explicit approval sequencing with role slots per step
- Hybrid per-step decision logic (all, percentage, specific, hybrid)
- SLA hours per approval step
- CORS enabled for local frontend testing

## Tech Stack

- Node.js + Express
- PostgreSQL via pg
- JWT via jsonwebtoken
- Password hashing via bcryptjs
- UUID public IDs via uuid
- CORS middleware via cors

## Repository Structure

```text
backend/
  server.js
  package.json
  .env
  src/
    app.js
    routes/
      index.js
    config/
      db.js
      initDb.js
    middleware/
      authMiddleware.js
      errorMiddleware.js
    models/
      companyModel.js
      userModel.js
      expenseModel.js
      approvalModel.js
      approvalRuleModel.js
    modules/
      auth/
      expense/
      approval/
    utils/
      countryCurrency.js
      currency.js
      ocr.js
```

## Environment Setup

1. Install dependencies

```bash
cd backend
npm install
```

2. Configure backend environment in backend/.env

```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=admin
DB_NAME=postgres
JWT_SECRET=change_this_secret
FRONTEND_ORIGIN=http://localhost:5173
ADMIN_NAME=System Admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123
ADMIN_COMPANY_NAME=Default Company
ADMIN_COUNTRY=India
```

3. Run backend

```bash
cd backend
npm run start
```

Development mode

```bash
cd backend
npm run dev
```

## CORS

Backend allows browser requests from the origin in FRONTEND_ORIGIN. Default is http://localhost:5173.

## API Base URL

http://localhost:5000

## Auth Header

Authorization: Bearer <JWT_TOKEN>

## API Endpoints

### Health

- GET /

### Auth Module

- POST /api/auth/company-signup

Request body:

```json
{
  "companyName": "Acme Pvt Ltd",
  "country": "India",
  "adminName": "Admin User",
  "email": "admin@acme.com",
  "password": "Admin@123"
}
```

- POST /api/auth/login

Request body:

```json
{
  "email": "admin@acme.com",
  "password": "Admin@123"
}
```

- GET /api/auth/me (auth required)
- GET /api/auth/users (admin only)

- POST /api/auth/users (admin only)

Request body:

```json
{
  "name": "Employee One",
  "email": "employee@acme.com",
  "password": "Pass@123",
  "role": "employee",
  "managerId": "optional-manager-public-id"
}
```

Creatable roles: manager, employee, finance, director, cfo

- PATCH /api/auth/users/:userId/role (admin only)

```json
{
  "role": "manager"
}
```

- PATCH /api/auth/users/:userId/manager (admin only)

```json
{
  "managerId": "manager-public-id"
}
```

### Expense Module

- POST /api/expenses (employee only)

Request body:

```json
{
  "amount": 100,
  "currency": "USD",
  "category": "Travel",
  "description": "Cab",
  "date": "2026-03-29",
  "receiptText": "Restaurant ABC\nTotal: 100"
}
```

Behavior:

- OCR parser runs on receiptText
- Duplicate detection checks key fields
- Amount is normalized into company currency
- Approval workflow steps are generated from configured rule

- GET /api/expenses/my (employee, manager, admin, finance, director, cfo)

### Approval Module

- PUT /api/approvals/rules (admin only)

Preferred explicit step payload:

```json
{
  "steps": [
    {
      "sequenceNo": 1,
      "roleSlots": ["manager"],
      "conditionType": "all",
      "slaHours": 24
    },
    {
      "sequenceNo": 2,
      "roleSlots": ["finance"],
      "conditionType": "all",
      "slaHours": 24
    },
    {
      "sequenceNo": 3,
      "roleSlots": ["director"],
      "conditionType": "hybrid",
      "percentageThreshold": 60,
      "specificApproverRole": "cfo",
      "slaHours": 24
    }
  ]
}
```

Legacy payload is still supported and auto-converted to steps:

```json
{
  "isManagerApprover": true,
  "additionalApproverRoles": ["finance", "director"],
  "percentageThreshold": 60,
  "specificApproverRole": "cfo"
}
```

Condition types per step:

- all: every approver in the step must approve
- percentage: step approved when threshold is met
- specific: step approved when specific role approves
- hybrid: percentage OR specific role approval

- GET /api/approvals/pending (manager, admin, finance, director, cfo)

- POST /api/approvals/:expenseId/decision (manager, admin, finance, director, cfo)

```json
{
  "decision": "approved",
  "comments": "Looks good"
}
```

Decision rules:

- Only assigned approver can decide
- Out-of-order decisions are blocked by sequence
- Workflow state stays pending until all required steps/conditions pass
- Workflow becomes rejected immediately on a rejecting decision in a step

## Default Seed Behavior

On startup:

- Schema and tables are created if missing
- Seed company and admin are ensured
- Default step rule is upserted:
  - Step 1 manager (all)
  - Step 2 finance (all)
  - Step 3 director (hybrid: 60 percent OR cfo)

## Current Role Permissions

- Admin: company user management, role changes, manager assignment, rule configuration
- Employee: submit expenses and view own expense list
- Manager or Admin or Finance or Director or CFO: view pending approvals and decide

## Local Frontend Testing

This repository currently tracks only backend and README.

If you run a separate local frontend, keep its origin aligned with FRONTEND_ORIGIN in backend environment.

## Known Not-Yet-Implemented Items

- OAuth provider login flow
- Production OCR provider integration
- Notification module
- Advanced dashboards and reporting
