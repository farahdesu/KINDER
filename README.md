# 🍼 KINDER — Babysitter Booking Platform

A full-stack web application that connects parents with verified university babysitters, enabling safe childcare booking through time-slot validation, secure payments, and review-based trust.

Built using React, Node.js, Express, and MongoDB.

---

## 🎯 Overview

**KINDER** is a comprehensive babysitter booking platform that bridges the gap between parents seeking reliable childcare and vetted babysitters. The platform provides:

- **For Parents**: Browse babysitters, check availability, book services, pay securely, leave reviews, and report issues
- **For Babysitters**: Manage availability, view bookings, interact with parent information, and build reputation through reviews
- **For Administrators**: Monitor platform activity, manage user accounts, review reports, and ensure quality control

The platform includes advanced features like **time slot availability validation**, **sentiment analysis for reviews**, **SSLCommerz payment integration**, and a **comprehensive notification system**.

---

## ⭐ Key Features

### 👨‍👩‍👧 Parent Features
- ✅ User registration and authentication
- ✅ Search and filter babysitters by location
- ✅ **Real-time availability checking** - Book only during babysitter's available hours
- ✅ Secure online booking system with pending request management
- ✅ Payment integration with SSLCommerz
- ✅ Leave reviews and ratings for babysitters
- ✅ **Submit reports** for any issues encountered
- ✅ Dashboard showing booking history and upcoming bookings
- ✅ Real-time notifications for booking updates
- ✅ Forgot password recovery with email verification

### 👶 Babysitter Features
- ✅ Professional profile creation and management
- ✅ Flexible **time slot availability configuration** (configure available hours per day)
- ✅ View booking requests with parent information
- ✅ Accept/Reject booking requests
- ✅ **View parent details** (name, phone, address, special instructions)
- ✅ Earnings tracking and payment history
- ✅ View reviews and ratings from parents
- ✅ Dashboard with booking statistics
- ✅ Real-time notifications

### 🛡️ Admin Features
- ✅ User management (approve/reject babysitter applications)
- ✅ Review all platform bookings
- ✅ Review reports submitted by parents
- ✅ Monitor account activity
- ✅ Manage payment transactions
- ✅ Review sentiment analysis on user feedback

---

## 🛠️ Tech Stack

### **Frontend**
- **React 18.2** - UI library
- **React Router v6** - Client-side routing
- **Material-UI (MUI)** - Component library and styling
- **Axios** - HTTP client
- **Recharts** - Data visualization for analytics
- **Emotion** - CSS-in-JS styling

### **Backend**
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication & authorization
- **Bcryptjs** - Password hashing
- **Nodemailer** - Email service
- **SSLCommerz** - Payment gateway integration
- **Axios** - HTTP requests

### **Database**
- **MongoDB** - Document-oriented database

### **Tools & Services**
- **Git** - Version control
- **Nodemon** - Development server auto-reload
- **CORS** - Cross-origin resource sharing

---

## 📁 Project Structure

