# MarketFlow API
`https://market-flow-pi.vercel.app`
MarketFlow is a multi-vendor marketplace backend where buyers can purchase products from multiple vendors, while vendors can manage products, orders, payouts, and reviews.

## API Endpoints

### 🔐 Auth

| Feature        | Method | Endpoint             |
| -------------- | ------ | -------------------- |
| Register       | POST   | `/auth/register`     |
| Login          | POST   | `/auth/login`        |
| Get Me         | GET    | `/auth/me`           |
| Email Verify   | POST   | `/auth/email-verify` |
| Refresh Token  | POST   | `/auth/refresh`      |
| Logout         | POST   | `/auth/logout`       |
| Update Me      | PATCH  | `/auth/me`           |
| Delete Account | DELETE | `/auth/me`           |

---

### 🏪 Vendor

| Feature                | Method | Endpoint                         |
| ---------------------- | ------ | -------------------------------- |
| Apply as Seller        | POST   | `/vendors/apply`                 |
| Get Own Balance        | GET    | `/vendors/balance`               |
| Get Own Payout History | GET    | `/vendors/payouts`               |
| Update SubOrder Status | PATCH  | `/sub-orders/:subOrderId/status` |

---

### 👑 Admin

| Feature                     | Method | Endpoint                  |
| --------------------------- | ------ | ------------------------- |
| Get All Seller Applications | GET    | `/admin/vendors`          |
| Get Pending Sellers         | GET    | `/admin/vendors/pending`  |
| Get Suspended Sellers       | GET    | `/admin/vendors/suspend`  |
| Get Approved Sellers        | GET    | `/admin/vendors/approved` |
| Approve Seller              | PATCH  | `/admin/vendors/:id`      |
| Suspend Seller              | PATCH  | `/admin/vendors/:id`      |

---

### 📂 Category

| Feature            | Method | Endpoint          |
| ------------------ | ------ | ----------------- |
| Create Category    | POST   | `/categories`     |
| Get All Categories | GET    | `/categories`     |
| Update Category    | PATCH  | `/categories/:id` |
| Delete Category    | DELETE | `/categories/:id` |

---

### 📦 Product

| Feature           | Method | Endpoint               |
| ----------------- | ------ | ---------------------- |
| Create Product    | POST   | `/products`            |
| Get All Products  | GET    | `/products`            |
| Get Product by ID | GET    | `/products/:id` |
| Get My Products   | GET    | `/products/me`         |
| Update Product    | PATCH  | `/products/:id` |
| Delete Product    | DELETE | `/products/:id` |

---

### 🛒 Cart

| Feature          | Method | Endpoint          |
| ---------------- | ------ | ----------------- |
| Add to Cart      | POST   | `/cart/items`     |
| Get Cart         | GET    | `/cart`           |
| Update Cart Item | PATCH  | `/cart/items/:productId` |
| Delete Cart Item | DELETE | `/cart/items/:productId` |
| Clear Cart       | DELETE | `/cart`           |

---

### 🧾 Order

| Feature                  | Method | Endpoint                  |
| ------------------------ | ------ | ------------------------- |
| Create Order + Pay Now   | POST   | `/orders/checkout`        |
| Get My Orders            | GET    | `/orders`                 |
| Get Order by ID          | GET    | `/orders/:id`             |
| Create Order + Pay Later | POST   | `/orders/product-with-pay-later` |
| Initiate Payment         | POST   | `/initiate-payment/:orderId`   |

---

### ⭐ Review

| Feature       | Method | Endpoint       |
| ------------- | ------ | -------------- |
| Create Review | POST   | `/reviews`     |
| Get Review    | GET    | `/reviews/:id` |
| Update Review | PATCH  | `/reviews/:id` |
| Delete Review | DELETE | `/reviews/:id` |

## Authentication

Protected endpoints require authentication using the access token.

Example:

```http
Authorization: Bearer <access_token>
```

### User Roles

* **BUYER** — Browse products, manage cart, create orders and reviews.
* **SELLER** — Manage own products, process sub-orders, view balance and payout history.
* **ADMIN** — Manage seller applications and seller status.

## Order & Payment Flow

```text
Buyer
  ↓
Add Products to Cart
  ↓
Checkout
  ↓
Order Created
  ↓
Order Split into SubOrders
  ↓
Stripe Payment
  ↓
Stripe Webhook
  ↓
SubOrders Confirmed
  ↓
Payout Job Added to Queue
  ↓
BullMQ Worker
  ↓
Vendor Payout
  ↓
Vendor Balance Updated
```

