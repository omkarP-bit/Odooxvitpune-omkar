# Reimbursement Management Backend

## Current Implementation Scope

Implemented in this repo:

- Company-first onboarding (`company-signup`) with auto admin creation
- Country-to-currency resolution during company onboarding
- JWT-based auth and role-based access control
- Admin-managed users (manager/employee/finance/director/cfo)
- Manager assignment for employees
- Expense submission by employees
- Duplicate expense detection
- Currency normalization into company default currency
- OCR parser stub from raw receipt text
- Multi-step approvals with sequence enforcement
- Configurable approval rules (manager approver + additional roles + conditional rules)
- SLA due-time generation per approval step

Not fully implemented yet:

- Full OAuth provider integration (Google auth flow)
- Real OCR engine integration (currently parser stub)
- Notification module (email/push)
- Advanced reporting dashboards

## Tech Stack

- Node.js + Express
- PostgreSQL (`pg`)
- JWT (`jsonwebtoken`)
- Password hashing (`bcryptjs`)
- UUID public IDs (`uuid`)

## Project Structure

```
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

## Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Create/update `backend/.env`:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=admin
DB_NAME=postgres
JWT_SECRET=change_this_secret
ADMIN_NAME=System Admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123
ADMIN_COMPANY_NAME=Default Company
ADMIN_COUNTRY=India
```

### 3. Run Server

```bash
cd backend
npm run start
```

For development:

```bash
cd backend
npm run dev
```

## Base URL

`http://localhost:5000`

## Authentication

Use header for protected routes:

`Authorization: Bearer <JWT_TOKEN>`

## API Endpoints

### Health

#### GET /

- Purpose: Health check
- Auth: No

---

### Auth Module

#### POST /api/auth/company-signup

- Purpose: Create a new company and its first admin user
- Auth: No
- Body:

```json
{
  "companyName": "Acme Pvt Ltd",
  "country": "India",
  "adminName": "Admin User",
  "email": "admin@acme.com",
  "password": "Admin@123"
}
```

#### POST /api/auth/login

- Purpose: Login user
- Auth: No
- Body:

```json
{
  "email": "admin@acme.com",
  "password": "Admin@123"
}
```

#### GET /api/auth/me

- Purpose: Get current logged-in user profile
- Auth: Yes

#### GET /api/auth/users

- Purpose: List company users
- Auth: Yes (admin only)

#### POST /api/auth/users

- Purpose: Admin creates users in own company
- Auth: Yes (admin only)
- Body:

```json
{
  "name": "Employee One",
  "email": "employee@acme.com",
  "password": "Pass@123",
  "role": "employee",
  "managerId": "optional-manager-public-id"
}
```

Allowed roles to create:

- `manager`
- `employee`
- `finance`
- `director`
- `cfo`

#### PATCH /api/auth/users/:userId/role

- Purpose: Admin changes role of a company user
- Auth: Yes (admin only)
- Body:

```json
{
  "role": "manager"
}
```

#### PATCH /api/auth/users/:userId/manager

- Purpose: Admin assigns manager to user
- Auth: Yes (admin only)
- Body:

```json
{
  "managerId": "manager-public-id"
}
```

---

### Expense Module

#### POST /api/expenses

- Purpose: Employee submits an expense
- Auth: Yes (`employee` only)
- Body:

```json
{
  "amount": 100,
  "currency": "USD",
  "category": "Food",
  "description": "Team lunch",
  "date": "2026-03-29",
  "receiptText": "Restaurant ABC\nTotal: 100"
}
```

Behavior:

- Parses receipt text (OCR stub)
- Detects possible duplicates (same employee + amount + currency + date + category)
- Converts amount to company currency
- Generates approval workflow steps automatically

#### GET /api/expenses/my

- Purpose: List requesting user's expenses
- Auth: Yes (`employee`, `manager`, `admin`, `finance`, `director`, `cfo`)

---

### Approval Module

#### PUT /api/approvals/rules

- Purpose: Configure approval rules for a company
- Auth: Yes (admin only)
- Body:

```json
{
  "isManagerApprover": true,
  "additionalApproverRoles": ["finance", "director"],
  "percentageThreshold": 60,
  "specificApproverRole": "cfo"
}
```

Rule options:

- Manager first approver toggle
- Additional role-based approvers
- Percentage threshold approval (e.g., 60%)
- Specific approver role can auto-satisfy approval condition

#### GET /api/approvals/pending

- Purpose: List pending approvals for approver
- Auth: Yes (`manager`, `admin`, `finance`, `director`, `cfo`)

#### POST /api/approvals/:expenseId/decision

- Purpose: Approve or reject assigned expense step
- Auth: Yes (`manager`, `admin`, `finance`, `director`, `cfo`)
- Body:

```json
{
  "decision": "approved",
  "comments": "Looks good"
}
```

Notes:

- Only the current sequence step can decide
- Earlier steps must be completed first
- Final expense status becomes `approved` or `rejected` based on rule engine outcome

## Role Permissions (Current)

- Admin:
  - Create users
  - Change roles
  - Assign managers
  - Configure approval rules
  - View users
- Employee:
  - Submit expenses
  - View own expenses
- Manager/Finance/Director/CFO/Admin (Approver roles):
  - View pending approvals
  - Approve/reject assigned expenses

## Default Seed Behavior

On server startup:

- Tables are created if missing
- A default company/admin can be bootstrapped from env values
- Default approval rule is upserted for seed company

## Hackathon Commit Breakdown

Feature branch history was intentionally split into review-friendly commits:

1. `feat(core): add postgres schema and bootstrap initialization`
2. `feat(auth): add company signup and admin user management`
3. `feat(expense): add submission, OCR parsing, and FX normalization`
4. `feat(approval): add rule-driven multi-step approval workflow`
5. `feat(api): wire modular routes and global error handler`

## Quick Demo Flow

1. Company signup (creates admin)
2. Admin login
3. Admin creates manager + employee
4. Admin assigns manager to employee
5. Admin configures approval rule
6. Employee submits expense
7. Manager checks pending approvals
8. Manager approves/rejects expense

## Future Enhancements

- Google OAuth integration
- Real OCR provider integration
- SLA escalations and reminders
- Notification module (email/WhatsApp/Slack)
- Expense attachments storage
- Better duplicate/fraud detection signals
- Company-wide expense analytics and exports
