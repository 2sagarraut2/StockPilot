# 📦 StockPilot

StockPilot is a modern backend application built with **Node.js**, **Express**, and **MongoDB** to streamline product, stock, and category tracking.  
It focuses on clean APIs, production-ready code, and scalability — perfect for learning and showcasing backend development skills.

---

## ✨ Features

- 🔹 **Product Management** – Add, update, and manage products with categories and SKU.
- 🔹 **Stock Tracking** – Maintain stock levels per product with CRUD operations.
- 🔹 **Category Management** – Organize products into categories for better structure.
- 🔹 **Soft Delete Support** – `active` flag to safely disable records instead of deleting.
- 🔹 **REST APIs** – Built using Express.js with industry-standard practices.
- 🔹 **Mongoose ODM** – Schema-based data modeling with validations.

---

## 🗂️ API Endpoints

### 📌 Products

- `GET /product/get` → Get all products
- `GET /product/:id` → Get product by ID
- `POST /product/add` → Create new product
- `PATCH /product/:id` → Update product

### 📌 Stock

- `GET /product/stock` → Get all stock entries
- `POST /product/stock` → Add stock for a product
- `PATCH /product/stock/:id` → Update stock

### 📌 Categories

- `GET /category` → Get all categories
- `GET /category/:id` → Get category by ID
- `POST /category/add` → Create new category
- `PATCH /category/:id` → Update category

---

## 🛠️ Tech Stack

- **Node.js** – Backend runtime
- **Express.js** – REST API framework
- **MongoDB + Mongoose** – Database and schema modeling
- **dotenv** – Environment variable management
- **Nodemon** – Auto-reload during development

---