## Verified Review Flow

A buyer can review a product only after purchasing that product and completing the corresponding sub-order.

```text
Purchase Product
      ↓
SubOrder
      ↓
DELIVERED
      ↓
Create Review
      ↓
Verified Purchase
```



## 🚀 Project Setup

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd marketflow
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

Create a `.env` file in the project root:

```env
PORT=5000

DATABASE_URL="your_database_url"

JWT_ACCESS_SECRET="your_access_secret"
JWT_REFRESH_SECRET="your_refresh_secret"

JWT_ACCESS_EXPIRES_IN="your_access_token_expiry"
JWT_REFRESH_EXPIRES_IN="your_refresh_token_expiry"

REDIS_URL="your_redis_url"

STRIPE_SECRET_KEY="your_stripe_secret_key"
STRIPE_WEBHOOK_SECRET="your_stripe_webhook_secret"

FRONTEND_URL="your_frontend_url"
```

> Never commit the `.env` file to GitHub.

Add it to `.gitignore`:

```gitignore
.env
.env.*
!.env.example
```

For other developers, create an `.env.example` file containing the variable names but not the real secrets.

---

## 🗄️ Database Setup

After configuring `DATABASE_URL`, run the Prisma migration:

```bash
npx prisma migrate dev
```

Generate the Prisma Client:

```bash
npx prisma generate
```

To inspect the database using Prisma Studio:

```bash
npx prisma studio
```

---

## ▶️ Run the Application

### Development

```bash
npm run dev
```

The API will run on:

```text
http://localhost:5000
```

### Production Build

```bash
npm run build
```

Then:

```bash
npm start
```

---

## 🔴 Redis Setup

MarketFlow uses Redis for:

* Product caching
* Cache invalidation
* BullMQ job processing
* Payout queue

Make sure Redis is running and the `REDIS_URL` is correctly configured.

Example:

```env
REDIS_URL="redis://localhost:6379"
```

---

## ⚙️ BullMQ Payout Worker

The payout worker processes vendor payout jobs asynchronously.

Start the worker according to the project's worker entry point:

```bash
npm run worker
```

Worker flow:

```text
Stripe Webhook
      ↓
Payout Queue
      ↓
BullMQ
      ↓
Payout Worker
      ↓
Create Payout
      ↓
Update SubOrder
      ↓
Increment Vendor Balance
```

The payout worker is designed to be **idempotent**, so the same payout should not increase the vendor balance more than once.

---

## 💳 Stripe Webhook

For local development, Stripe CLI can forward webhook events to the API.

Example:

```bash
stripe listen --forward-to localhost:5000/<your-webhook-route>
```

Copy the generated webhook signing secret into:

```env
STRIPE_WEBHOOK_SECRET="your_webhook_secret"
```

The webhook is responsible for handling successful and failed payment events.

Successful payment flow:

```text
Stripe Checkout
      ↓
checkout.session.completed
      ↓
Verify Webhook Signature
      ↓
Update Payment
      ↓
Confirm Order
      ↓
Confirm SubOrders
      ↓
Add Payout Jobs
```

---

## 🔐 Security

MarketFlow implements:

* JWT authentication
* Role-based access control
* Seller ownership validation
* Buyer ownership validation
* Request validation with Zod
* Stripe webhook signature verification
* Transaction-based order creation
* Atomic stock decrement
* Idempotent payout processing
* Verified-purchase reviews
* Protected vendor balance and payout history

---

## 🧪 Testing

Before deployment, verify the following:

* Authentication and authorization
* Seller approval/rejection
* Product ownership
* Cart operations
* Multi-vendor checkout
* Stock concurrency
* Transaction rollback
* Stripe payment
* Stripe webhook idempotency
* Payout job retry
* Payout worker idempotency
* Vendor balance
* Fulfillment status transitions
* Verified reviews
* Duplicate reviews
* Unauthorized resource access

---

## 📌 Important Notes

### Money

All monetary values are stored as integer values to avoid floating-point precision problems.

### Transactions

Order creation and inventory changes are handled using database transactions to maintain consistency.

### Payout Idempotency

A payout is claimed using the sub-order's payout status before updating the vendor balance. This prevents duplicate payout processing.

### Multi-vendor Orders

A single buyer checkout can contain products from multiple vendors. The system splits the checkout into separate `SubOrder` records for each vendor.
