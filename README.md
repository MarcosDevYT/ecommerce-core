# Ecommerce Core Backend

A high-performance, minimalist, and scalable headless ecommerce backend built with **Bun**, **Hono**, and **Prisma**.

## 🚀 Features

- **Authentication**: JWT-based auth with Google OAuth support and local email/password reset.
- **Database**: PostgreSQL (Neon) with Prisma ORM for type-safe queries.
- **Caching**: Redis (Upstash) for session management and performance.
- **Payments**: Full Stripe integration with webhook handling.
- **Email**: Hybrid service supporting Resend (production) and Nodemailer (development).
- **Design**: Premium minimalist email templates with Inter font.
- **API**: Modern Hono framework and Zod validation.

---

## 🛠 Prerequisites

- [Bun](https://bun.sh) installed (recommended runtime).
- PostgreSQL Database (e.g., [Neon.tech](https://neon.tech)).
- Redis Instance (e.g., [Upstash](https://upstash.com)).
- Stripe Account.
- Google Cloud Project (for OAuth).

---

## ⚙️ Initial Setup

### 1. Clone the repository

```bash
git clone https://github.com/MarcosDevYT/ecommerce-core.git
cd ecommerce-core
```

### 2. Install dependencies

```bash
bun install
```

### 3. Environment Configuration

Copy the `.env.example` file and fill in your credentials:

```bash
cp .env.example .env
```

_Make sure to set `DATABASE_URL`, `REDIS_URL`, and your Stripe/Google keys._

### 4. Database Setup

Push the schema to your database and generate the Prisma client:

```bash
bun prisma db push
bun prisma generate
```

---

## 🏃 Running the Project

### Development Mode

```bash
bun dev
```

The server will start at `http://localhost:4000` (default Hono port or as configured).

### Production Mode

```bash
bun start
```

---

## 📡 API Endpoints

Brief overview of available resource groups:

- `/api/auth`: Login, Register, Google OAuth, Password Reset.
- `/api/products`: CRUD operations for products.
- `/api/categories`: Category management.
- `/api/cart`: User shopping cart management.
- `/api/orders`: Order placement and history.
- `/api/payments`: Stripe integration and webhooks.
- `/api/reviews`: Product ratings and reviews.
- `/api/analytics`: Sales and activity tracking (Admin only).

---

## 🧪 Testing

For manual API testing, use the provided Postman collection or check `API_EXAMPLES.md`.

For testing emails in development, the project defaults to **Nodemailer** with Ethereal support. Check the logs for the Ethereal preview URL when sending emails.

---

## 📄 License

MIT
