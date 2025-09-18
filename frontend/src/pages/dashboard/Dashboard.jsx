import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { userService, authService } from '../../services/api';
import './Dashboard.css';

function Dashboard() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [diagrams, setDiagrams] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateMessage, setShowCreateMessage] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const isLoggedInValue = localStorage.getItem('isLoggedIn') === 'true';
    setIsLoggedIn(isLoggedInValue);
    
    // Check if this is a redirect from clicking "Create New Diagram" when not logged in
    const createAttempt = location.state?.createAttempt;
    if (createAttempt && !isLoggedInValue) {
      setShowCreateMessage(true);
    }

    if (!token) {
      setIsLoading(false);
      return;
    }

    const fetchUserData = async () => {
      try {
        // Get user profile from the API
        const response = await userService.getUserProfile();
        
        if (response.data.success) {
          setUser(response.data.user);
        } else {
          // If API returns error, redirect to login
          navigate('/login');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        
        // If token is invalid or expired, clear auth data and redirect to login
        if (error.response && error.response.status === 401) {
          authService.logout(); // Clear the invalid token
          navigate('/login');
        }
      } finally {
        // Load demo diagrams (in a real app, these would come from the API)
        setDiagrams([
          { id: 1, name: 'Web Application Architecture', lastModified: '2023-05-15', components: 5, description: 'Cloud-based web application architecture' },
          { id: 2, name: 'Data Processing Pipeline', lastModified: '2023-05-10', components: 8, description: 'Big data processing workflow' },
          { id: 3, name: 'Microservices Infrastructure', lastModified: '2023-05-20', components: 12, description: 'Containerized microservices architecture' },
          { id: 4, name: 'IoT Platform', lastModified: '2023-05-08', components: 7, description: 'Internet of Things data collection platform' }
        ]);
        
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  if (isLoading) {
    return <div className="dashboard-loading">Loading dashboard...</div>;
  }

  // Filter diagrams based on search query
  const filteredDiagrams = diagrams.filter(diagram =>
    diagram.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    diagram.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="dashboard-container">
      {isLoggedIn ? (
        <>
          <div className="dashboard-header">
            <h1>Welcome, {user?.username || 'User'}!</h1>
            <p>Platform Lego - Build and visualize cloud infrastructure</p>
          </div>

          <div className="dashboard-search">
            <input
              type="text"
              placeholder="Search your diagrams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="dashboard-diagrams-section">
            <h2>My Diagrams</h2>
            {diagrams.length > 0 ? (
              <div className="diagrams-grid">
                {filteredDiagrams.map(diagram => (
                  <div key={diagram.id} className="diagram-card">
                    <div className="diagram-preview">
                      {/* Grey placeholder box for diagram preview */}
                    </div>
                    <div className="diagram-info">
                      <h3>{diagram.name}</h3>
                      <p>Last modified: {diagram.lastModified}</p>
                      <div className="diagram-actions">
                        <button className="diagram-btn edit">Edit</button>
                        <button className="diagram-btn delete">Delete</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="dashboard-empty">No diagrams created yet. Start by creating your first diagram!</p>
            )}
          </div>
        </>
      ) : (
        <div className="dashboard-guest">
          <h2>Welcome to Platform Lego</h2>
          <p className="guest-message">
            {showCreateMessage ? 
              <strong>Please sign in or create a new account to create diagrams.</strong> : 
              "Please sign in or create a new account to create diagrams."}
          </p>
          <div className="guest-actions">
            <button className="dashboard-button" onClick={() => navigate('/login')}>
              Sign In
            </button>
            <button className="dashboard-button" onClick={() => navigate('/create-account')}>
              Create Account
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
