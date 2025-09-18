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

- `GET /product` → Get all products
- `GET /product/:id` → Get product by ID
- `POST /product/add` → Create new product
- `PATCH /product/:id` → Update product
- `DELETE /product/delete/:id` → Update product

### 📌 Categories

- `GET /category` → Get all categories
- `GET /category/:id` → Get category by ID
- `POST /category/add` → Create new category
- `PATCH /category/:id` → Update category
- `DELETE /category/delete/:id` → Update category

### 📌 Stock

- `GET /stock` → Get all stock entries
- `POST /stock` → Add stock for a product
- `PATCH /stock/:id` → Update stock

---

## 🛠️ Tech Stack

- **Node.js** – Backend runtime
- **Express.js** – REST API framework
- **MongoDB + Mongoose** – Database and schema modeling
- **dotenv** – Environment variable management
- **Nodemon** – Auto-reload during development

---
