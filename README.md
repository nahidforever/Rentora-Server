# 🚀 Rentora Server

> Backend REST API for **Rentora — Your Next Home Awaits**

A secure, scalable, and role-based backend powering the **Rentora Property Rental & Booking Platform**. Built with **Node.js**, **Express.js**, **MongoDB Atlas**, **Better Auth**, and **JOSE JWT Verification** to provide secure authentication, property management, booking workflows, payment processing, dashboard analytics, and administrative moderation.

## 🌐 Links

- **Live API:** https://rentora-server-three.vercel.app/
- **Client Repository:** https://github.com/nahidforever/Rentora-Client
- **Server Repository:** https://github.com/nahidforever/Rentora-Server

# 📖 Project Overview

Rentora Server is the backend of the Rentora Property Rental & Booking Platform.

It provides secure REST APIs for:

- Authentication & Authorization
- User Role Management
- Property Management
- Favorites System
- Booking Workflow
- Payment Processing
- Review Management
- Dashboard Analytics
- Administrative Moderation

The backend follows a **Role-Based Access Control (RBAC)** architecture with dedicated APIs for **Tenant**, **Owner**, and **Admin** users.

# ✨ Core Features

## 🔐 Authentication & Authorization

- Better Auth Authentication
- Google OAuth Login
- JOSE JWT Verification
- Protected REST APIs
- Role-Based Access Control (RBAC)
- Authentication Middleware
- Authorization Middleware

## 🏡 Property Management

- Add Property
- Update Property
- Delete Property
- Get All Approved Properties
- Featured Properties API
- Recent Properties API
- Property Details API
- Property Approval Workflow
- Property Rejection Feedback

## 🔍 Search & Filtering

- Search by Location
- Banner Search
- Filter by Property Type
- Filter by Price Range
- Price Sorting
- Backend Filtering & Searching

## ❤️ Favorites System

- Add Favorite Property
- Remove Favorite Property
- Get Favorite List
- Duplicate Favorite Prevention

## 📅 Booking Management

- Property Booking
- Booking Requests
- Booking Approval
- Booking Rejection
- Booking Status Tracking
- Booking Pagination

## 💳 Payment Processing

- Store Payment Transactions
- Payment Verification
- Booking Creation After Successful Payment
- Transaction History
- Payment Status Management

## ⭐ Review System

- Submit Reviews
- Property Reviews
- Home Page Reviews
- Rating-Based Review Filtering

## 📊 Dashboard Analytics

### 👤 Tenant Dashboard

- Total Bookings
- Favorite Properties
- Total Paid Amount

### 🏠 Owner Dashboard

- Total Properties
- Total Bookings
- Total Earnings
- Monthly Earnings Analytics

### 👨‍💼 Admin Dashboard

- Total Users
- Total Properties
- Total Bookings
- Total Transactions

# 👥 User Roles

## 👤 Tenant

Permissions

- Browse Properties
- View Property Details
- Save Favorites
- Book Properties
- Make Payments
- Submit Reviews
- View Dashboard

## 🏠 Owner

Permissions

- Add Property
- Update Property
- Delete Property
- Manage Bookings
- Approve Bookings
- Reject Bookings
- View Dashboard Analytics

## 👨‍💼 Admin

Permissions

- Manage Users
- Update User Roles
- Approve Properties
- Reject Properties
- Update Properties
- Delete Properties
- View Bookings
- View Transactions
- Access Dashboard Analytics

> **Default Admin Account**
>
> The default administrator account (`admin@gmail.com`) is protected. Its role cannot be modified through the Admin Panel to prevent accidental permission changes.

# 📂 Database Collections

| Collection    | Description                       |
| ------------- | --------------------------------- |
| **user**      | Stores user profiles and roles    |
| **property**  | Stores rental properties          |
| **favorites** | Stores tenant favorite properties |
| **booking**   | Stores booking requests           |
| **payment**   | Stores payment transactions       |
| **review**    | Stores tenant reviews             |

# 🛠️ Technology Stack

## Backend

- Node.js
- Express.js

## Database

- MongoDB Atlas

## Authentication

- Better Auth
- Google OAuth
- JOSE (JWT Verification)

## Security

- Role-Based Authorization
- Middleware Authentication
- Protected APIs

## Environment

- dotenv

# 📦 NPM Packages Used

```bash
express
mongodb
cors
dotenv
better-auth
jose-cjs
```

# 🔒 Security Features

- Better Auth Authentication
- JOSE JWT Verification
- Protected REST APIs
- Role-Based Access Control
- Authentication Middleware
- Authorization Middleware
- Secure Environment Variables
- MongoDB Atlas Secure Connection
- CORS Configuration

# 📡 API Modules

## 🌍 Public APIs

- Get All Properties
- Featured Properties
- Recent Properties
- Home Reviews

## 👤 Tenant APIs

- Property Details
- Favorites Management
- Bookings
- Payments
- Reviews
- Dashboard Overview

## 🏠 Owner APIs

- Property CRUD
- Booking Management
- Analytics
- Monthly Earnings

## 👨‍💼 Admin APIs

- Dashboard Overview
- User Management
- Property Moderation
- Booking Monitoring
- Transactions

# 📁 Project Structure

```text
server
│
├── index.js
├── package.json
├── .env
│
├── Middleware
│   ├── verifyToken
│   ├── tenantVerify
│   ├── ownerVerify
│   └── adminVerify
│
└── MongoDB Collections
    ├── user
    ├── property
    ├── favorites
    ├── booking
    ├── payment
    └── review
```

# ⚙️ Environment Variables

Create a `.env` file in the project root.

```env
PORT=

CLIENT_URL=

MONGODB_URI=
```

# 🚀 Getting Started

### Clone the repository

```bash
git clone https://github.com/nahidforever/Rentora-Server.git
```

### Navigate to the project

```bash
cd Rentora-Server
```

### Install dependencies

```bash
npm install
```

### Start the development server

```bash
npm run dev
```

### Start the production server

```bash
npm start
```

# 📌 Highlights

- ✅ Better Auth Authentication
- ✅ Google OAuth Login
- ✅ JOSE JWT Verification
- ✅ Role-Based Access Control (RBAC)
- ✅ Property Approval Workflow
- ✅ Favorites System
- ✅ Booking Management
- ✅ Payment Tracking
- ✅ Review System
- ✅ Dashboard Analytics
- ✅ MongoDB Atlas Integration
- ✅ Secure REST APIs

# 👨‍💻 Developer

**MD. Nahid Islam**

- GitHub: [https://github.com/nahidforever](https://github.com/nahidforever)
- LinkedIn: [https://www.linkedin.com/in/nahidforever/](https://www.linkedin.com/in/nahidforever/)
- Email: n.i.nahid02@gmail.com

<div align="center">

### 🚀 Rentora Server API

**Powering Rentora — Your Next Home Awaits 🏠**

</div>
