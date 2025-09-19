import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './CreateDiagram.css';
import { diagramService } from '../../services/api';

function CreateDiagram() {
  const [diagramName, setDiagramName] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Check if user is logged in and get token
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const token = localStorage.getItem('token');
  
  // If not logged in, redirect to dashboard
  if (!isLoggedIn) {
    navigate('/dashboard', { state: { createAttempt: true } });
    return null;
  }

  const handleProviderSelect = (provider) => {
    setSelectedProvider(provider);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!diagramName.trim()) {
      setError('Please enter a diagram name');
      return;
    }
    
    if (!selectedProvider) {
      setError('Please select a cloud service provider');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      // Call API to create the diagram
      console.log('Creating diagram with data:', {
        name: diagramName,
        cloudProvider: selectedProvider
      });
      
      const response = await diagramService.createDiagram({
        name: diagramName,
        cloudProvider: selectedProvider
      });
      
      console.log('Diagram created successfully:', response.data);
      
      // Navigate back to dashboard
      navigate('/dashboard', { 
        state: { 
          success: true, 
          message: `Diagram "${diagramName}" created successfully!` 
        } 
      });
    } catch (error) {
      console.error('Error creating diagram:', error);
      setError(error.response?.data?.message || 'Failed to create diagram. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="create-diagram-container">
      <h2>Create New Diagram</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit} className="create-diagram-form">
        <div className="form-group">
          <label htmlFor="diagramName">Diagram Name</label>
          <input
            type="text"
            id="diagramName"
            value={diagramName}
            onChange={(e) => setDiagramName(e.target.value)}
            placeholder="Enter diagram name"
            required
            disabled={isLoading}
          />
        </div>
        
        <div className="form-group">
          <label>Choose Diagram Base</label>
          <div className="provider-selector">
            <button 
              type="button"
              className={`provider-button ${selectedProvider === 'AWS' ? 'selected' : ''}`}
              onClick={() => handleProviderSelect('AWS')}
              disabled={isLoading}
            >
              AWS
            </button>
            <button 
              type="button"
              className={`provider-button ${selectedProvider === 'GCP' ? 'selected' : ''}`}
              onClick={() => handleProviderSelect('GCP')}
              disabled={isLoading}
            >
              GCP
            </button>
            <button 
              type="button"
              className={`provider-button ${selectedProvider === 'Azure' ? 'selected' : ''}`}
              onClick={() => handleProviderSelect('Azure')}
              disabled={isLoading}
            >
              Azure
            </button>
          </div>
        </div>
        
        <div className="form-actions">
          <button type="submit" className="create-button" disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateDiagram;