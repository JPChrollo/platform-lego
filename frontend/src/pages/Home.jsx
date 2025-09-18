import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, []);
  
  return (
    <div className="home-container">
      <div className="hero-section">
        <h1>Platform Lego</h1>
        <h2>Cloud Visual Learning Tool</h2>
        <p>Learn cloud infrastructure deployment through interactive visual diagrams</p>
        
        {isLoggedIn ? (
          <Link to="/dashboard" className="cta-button">
            Go to Dashboard
          </Link>
        ) : (
          <div className="cta-buttons">
            <Link to="/login" className="cta-button login-btn">
              Login
            </Link>
            <Link to="/create-account" className="cta-button signup-btn">
              Create Account
            </Link>
          </div>
        )}
      </div>
      
      <div className="main-content">
        <div className="card">
          <h3>Welcome to the Cloud Visual Learning Tool</h3>
          <p>This platform helps early talent learn cloud infrastructure deployment through visual tools.</p>
        </div>
      </div>
    </div>
  );
}

export default Home;
