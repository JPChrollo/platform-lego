import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import './App.css'
import Home from './pages/Home'
import About from './pages/About'
import Dashboard from './pages/dashboard/Dashboard'
import Profile from './pages/Profile/Profile'
import Login from './components/auth/Login'
import CreateAccount from './components/auth/CreateAccount'
import { authService, userService } from './services/api'

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(localStorage.getItem('isLoggedIn') === 'true');
  const [user, setUser] = useState(null);
  
  // Toggle the sidebar menu
  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };
  
  // Function to handle logout
  const handleLogout = () => {
    // Clear all auth data from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('isLoggedIn');
    // Also clear any login error states
    localStorage.removeItem('loginError');
    localStorage.removeItem('hasLoginFailed');
    setIsLoggedIn(false);
    setUser(null);
  };
  
  // We're now using handleLogout from the auth context

  // Check for token on component mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    const isLoggedInValue = localStorage.getItem('isLoggedIn') === 'true';
    
    // Update state based on localStorage
    setIsLoggedIn(isLoggedInValue);
    
    if (token && isLoggedInValue) {
      // Set user data from localStorage
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch (e) {
          console.error('Error parsing user data from localStorage', e);
        }
      }
      
      // Verify the token is valid by getting the user profile
      const verifyToken = async () => {
        try {
          const response = await userService.getUserProfile();
          if (response.data.success) {
            // Update user data if needed
            const userData = response.data.user || response.data;
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
            localStorage.setItem('isLoggedIn', 'true');
          } else {
            // Token not valid, clear it
            handleLogout();
          }
        } catch (error) {
          console.error('Token verification failed:', error);
          handleLogout();
        }
      };
      
      verifyToken();
    }
  }, []);
  
  // Add a listener for storage events to detect login/logout in other tabs or components
  useEffect(() => {
    // This function will run whenever localStorage changes
    const handleStorageChange = () => {
      const isLoggedInValue = localStorage.getItem('isLoggedIn') === 'true';
      setIsLoggedIn(isLoggedInValue);
      
      if (isLoggedInValue) {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          try {
            setUser(JSON.parse(savedUser));
          } catch (e) {
            console.error('Error parsing user data from localStorage', e);
          }
        }
      } else {
        setUser(null);
      }
    };
    
    // Check authentication status every 500ms to catch changes
    const intervalId = setInterval(handleStorageChange, 500);
    
    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  return (
    <Router>
      <div className="app">
        <nav className="navbar" style={{ backgroundColor: "#D9D9D9" }}>
          <div className="navbar-left">
            <button className="burger-menu-btn" onClick={toggleMenu}>
              <span className="burger-icon"></span>
              <span className="burger-icon"></span>
              <span className="burger-icon"></span>
            </button>
          </div>
          <div className="navbar-center">
            <h1>Platform Lego</h1>

          </div>
          <div className="navbar-right">
            <Link 
              to={isLoggedIn ? "/create-diagram" : "/dashboard"} 
              state={!isLoggedIn ? { createAttempt: true } : {}}
              className="new-diagram-btn"
            >
              Create New Diagram
            </Link>
            <div className="profile-placeholder">
              {isLoggedIn && <span className="logged-in-indicator"></span>}
            </div>
          </div>
        </nav>

        {menuOpen && (
          <div className="sidebar-menu">
            <ul>
              {isLoggedIn ? (
                // Menu items for logged-in users
                <>
                  <li><Link to="/dashboard" onClick={() => setMenuOpen(false)}>Dashboard</Link></li>
                  <li><Link to="/profile" onClick={() => setMenuOpen(false)}>My Profile</Link></li>
                  <li><Link to="/about" onClick={() => setMenuOpen(false)}>About</Link></li>
                  <li><Link to="/" onClick={() => { setMenuOpen(false); handleLogout(); }} className="logout-link">Logout</Link></li>
                </>
              ) : (
                // Menu items for guests
                <>
                  <li><Link to="/" onClick={() => setMenuOpen(false)}>Guest</Link></li>
                  <li><Link to="/about" onClick={() => setMenuOpen(false)}>About</Link></li>
                  <li><Link to="/create-account" onClick={() => setMenuOpen(false)} className="green-link">Create Account</Link></li>
                  <li>
                    <Link 
                      to="/login" 
                      onClick={() => { 
                        setMenuOpen(false);
                        // Just close the menu and navigate to login page
                      }} 
                      className="green-link"
                    >
                      Login
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        )}
        
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/login" element={<Login />} />
            <Route path="/create-account" element={<CreateAccount />} />
          </Routes>
        </main>

        <footer className="app-footer">
          <p>&copy; {new Date().getFullYear()} Platform Lego</p>
        </footer>
      </div>
    </Router>
  )
}

export default App
