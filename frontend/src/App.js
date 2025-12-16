import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import RegisterForm from './components/RegisterForm';
import HomePage from './components/HomePage';
import Login from './components/LoginPage';
import ForgotPasswordPage from './components/ForgotPasswordPage';
import ResetPasswordWithCodePage from './components/ResetPasswordWithCodePage';
import ParentDashboard from './components/parent/ParentDashboard';
import BabysitterDashboard from './components/babysitter/BabysitterDashboard';
import BookBabysitterPage from './components/parent/BookBabysitterPage';
import ParentBookingsPage from './components/parent/ParentBookingsPage';
import ParentProfilePage from './components/parent/ParentProfilePage';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/register" element={<RegisterForm />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordWithCodePage />} />
            <Route path="/parent-dashboard" element={<ParentDashboard />} />
            <Route path="/babysitter-dashboard" element={<BabysitterDashboard />} />
            <Route path="/book-babysitter/:babysitterId" element={<BookBabysitterPage />} />
            <Route path="/parent-bookings" element={<ParentBookingsPage />} />
            <Route path="/parent-profile" element={<ParentProfilePage />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;