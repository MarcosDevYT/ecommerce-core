# API Endpoints & Postman Examples

Base URL: `http://localhost:8080`

> **Note:** For protected routes (ADMIN), you must include the `Authorization` header with the Bearer token associated with an ADMIN user.
>
> 📲 **Importable Collection:** You can import [ECommerce_Cart_Orders.postman_collection.json](file:///c:/Users/olivi/OneDrive/Documentos/GitHub/ecommerce-core/ECommerce_Cart_Orders.postman_collection.json) directly into Postman for testing.

---

## 🔐 Auth

### Register (Email/Pass)

- **Method:** `POST`
- **Endpoint:** `/api/auth/register`
- **Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword",
    "name": "Normal User"
  }
  ```

### Login

- **Method:** `POST`
- **Endpoint:** `/api/auth/login`
- **Body:**
  ```json
  {
    "email": "admin@example.com",
    "password": "securepassword"
  }
  ```

### Get Current User (Me)

- **Method:** `GET`
- **Endpoint:** `/api/auth/me`
- **Headers:** `Authorization: Bearer <TOKEN>`

### Change User Role (Secret System Route)

- **Method:** `PATCH`
- **Endpoint:** `/api/auth/role`
- **Headers:** `x-admin-secret: <YOUR_ADMIN_SECRET_KEY>`
- **Body:**
  ```json
  {
    "email": "user@example.com",
    "role": "ADMIN"
  }
  ```

---

## 📂 Categories

### Create Category (Admin Only)

- **Method:** `POST`
- **Endpoint:** `/api/categories`
- **Headers:** `Authorization: Bearer <TOKEN>`
- **Body:**
  ```json
  {
    "name": "Zapatillas",
    "slug": "zapatillas"
  }
  ```

### Get All Categories (Public)

- **Method:** `GET`
- **Endpoint:** `/api/categories`

### Get Category By ID (Public)

- **Method:** `GET`
- **Endpoint:** `/api/categories/<ID>`

### Update Category (Admin Only)

- **Method:** `PUT`
- **Endpoint:** `/api/categories/<ID>`
- **Headers:** `Authorization: Bearer <TOKEN>`
- **Body:**
  ```json
  {
    "name": "Calzado Premium"
  }
  ```

### Delete Category (Admin Only)

- **Method:** `DELETE`
- **Endpoint:** `/api/categories/<ID>`
- **Headers:** `Authorization: Bearer <TOKEN>`

---

## 📦 Products

### Create Product (Admin Only)

- **Method:** `POST`
- **Endpoint:** `/api/products`
- **Headers:** `Authorization: Bearer <TOKEN>`
- **Body:**
  ```json
  {
    "name": "Nike Air Max",
    "slug": "nike-air-max-90",
    "description": "Zapatillas clásicas con amortiguación Air.",
    "price": 129.99,
    "categoryId": "<CATEGORY_ID>",
    "images": ["https://example.com/image.jpg"],
    "stock": 100,
    "isActive": true
  }
  ```

### Get All Products (Public)

- **Method:** `GET`
- **Endpoint:** `/api/products`
- **Query Params:** `?page=1&limit=10&search=nike&categoryId=<ID>&isActive=true`

### Get Product By Slug (Public)

- **Method:** `GET`
- **Endpoint:** `/api/products/<SLUG>`

### Update Product (Admin Only)

- **Method:** `PUT`
- **Endpoint:** `/api/products/<ID>`
- **Headers:** `Authorization: Bearer <TOKEN>`
- **Body:**
  ```json
  {
    "price": 99.99,
    "stock": 150,
    "isActive": false
  }
  ```

### Delete Product (Admin Only)

- **Method:** `DELETE`
- **Endpoint:** `/api/products/<ID>`
- **Headers:** `Authorization: Bearer <TOKEN>`

---

## 🛒 Cart (Authenticated)

### Add to Cart

- **Method:** `POST`
- **Endpoint:** `/api/cart`
- **Headers:** `Authorization: Bearer <TOKEN>`
- **Body:**
  ```json
  {
    "productId": "<PRODUCT_ID>",
    "quantity": 2
  }
  ```

### Get Cart

- **Method:** `GET`
- **Endpoint:** `/api/cart`
- **Headers:** `Authorization: Bearer <TOKEN>`
- **Note:** Real-time data (name, price, images) is fetched from the database.

### Update Item Quantity

- **Method:** `PUT`
- **Endpoint:** `/api/cart/<PRODUCT_ID>`
- **Headers:** `Authorization: Bearer <TOKEN>`
- **Body:**
  ```json
  {
    "quantity": 5
  }
  ```

### Remove Item

- **Method:** `DELETE`
- **Endpoint:** `/api/cart/<PRODUCT_ID>`
- **Headers:** `Authorization: Bearer <TOKEN>`

### Clear Cart

- **Method:** `DELETE`
- **Endpoint:** `/api/cart`
- **Headers:** `Authorization: Bearer <TOKEN>`

---

## 🧾 Orders (Authenticated)

### Checkout (Create Order from Cart)

- **Method:** `POST`
- **Endpoint:** `/api/orders`
- **Headers:** `Authorization: Bearer <TOKEN>`

### My Order History

- **Method:** `GET`
- **Endpoint:** `/api/orders`
- **Headers:** `Authorization: Bearer <TOKEN>`

### Get Order Details

- **Method:** `GET`
- **Endpoint:** `/api/orders/<ORDER_ID>`
- **Headers:** `Authorization: Bearer <TOKEN>`
