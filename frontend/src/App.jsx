import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import './App.css'
import Home from './pages/Home'
import About from './pages/About'

function App() {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <Router>
      <div className="app">
        <nav className="navbar">
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
            <button className="new-diagram-btn">New Diagram</button>
            <div className="profile-placeholder"></div>
          </div>
        </nav>

        {menuOpen && (
          <div className="sidebar-menu">
            <ul>
              <li><Link to="/" onClick={() => setMenuOpen(false)}>Dashboard</Link></li>
              <li><Link to="/about" onClick={() => setMenuOpen(false)}>About</Link></li>
            </ul>
          </div>
        )}
        
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </main>

        <footer className="app-footer">
          <p>&copy; {new Date().getFullYear()} Full-Stack App</p>
        </footer>
      </div>
    </Router>
  )
}

export default App
