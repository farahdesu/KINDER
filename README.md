#  KINDER — Babysitter Booking Platform

A full-stack web application that connects parents with verified university babysitters, enabling safe childcare booking through time-slot validation, secure payments, and review-based trust.

Built using React, Node.js, Express, and MongoDB.

## 🎯 Overview

KINDER simplifies the childcare hiring process by providing a trusted, structured, and role-based platform.

### What the Platform Offers

- Verified babysitter profiles
- Time-slot–based booking (prevents double booking)
- Secure online payments (SSLCommerz)
- Review system with sentiment analysis
- Admin-controlled quality monitoring

### User Roles

- **Parents** — Search, book, pay, review
- **Babysitters** — Manage availability, accept bookings
- **Admins** — Approve sitters, monitor activity, resolve reports

## ⭐ Core Features

### 👨‍👩‍👧 Parent Features

- User registration & login (JWT authentication)
- Search babysitters by location
- Book only within babysitter's available time slots
- Online payment via SSLCommerz
- Booking history dashboard
- Leave reviews & ratings
- Submit reports for issues

### 👶 Babysitter Features

- Profile creation & updates
- Weekly availability configuration (day & time slots)
- Accept / reject booking requests
- View confirmed parent details
- Earnings & review tracking

### 🛡️ Admin Features

- Babysitter approval / rejection
- Platform booking monitoring
- Report review & resolution
- Review sentiment overview

## 🛠️ Tech Stack

### Frontend

- React 18
- React Router v6
- Material UI (MUI)
- Axios

### Backend

- Node.js
- Express.js
- MongoDB + Mongoose
- JWT Authentication
- Bcrypt
- Nodemailer
- SSLCommerz

## 📁 Project Structure

```
kinder-project/
│
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── utils/
│   └── server.js
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/
│   │   └── App.js
│
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- npm

### Clone Repository

```bash
git clone <https://github.com/farahdesu/KINDER.git>
cd kinder-project
```

## 📦 Installation

### Backend Setup

```bash
cd backend
npm install
```

#### Create .env

```env
MONGODB_URI=mongodb://localhost:27017/kinder
JWT_SECRET=your_secret_key
EMAIL_USER=your_email
EMAIL_PASS=your_email_password
SSLCOMMERZ_STORE_ID=your_store_id
SSLCOMMERZ_STORE_PASSWORD=your_store_password
PORT=5000
```

#### Run backend:

```bash
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
```

#### Create .env

```env
REACT_APP_API_URL=http://localhost:5000/api
```

#### Run frontend:

```bash
npm start
```

## 🔐 Key System Highlights

### ⏰ Time Slot Availability System

- Babysitters define availability per day
- Parents cannot book outside allowed slots
- Pending bookings block overlapping requests
- Validation occurs on both client & server

### 💳 Payment Flow

- Parent initiates payment
- Redirected to SSLCommerz gateway
- Payment validated
- Booking confirmed

### 🧠 Reviews & Sentiment Analysis

- Star rating (1–5)
- Text reviews
- Automatic sentiment tagging
- Admin visibility for moderation

### 🚨 Report System

- Parents submit issue reports
- Admin reviews and updates report status

## 📡 API Overview

### Authentication

```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/forgot-password
```

### Booking

```
POST /api/bookings
GET /api/bookings
GET /api/bookings/check-availability/:babysitterId
PUT /api/bookings/:id
```

### Reviews

```
POST /api/reviews
GET /api/reviews/:babysitterId
```

### Payments

```
POST /api/payments/initiate
POST /api/payments/validate
```

## 🧪 Testing (Manual)

- Register parent & babysitter
- Configure babysitter availability
- Attempt booking inside & outside allowed slots
- Complete payment
- Submit review & report
- Admin resolves report

## 📊 Project Status

### ✅ Completed

- Authentication system
- Booking with availability validation
- Payment integration
- Review & sentiment analysis
- Admin moderation panel
- Reporting system

### 🔮 Future Enhancements

- Mobile application
- In-app chat
- Recurring bookings
- Calendar integration
- Multi-language support

## 📄 License

MIT License

## 🙌 Acknowledgment

Developed as part of CSE470 – Software Engineering
Focused on real-world system design, trust, and booking logic.

Last Updated: January 2, 2026

Happy Coding 🚀