```
kinder-project/
│
├── backend/                          # Node.js/Express backend
│   ├── controllers/                  # Business logic
│   │   ├── adminController.js
│   │   ├── authController.js
│   │   ├── reportController.js
│   │   ├── reviewController.js
│   │   └── ...
│   │
│   ├── models/                       # MongoDB schemas
│   │   ├── Babysitter.js
│   │   ├── Booking.js
│   │   ├── Notification.js
│   │   ├── Parent.js
│   │   ├── Payment.js
│   │   ├── Report.js
│   │   ├── Review.js
│   │   └── User.js
│   │
│   ├── routes/                       # API endpoints
│   │   ├── authRoutes.js
│   │   ├── babysitterRoutes.js
│   │   ├── bookingRoutes.js
│   │   ├── notificationRoutes.js
│   │   ├── paymentRoutes.js
│   │   ├── reportRoutes.js
│   │   ├── reviewRoutes.js
│   │   └── ...
│   │
│   ├── middleware/                   # Custom middleware
│   │   └── auth.js                   # JWT authentication
│   │
│   ├── utils/                        # Utility functions
│   │   ├── emailService.js
│   │   ├── locationMatching.js
│   │   ├── sentimentAnalysis.js
│   │   └── sslcommerzService.js
│   │
│   ├── server.js                     # Express app entry point
│   ├── package.json
│   └── .env                          # Environment variables
│
├── frontend/                         # React frontend
│   ├── public/                       # Static assets
│   │   └── index.html
│   │
│   ├── src/
│   │   ├── components/               # React components
│   │   │   ├── admin/
│   │   │   ├── babysitter/
│   │   │   ├── booking/
│   │   │   ├── parent/
│   │   │   ├── payment/
│   │   │   ├── Login.jsx
│   │   │   ├── RegisterForm.js
│   │   │   ├── HomePage.js
│   │   │   ├── NotificationBell.jsx
│   │   │   └── ...
│   │   │
│   │   ├── context/                  # React context (Auth)
│   │   │   └── AuthContext.js
│   │   │
│   │   ├── pages/                    # Page-level components
│   │   │   └── ReviewsPage.jsx
│   │   │
│   │   ├── assets/                   # Images & static files
│   │   │
│   │   ├── App.js                    # Main app component
│   │   ├── index.js                  # React entry point
│   │   └── setupTests.js
│   │
│   ├── package.json
│   └── .env                          # Environment variables
│
├── 📖 Documentation Files
│   ├── README.md                     # This file
│   ├── QUICK_START_GUIDE.md          # Getting started & testing
│   ├── SYSTEM_ARCHITECTURE.md        # System design & flow
│   ├── IMPLEMENTATION_SUMMARY.md     # Feature implementation details
│   ├── CODE_CHANGES_REFERENCE.md     # Detailed code changes
│   └── FILES_SUMMARY.md              # File & change summary
│
└── .gitignore                        # Git ignore rules
```

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **MongoDB** (local or MongoDB Atlas) - [Setup](https://www.mongodb.com/)
- **Git** - [Download](https://git-scm.com/)

### Clone the Repository

```bash
git clone <repository-url>
cd kinder-project/470-
```

---

## 📦 Installation

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create `.env` file** with the following variables:
   ```env
   # MongoDB Connection
   MONGODB_URI=mongodb://localhost:27017/kinder
   # or use MongoDB Atlas:
   # MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/kinder

   # JWT Secret (use a strong, random string)
   JWT_SECRET=your_super_secret_jwt_key_here_change_in_production

   # Email Service (Nodemailer)
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password

   # SSLCommerz Payment Gateway
   SSLCOMMERZ_STORE_ID=your_store_id
   SSLCOMMERZ_STORE_PASSWORD=your_store_password

   # Server Configuration
   PORT=5000
   NODE_ENV=development
   ```

4. **Initialize database** (optional - seed admin user):
   ```bash
   npm run seed-admin
   ```

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd ../frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create `.env` file:**
   ```env
   REACT_APP_API_URL=http://localhost:5000/api
   ```

---

## ⚙️ Configuration

### Backend Configuration

**Key Environment Variables:**
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens (use a strong, random value)
- `EMAIL_USER` / `EMAIL_PASS` - For sending emails via Nodemailer
- `SSLCOMMERZ_*` - Payment gateway credentials
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment (development/production)

### Frontend Configuration

**Key Environment Variables:**
- `REACT_APP_API_URL` - Backend API base URL

---

## 🎬 Running the Application

### Start Backend Server

```bash
cd backend
npm start          # Production
npm run dev        # Development (with Nodemon auto-reload)
```

Backend will run at: `http://localhost:5000`

### Start Frontend Development Server

```bash
cd frontend
npm start
```

Frontend will run at: `http://localhost:3000`

The browser will automatically open at `http://localhost:3000` with hot-reload enabled.

### Verify Installation

- **Backend**: Visit `http://localhost:5000/` - should see JSON response
- **Frontend**: Visit `http://localhost:3000/` - should see KINDER home page
- **MongoDB**: Verify connection is established (check console logs)

---

## 📡 API Documentation

### Authentication Endpoints

```
POST   /api/auth/register          # Register new user
POST   /api/auth/login             # User login
POST   /api/auth/forgot-password   # Request password reset
POST   /api/auth/reset-password    # Reset password with code
```

### Babysitter Endpoints

```
GET    /api/babysitters            # Get all babysitters
GET    /api/babysitters/:id        # Get babysitter details
PUT    /api/babysitters/:id        # Update profile & availability
GET    /api/babysitters/search     # Search babysitters by location
```

### Booking Endpoints

```
GET    /api/bookings               # Get user's bookings
POST   /api/bookings               # Create new booking
GET    /api/bookings/check-availability/:babysitterId  # Check time slot availability
PUT    /api/bookings/:id           # Accept/reject booking
DELETE /api/bookings/:id           # Cancel booking
```

### Payment Endpoints

```
POST   /api/payments/initiate      # Initiate SSLCommerz payment
POST   /api/payments/validate      # Validate payment response
GET    /api/payments/history       # Get payment history
```

### Review Endpoints

```
POST   /api/reviews                # Submit review
GET    /api/reviews/:babysitterId  # Get babysitter reviews
PUT    /api/reviews/:id            # Update review
```

### Report Endpoints

```
POST   /api/reports                # Submit report
GET    /api/reports                # Get reports (admin)
PUT    /api/reports/:id            # Update report status (admin)
```

### Notification Endpoints

```
GET    /api/notifications          # Get user notifications
POST   /api/notifications/:id/read # Mark notification as read
DELETE /api/notifications/:id      # Delete notification
```

> For detailed API documentation, refer to individual route files in `backend/routes/`

---

## ✨ Project Features in Detail

### 1. Time Slot Availability System

Parents can ONLY book babysitters during their configured available hours. Each babysitter sets their availability for each day of the week.

**Key Features:**
- ✅ Real-time validation on parent booking form (green ✅ / red ❌ indicators)
- ✅ Server-side validation prevents invalid bookings
- ✅ Pending bookings also block time slots (prevents double-booking)
- ✅ Error messages specify the reason (outside hours, already booked, etc.)

**Files Involved:**
- `backend/routes/bookingRoutes.js` - Availability validation logic
- `frontend/src/components/parent/BookBabysitterPage.jsx` - Real-time validation UI

### 2. Parent Information Display

Babysitters can view detailed parent information after confirming a booking.

**Information Shown:**
- Parent name
- Phone number
- Delivery/pickup address
- Special instructions
- Booking date and time

**How to Use:**
1. Babysitter confirms a booking
2. Click the person icon (👤) on the confirmed booking
3. Dialog opens with full parent details

### 3. Notification System

Real-time notifications for:
- Booking requests received (parent → babysitter)
- Booking status changes (babysitter → parent)
- Review notifications
- Payment confirmations
- Report status updates

**Files Involved:**
- `backend/routes/notificationRoutes.js`
- `backend/models/Notification.js`
- `frontend/src/components/NotificationBell.jsx`

### 4. Review & Sentiment Analysis

Parents can leave reviews for babysitters with automatic sentiment analysis.

**Features:**
- Star ratings (1-5)
- Text reviews
- Automatic sentiment analysis (positive/negative/neutral)
- Review moderation
- Reply capability

**Files Involved:**
- `backend/utils/sentimentAnalysis.js`
- `backend/controllers/reviewController.js`

### 5. Report System

Parents can report issues or concerns about babysitters or bookings.

**Features:**
- Detailed report submission
- Admin review and investigation
- Status tracking (pending, investigating, resolved, dismissed)
- Communication between reporter and admin

**Files Involved:**
- `backend/routes/reportRoutes.js`
- `backend/models/Report.js`

### 6. Payment Integration

Secure payment processing via SSLCommerz.

**Payment Flow:**
1. Parent initiates payment
2. Redirected to SSLCommerz gateway
3. Payment processed
4. Confirmation webhook received
5. Booking status updated

**Files Involved:**
- `backend/utils/sslcommerzService.js`
- `backend/routes/paymentRoutes.js`

### 7. Location Matching

Babysitters are displayed based on parent's location preferences.

**Files Involved:**
- `backend/utils/locationMatching.js`

---

## 🧪 Testing

### Manual Testing Guide

See [QUICK_START_GUIDE.md](./QUICK_START_GUIDE.md) for:
- Testing procedures
- Test cases with setup and expected results
- Verification checklist
- Troubleshooting guide

### Test Scenarios

1. **User Registration & Authentication**
   - Register as parent
   - Register as babysitter
   - Login with credentials
   - Forgot password flow

2. **Babysitter Profile & Availability**
   - Create babysitter profile
   - Set availability hours
   - Update profile information
   - View babysitter ratings

3. **Booking Flow**
   - Search for babysitters
   - Check time slot availability
   - Create booking request
   - Accept/reject booking
   - View parent details

4. **Payment Processing**
   - Initiate payment
   - Complete payment via SSLCommerz
   - Verify transaction history

5. **Reviews & Ratings**
   - Submit review
   - View sentiment analysis
   - Update review

6. **Reporting**
   - Submit report
   - Track report status
   - Admin review reports

### Running Integration Tests

```bash
cd backend
npm test
```

> Note: More comprehensive test suite can be added as needed

---

## 🚢 Deployment

### Backend Deployment (Heroku/Railway/Vercel)

1. **Set environment variables** on your hosting platform:
   ```
   MONGODB_URI
   JWT_SECRET
   EMAIL_USER
   EMAIL_PASS
   SSLCOMMERZ_STORE_ID
   SSLCOMMERZ_STORE_PASSWORD
   NODE_ENV=production
   ```

2. **Deploy:**
   ```bash
   git push heroku main  # for Heroku
   # or use your platform's deployment method
   ```

### Frontend Deployment (Vercel/Netlify)

1. **Build production bundle:**
   ```bash
   cd frontend
   npm run build
   ```

2. **Deploy:**
   ```bash
   npm install -g vercel
   vercel
   ```

3. **Update API URL** in environment variables to point to deployed backend

---

## 📊 Project Status

### ✅ Completed Features

- [x] User authentication (register/login/password recovery)
- [x] Parent profile & booking management
- [x] Babysitter profile & availability management
- [x] **Time slot availability validation**
- [x] **Parent information display**
- [x] Real-time notifications
- [x] Payment integration (SSLCommerz)
- [x] Review & rating system
- [x] Sentiment analysis
- [x] Report system
- [x] Admin dashboard
- [x] Location-based babysitter search

### 📋 Possible Future Enhancements

- [ ] Mobile app (React Native/Flutter)
- [ ] Video call integration for interviews
- [ ] Advanced scheduling features (recurring bookings)
- [ ] Babysitter insurance integration
- [ ] In-app chat/messaging
- [ ] GPS tracking (with consent)
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Automated invoice generation
- [ ] Integration with calendar apps (Google Calendar, Outlook)

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch:** `git checkout -b feature/YourFeatureName`
3. **Commit your changes:** `git commit -m 'Add YourFeatureName'`
4. **Push to the branch:** `git push origin feature/YourFeatureName`
5. **Open a Pull Request**

### Code Standards

- Write clear, descriptive commit messages
- Follow existing code style and conventions
- Test your changes before submitting
- Update documentation as needed

---

## 📚 Additional Documentation

For more detailed information, please refer to:

- **[QUICK_START_GUIDE.md](./QUICK_START_GUIDE.md)** - Overview and testing guide
- **[SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md)** - System design and data flow
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Feature details
- **[CODE_CHANGES_REFERENCE.md](./CODE_CHANGES_REFERENCE.md)** - Detailed code changes
- **[DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md)** - Complete documentation index

---

## ⚡ Quick Commands Reference

```bash
# Backend
cd backend
npm install              # Install dependencies
npm start               # Start server (production)
npm run dev             # Start with Nodemon (development)
npm test                # Run tests

# Frontend
cd frontend
npm install              # Install dependencies
npm start               # Start development server
npm run build           # Build for production
npm test                # Run tests

# Database
node seedAdmin.js       # Seed admin user
node checkDB.js         # Check database connection
node deleteBookings.js  # Clear bookings (development only)
```

---

## 🐛 Troubleshooting

### MongoDB Connection Issues
- Verify `MONGODB_URI` is correct
- Check if MongoDB is running locally or connection to MongoDB Atlas
- Test connection: `node checkDB.js`

### JWT Token Errors
- Ensure `JWT_SECRET` is set and is the same across requests
- Token might be expired - user needs to login again
- Check middleware in `backend/middleware/auth.js`

### Port Already in Use
- **Backend (5000):** `node clear-port.bat` (Windows) or use `lsof -i :5000` (Mac/Linux)
- **Frontend (3000):** Change port with `PORT=3001 npm start`

### CORS Errors
- Verify frontend URL matches CORS origin in `backend/server.js`
- Check that both frontend and backend are running
- Ensure API URL is correctly configured in frontend `.env`

### Payment Issues
- Verify SSLCommerz credentials are correct
- Check payment gateway is in test/production mode as needed
- Review payment logs in admin dashboard

---

## 📞 Support & Contact

For issues, questions, or suggestions:
- Check existing documentation
- Review code comments
- Submit an issue on GitHub
- Contact the development team

---

## 📄 License

This project is licensed under the **MIT License** - see LICENSE file for details.

---

## 🙏 Acknowledgments

- Built with modern web technologies
- Inspired by reliable babysitting platforms
- Thanks to all contributors and users

---

**Happy Coding! 🚀**

Last Updated: January 2, 2026
