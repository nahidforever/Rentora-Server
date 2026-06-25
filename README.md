# 🚀 Rentora Server

Backend API for Rentora — Your Next Home Awaits.

A secure and scalable REST API built with Node.js, Express.js, MongoDB Atlas, JWT Authentication, Better Auth, and Stripe Payment Integration.

## 📖 Overview

Rentora Server powers the complete backend infrastructure of the Rentora Property Rental & Booking Platform.

The server handles:

* Authentication & Authorization
* User Management
* Property Management
* Booking System
* Favorites System
* Review System
* Payment Processing
* Dashboard Analytics
* Admin Moderation

## ✨ Core Features

### 🔐 Authentication & Authorization

* JWT Authentication
* Better Auth Integration
* Google Login Support
* Protected APIs
* Role-Based Access Control (RBAC)

### 👥 User Management

* User Registration
* User Login
* Google Authentication
* Change User Role
* User Profile Management

### 🏡 Property Management

* Add Property
* Update Property
* Delete Property
* Property Approval System
* Property Rejection Feedback
* Owner Property Management

### 📅 Booking Management

* Create Booking
* Approve Booking
* Reject Booking
* Booking Status Tracking

### ❤️ Favorites Management

* Add Favorite Property
* Remove Favorite Property
* Get User Favorites

### ⭐ Review Management

* Submit Review
* Property Review Storage
* Dynamic Review Retrieval

### 💳 Payment Processing

* Stripe Payment Integration
* Payment Intent Creation
* Transaction Storage
* Payment Status Tracking

### 📊 Dashboard Analytics

#### Owner Analytics

* Total Earnings
* Total Properties
* Total Bookings
* Monthly Earnings Data

#### Admin Analytics

* Total Users
* Total Properties
* Total Bookings
* Total Transactions

## 🛠️ Technologies Used

### Backend Framework

* Node.js
* Express.js

### Database

* MongoDB Atlas

### Authentication

* JWT
* Better Auth
* Google OAuth

### Payment Gateway

* Stripe

### Environment Management

* dotenv


## 📦 NPM Packages

```bash
express
mongodb
cors
dotenv
jsonwebtoken
stripe
better-auth
```


## 🔒 Security Features

* JWT Protected APIs
* Role-Based Authorization
* Protected Dashboard APIs
* Secure Stripe Payment Handling
* Middleware Authentication
* Environment Variable Protection


## 👥 User Roles

### Tenant

Permissions:

* Browse Properties
* Create Bookings
* Add Favorites
* Submit Reviews

### Owner

Permissions:

* Add Properties
* Update Properties
* Delete Properties
* Manage Booking Requests
* View Earnings Analytics

### Admin

Permissions:

* Manage Users
* Manage Properties
* Approve Properties
* Reject Properties
* Monitor Transactions
* Monitor Bookings

## 📂 Database Collections

### users

Stores user information and roles.

### properties

Stores property listings.

### bookings

Stores booking records and booking status.

### payments

Stores Stripe transaction information.

### favorites

Stores user favorite properties.

### reviews

Stores tenant reviews and ratings.

---

## 🚀 API Modules

### Authentication APIs

* User Authentication
* JWT Verification
* Google Login Support

### Property APIs

* Create Property
* Get Properties
* Update Property
* Delete Property

### Booking APIs

* Create Booking
* Get Bookings
* Approve Booking
* Reject Booking

### Payment APIs

* Create Payment Intent
* Save Transaction
* Payment Verification

### Review APIs

* Add Review
* Get Reviews

### Admin APIs

* Manage Users
* Manage Properties
* Manage Bookings
* Manage Transactions

## 🚀 Running Locally

Install dependencies:

```bash
npm install
```

Start development server:

```bash
npm run dev
```

Start production server:

```bash
npm start
```

## 👨‍💻 Developer

Md. Nahid Islam

Rentora Server API 🚀
