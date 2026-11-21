# Inventory and Data Management System

Backend assignment built with Node.js, Express.js, MongoDB, Mongoose and dotenv.

## 1. Requirements

- Node.js
- MongoDB running locally, or a MongoDB Atlas connection string
- Postman (for API testing)

## 2. Setup

Open a terminal in this folder and run:

```bash
npm install
```

Copy `.env.example` to a new file named `.env`, then set your MongoDB connection string:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/inventoryDB
```

For MongoDB Atlas, replace the local URI with your Atlas connection string.

Start the application:

```bash
npm run dev
```

The server starts at `http://localhost:5000`.

## 3. API endpoints

Base URL: `http://localhost:5000/api/products`

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/` | Create a product |
| GET | `/` | Get products with filters, sorting and pagination |
| GET | `/low-stock` | Get products at or below their reorder level |
| GET | `/summary` | Category-wise inventory aggregation |
| PATCH | `/:id/stock` | Increase/decrease stock |
| GET | `/:id` | Get one product |
| PUT | `/:id` | Update product details |
| DELETE | `/:id` | Delete a product |

## 4. Example requests

### Create product — POST `/api/products`

```json
{
  "name": "Laptop",
  "sku": "ELEC-LAP-101",
  "category": "Electronics",
  "price": 50000,
  "quantity": 10,
  "reorderLevel": 5,
  "supplier": "Dell India"
}
```

### Filter, sort and paginate — GET

```text
/api/products?category=Electronics&sort=price&order=asc&page=1&limit=10
```

Other query examples:

```text
/api/products?search=laptop
/api/products?minPrice=500&maxPrice=5000
```

### Update product — PUT `/api/products/PRODUCT_ID`

```json
{
  "price": 55000,
  "quantity": 12
}
```

### Adjust stock — PATCH `/api/products/PRODUCT_ID/stock`

Increase stock:

```json
{
  "change": 10
}
```

Decrease stock:

```json
{
  "change": -3
}
```

## 5. Notes

- MongoDB creates the `inventoryDB` database and collection when the first product is inserted.
- Never share or commit your real `.env` file.
- The stock adjustment endpoint rejects a decrease that would make quantity negative.
- The low-stock report treats quantity equal to reorder level as low stock.
