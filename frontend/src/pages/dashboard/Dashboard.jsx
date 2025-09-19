import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { userService, authService, diagramService } from '../../services/api';
import './Dashboard.css';

function Dashboard() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [diagrams, setDiagrams] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateMessage, setShowCreateMessage] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
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
    
    // Check for success message from Create Diagram page
    if (location.state?.success && location.state?.message) {
      setSuccessMessage(location.state.message);
      // Clear the message after 5 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
    }

    if (!token) {
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      setError('');
      
      try {
        // Get user profile from the API
        const userResponse = await userService.getUserProfile();
        
        if (userResponse.data.success) {
          setUser(userResponse.data.user);
          
          // Fetch user's diagrams
          const diagramsResponse = await diagramService.getUserDiagrams();
          
          // Format the diagrams data
          const formattedDiagrams = diagramsResponse.data.map(diagram => ({
            id: diagram._id,
            name: diagram.name,
            lastModified: new Date(diagram.updated_at).toLocaleDateString(),
            components: diagram.cloud_components?.length || 0,
            cloudProvider: diagram.base,
            description: `${diagram.base} diagram` // Using cloud provider as description
          }));
          
          setDiagrams(formattedDiagrams);
        } else {
          // If API returns error, redirect to login
          navigate('/login');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load diagrams. Please try again.');
        
        // If token is invalid or expired, clear auth data and redirect to login
        if (error.response && error.response.status === 401) {
          authService.logout(); // Clear the invalid token
          navigate('/login');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [navigate, location.state]);

  if (isLoading) {
    return <div className="dashboard-loading">Loading dashboard...</div>;
  }

  // Filter diagrams based on search query
  const filteredDiagrams = diagrams.filter(diagram =>
    diagram.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    diagram.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handler for creating new diagram
  const handleCreateDiagram = () => {
    navigate('/create-diagram');
  };
  
  // Handler for editing diagram
  const handleEditDiagram = (diagramId) => {
    console.log(`Navigating to edit diagram with ID: ${diagramId}`);
    navigate(`/edit-diagram/${diagramId}`);
  };
  
  // Handler for deleting diagram
  const handleDeleteDiagram = async (diagramId, diagramName) => {
    if (window.confirm(`Are you sure you want to delete "${diagramName}"?`)) {
      try {
        await diagramService.deleteDiagram(diagramId);
        
        // Remove diagram from state
        setDiagrams(diagrams.filter(diagram => diagram.id !== diagramId));
        setSuccessMessage(`"${diagramName}" has been deleted successfully.`);
        
        // Clear the message after 5 seconds
        setTimeout(() => {
          setSuccessMessage('');
        }, 5000);
      } catch (error) {
        console.error('Error deleting diagram:', error);
        setError('Failed to delete diagram. Please try again.');
        
        // Clear the error after 5 seconds
        setTimeout(() => {
          setError('');
        }, 5000);
      }
    }
  };

  return (
    <div className="dashboard-container">
      {successMessage && (
        <div className="success-message">{successMessage}</div>
      )}
      
      {error && (
        <div className="error-message">{error}</div>
      )}
      
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
            <div className="diagrams-header">
              <h2>My Diagrams</h2>
              <button className="create-diagram-btn" onClick={handleCreateDiagram}>
                Create New Diagram
              </button>
            </div>
            
            {diagrams.length > 0 ? (
              <div className="diagrams-grid">
                {filteredDiagrams.map(diagram => (
                  <div 
                    key={diagram.id} 
                    className="diagram-card" 
                    onClick={() => handleEditDiagram(diagram.id)}
                  >
                    <div className="diagram-preview">
                      {/* Show cloud provider icon or name */}
                      <div className="cloud-provider-icon">
                        {diagram.cloudProvider}
                      </div>
                    </div>
                    <div className="diagram-info">
                      <h3>{diagram.name}</h3>
                      <p>Last modified: {diagram.lastModified}</p>
                      <p>Components: {diagram.components}</p>
                      <div className="diagram-actions" onClick={(e) => e.stopPropagation()}>
                        <button 
                          className="diagram-btn edit"
                          onClick={() => handleEditDiagram(diagram.id)}
                        >
                          Edit
                        </button>
                        <button 
                          className="diagram-btn delete"
                          onClick={() => handleDeleteDiagram(diagram.id, diagram.name)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="dashboard-empty">
                <p>No diagrams created yet. Start by creating your first diagram!</p>
                <button className="create-first-diagram-btn" onClick={handleCreateDiagram}>
                  Create Your First Diagram
                </button>
              </div>
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
