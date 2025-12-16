import React from "react";
import { Link } from "react-router-dom";
import KinderBackground from '../assets/KinderBackground.jpg';
import KinderLogo from '../assets/KinderLogo.png';
import './HomePage.css';

const HomePage = () => {
  return (
    <div 
      className="home-page"
      style={{
        backgroundImage: `url(${KinderBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        padding: '20px',
        position: 'relative'
      }}
    >
      {/* Blurred Transparent Overlay */}
      <div className="page-overlay"></div>
      
      <div className="home-content">
        <div className="home-card">
          <div className="logo-section">
            <img src={KinderLogo} alt="KINDER Logo" className="logo-image" />
          </div>
          <h1 className="home-title">KINDER Babysitter Platform</h1>
          <p className="home-subtitle">Connecting Parents with University Babysitters</p>
          
          <div className="action-buttons">
            <Link to="/register" className="home-btn">
              Create Account
            </Link>
            <Link to="/login" className="home-btn">
              Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;