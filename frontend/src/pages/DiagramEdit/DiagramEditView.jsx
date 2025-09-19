import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import IconMenu from '../../components/diagram/IconMenu';
import ConfigurationInfoBox from '../../components/diagram/ConfigurationInfoBox';
import TerraformCodeView from '../../components/diagram/TerraformCodeView';
import './DiagramEditView.css';
import { diagramService } from '../../services/api';

// Cloud component icons reference - make sure this matches with IconMenu
const cloudProviderComponents = {
  AWS: [
    { id: 'ec2', name: 'EC2', icon: '🖥️' },
    { id: 's3', name: 'S3 Bucket', icon: '🗂️' },
    { id: 'lambda', name: 'Lambda', icon: 'λ' },
    { id: 'dynamodb', name: 'DynamoDB', icon: '🔄' },
    { id: 'rds', name: 'RDS', icon: '💾' },
    { id: 'elb', name: 'ELB', icon: '⚖️' },
    { id: 'iam', name: 'IAM User', icon: '👤' },
    { id: 'security-group', name: 'Security Group', icon: '🔒' },
    { id: 'vpc', name: 'VPC', icon: '🌐' },
    { id: 'cloudtrail', name: 'CloudTrail', icon: '🔍' },
    { id: 'nat-gateway', name: 'NAT Gateway', icon: '🚪' },
    { id: 'network-acl', name: 'Network ACL', icon: '🛡️' },
  ],
  GCP: [
    { id: 'compute-engine', name: 'Compute Engine', icon: '🖥️' },
    { id: 'cloud-storage', name: 'Cloud Storage', icon: '🗂️' },
    { id: 'cloud-functions', name: 'Cloud Functions', icon: 'λ' },
    { id: 'bigquery', name: 'BigQuery', icon: '📊' },
    { id: 'cloud-sql', name: 'Cloud SQL', icon: '💾' },
    { id: 'load-balancing', name: 'Load Balancing', icon: '⚖️' },
    { id: 'iam', name: 'IAM', icon: '👤' },
  ],
  Azure: [
    { id: 'virtual-machines', name: 'Virtual Machines', icon: '🖥️' },
    { id: 'blob-storage', name: 'Blob Storage', icon: '🗂️' },
    { id: 'functions', name: 'Functions', icon: 'λ' },
    { id: 'cosmos-db', name: 'Cosmos DB', icon: '🔄' },
    { id: 'sql-database', name: 'SQL Database', icon: '💾' },
    { id: 'load-balancer', name: 'Load Balancer', icon: '⚖️' },
    { id: 'active-directory', name: 'Active Directory', icon: '👤' },
  ]
};

const DiagramEditView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [diagram, setDiagram] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isIconMenuVisible, setIsIconMenuVisible] = useState(true);
  const [diagramComponents, setDiagramComponents] = useState([]);
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [draggedComponent, setDraggedComponent] = useState(null);
  const [configBoxPosition, setConfigBoxPosition] = useState({ x: 0, y: 0 });
  const [connections, setConnections] = useState([]);

  // Handle component deletion
  useEffect(() => {
    const handleComponentDelete = (event) => {
      const { componentId } = event.detail;
      if (componentId) {
        console.log(`Deleting component with ID: ${componentId}`);
        
        // Remove component from diagramComponents
        setDiagramComponents(prevComponents => 
          prevComponents.filter(comp => comp.id !== componentId)
        );
        
        // If deleted component was selected, clear selection
        if (selectedComponent && selectedComponent.id === componentId) {
          setSelectedComponent(null);
        }
      }
    };
    
    // Add event listener
    document.addEventListener('component-deleted', handleComponentDelete);
    
    // Clean up
    return () => {
      document.removeEventListener('component-deleted', handleComponentDelete);
    };
  }, [selectedComponent]);

  useEffect(() => {
    const fetchDiagram = async () => {
      try {
        console.log(`Fetching diagram with ID: ${id}`);
        const response = await diagramService.getDiagram(id);
        console.log('Diagram data received:', response.data);
        setDiagram(response.data);
        
      // Process cloud components if available
      if (response.data.cloud_components && Array.isArray(response.data.cloud_components)) {
        console.log(`Processing ${response.data.cloud_components.length} cloud components`);
        
        // Map backend components to frontend format
        const components = response.data.cloud_components.map(comp => {
          // Get the icon based on component type from the cloudProviderComponents
          const componentType = comp.component_type;
          const provider = response.data.base || 'AWS'; // Use diagram base or default to AWS
          
          // Find the appropriate icon from the component library
          let icon = '🔳'; // Default icon if not found
          let componentName = comp.name || componentType;
          const providerComponents = cloudProviderComponents[provider] || cloudProviderComponents['AWS'];
          
          if (providerComponents) {
            const matchedComponent = providerComponents.find(c => c.id === componentType);
            if (matchedComponent) {
              icon = matchedComponent.icon;
              // If no name is provided, use the matched component name
              if (!comp.name) {
                componentName = matchedComponent.name;
              }
            }
          }
          
          console.log(`Creating component: ${componentName} (${componentType})`);
          
          return {
            id: `${comp.component_type}-${comp._id}`, // Create a unique ID
            name: componentName,
            type: comp.component_type,
            x: comp.position_x,
            y: comp.position_y,
            config: comp.configuration || {},
            icon: comp.icon || icon // Use saved icon or lookup from component library
          };
        });          setDiagramComponents(components);
        } else {
          console.log('No cloud components found in diagram data');
        }
      } catch (err) {
        console.error('Error fetching diagram:', err);
        setError('Failed to load diagram. Please try again.');
        
        // If diagram not found, redirect to dashboard
        if (err.response && err.response.status === 404) {
          console.log('Diagram not found, redirecting to dashboard');
          navigate('/dashboard');
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchDiagram();
    } else {
      console.error('No diagram ID provided in URL');
      setError('No diagram ID provided');
      setIsLoading(false);
    }
  }, [id, navigate]);

  if (isLoading) {
    return (
      <div className="diagram-loading">
        <div className="loading-spinner"></div>
        <p>Loading diagram...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="diagram-error">
        <p>{error}</p>
        <button 
          className="return-dashboard-btn"
          onClick={() => navigate('/dashboard')}
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const toggleIconMenu = () => {
    setIsIconMenuVisible(!isIconMenuVisible);
  };
  
  // Function to handle closing the configuration box
  const handleCloseConfig = () => {
    setSelectedComponent(null);
  };
  
  // Function to handle saving component configuration
  const handleSaveConfig = (componentId, configValues) => {
    // Process any reference fields to store both ID and name
    const processedConfig = { ...configValues };
    
    // Save component configuration
    setDiagramComponents(prevComponents => 
      prevComponents.map(comp => 
        comp.id === componentId 
          ? { ...comp, config: processedConfig } 
          : comp
      )
    );
    
    // Keep the component selected after saving
    setSelectedComponent(prevSelected => 
      prevSelected && prevSelected.id === componentId 
        ? { ...prevSelected, config: processedConfig } 
        : prevSelected
    );
    
    console.log('Saved component configuration:', processedConfig);
  };
  
  // Function to handle connection changes
  const handleConnectionChange = (componentId, componentConnections) => {
    if (componentConnections && componentConnections.length > 0) {
      // Update connections from this component
      setConnections(prevConnections => {
        // Remove existing connections from this component
        const filteredConnections = prevConnections.filter(conn => conn.sourceId !== componentId);
        
        // Add new connections
        return [...filteredConnections, ...componentConnections];
      });
    } else {
      // Remove all connections from this component
      setConnections(prevConnections => 
        prevConnections.filter(conn => conn.sourceId !== componentId)
      );
    }
  };

  // Function to handle component dragging on canvas
  const handleDragOver = (e) => {
    e.preventDefault();
    // Show visual feedback during drag over
    e.currentTarget.classList.add('drag-over');
  };
  
  // Function to handle component dropping on canvas
  const handleDrop = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    
    // Get component ID if it's an existing component
    const componentId = e.dataTransfer.getData("componentId");
    
    // Check if we're dropping an existing component (moving it)
    if (componentId) {
      // Get mouse position relative to canvas
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Update component position
      setDiagramComponents(prevComponents => 
        prevComponents.map(comp => 
          comp.id === componentId 
            ? { ...comp, x, y }
            : comp
        )
      );
      
      // Update selected component position if it's the one being dragged
      if (selectedComponent && selectedComponent.id === componentId) {
        setSelectedComponent(prev => ({ ...prev, x, y }));
        setConfigBoxPosition({ x, y });
      }
      
      // Update connections - they will automatically redraw at new coordinates
      // We don't need to manually update connection coordinates as they're
      // calculated dynamically based on component positions
      
      setDraggedComponent(null);
      return;
    }
    
    // Handle new component drop from icon menu
    const componentData = e.dataTransfer.getData("component");
    if (!componentData) return;
    
    try {
      const component = JSON.parse(componentData);
      
      // Get mouse position relative to canvas
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Create new component instance for the diagram
      const newComponent = {
        ...component,
        id: `${component.id}-${Date.now()}`, // Unique ID
        name: component.name || component.id, // Ensure name is set
        type: component.id, // Set type to component id for reference
        x: x,
        y: y,
        config: {}, // Configuration will be added when the component is clicked
        icon: component.icon // Ensure the icon is preserved
      };
      
      console.log(`Dropped component: ${newComponent.name} at position: (${x}, ${y})`, newComponent);
      
      // Add the component to the diagram
      setDiagramComponents(prevComponents => [...prevComponents, newComponent]);
    } catch (error) {
      console.error('Error parsing component data:', error);
    }
  };

  // Function to handle saving the diagram
  const handleSaveDiagram = async () => {
    try {
      console.log('Saving diagram with components:', diagramComponents);
      
      // Create a serializable version of the components
      const serializableComponents = diagramComponents.map(comp => {
        // Extract the base component type from the ID (everything before the first dash)
        const typeMatch = comp.id.match(/^([^-]+)/);
        const type = typeMatch ? typeMatch[1] : 'unknown';
        
        // Convert any complex objects to simple JSON-serializable objects
        return {
          id: comp.id,
          name: comp.name || `${type}-component`,
          type: type,
          x: comp.x,
          y: comp.y,
          config: comp.config || {},
          icon: comp.icon // Include the icon for reference
        };
      });
      
      const updateData = {
        name: diagram.name,
        cloudProvider: diagram.base,
        components: serializableComponents
      };
      
      console.log('Sending update data:', updateData);
      
      const response = await diagramService.updateDiagram(id, updateData);
      console.log('Update response:', response);
      
      if (response && response.data) {
        console.log('Diagram updated successfully:', response.data);
        alert('Diagram saved successfully');
        
        // Update local diagram data with the response
        setDiagram(response.data);
      } else {
        console.warn('No response data received from update');
        alert('Diagram may not have saved properly. Please check the console for details.');
      }
    } catch (error) {
      console.error('Error saving diagram:', error);
      alert(`Failed to save diagram: ${error.message || 'Unknown error'}`);
    }
  };

  return (
    <div className="diagram-edit-view">
      <div className="diagram-header">
        <div className="diagram-header-left">
          <button 
            className="back-to-dashboard" 
            onClick={() => navigate('/dashboard')}
          >
            ← Back
          </button>
          <h1>{diagram?.name || 'Untitled Diagram'}</h1>
        </div>
        <div className="diagram-header-actions">
          <button 
            className="save-diagram-btn"
            onClick={handleSaveDiagram}
          >
            Save Diagram
          </button>
          <button className="drag-pointer-btn">Drag Pointer</button>
        </div>
      </div>
      
      <div className="diagram-content">
        {isIconMenuVisible && (
          <IconMenu 
            cloudProvider={diagram?.base} 
            onClose={toggleIconMenu} 
          />
        )}
        
        <div 
          className={`diagram-canvas ${selectedComponent ? 'has-selected-component' : ''}`}
          onClick={(e) => {
            // Only clear selection if clicking directly on the canvas
            // The configuration box is now rendered outside this element
            if (e.target === e.currentTarget && !e.defaultPrevented) {
              // Prevent clearing selection while working with configuration
              if (document.querySelector('.configuration-info-box:hover, .configuration-info-box *:hover')) {
                return;
              }
              setSelectedComponent(null);
            }
          }}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onDragLeave={(e) => {
            e.currentTarget.classList.remove('drag-over');
          }}
        >
          {/* This will be the main drawing area */}
          {!isIconMenuVisible && (
            <div 
              className="show-icon-menu-container"
            >
              <div 
                className="show-icon-menu-btn"
                onClick={toggleIconMenu}
                onMouseEnter={(e) => {
                  const tooltip = document.createElement('div');
                  tooltip.className = 'show-icon-menu-tooltip';
                  tooltip.textContent = 'Show Icon Menu';
                  tooltip.style.position = 'fixed';
                  tooltip.style.left = `${e.clientX + 10}px`;
                  tooltip.style.top = `${e.clientY + 10}px`;
                  document.body.appendChild(tooltip);
                }}
                onMouseLeave={() => {
                  const tooltips = document.getElementsByClassName('show-icon-menu-tooltip');
                  while(tooltips.length > 0) {
                    tooltips[0].parentNode.removeChild(tooltips[0]);
                  }
                }}
              >
                <span className="arrow-icon-right">→</span>
              </div>
            </div>
          )}
          
          {/* SVG layer for rendering connections */}
          <svg className="connections-layer" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
            {connections.map((conn, index) => {
              // Find source and target components
              const sourceComp = diagramComponents.find(c => c.id === conn.sourceId);
              const targetComp = diagramComponents.find(c => c.id === conn.targetId);
              
              // If either component doesn't exist, don't render the connection
              if (!sourceComp || !targetComp) return null;
              
              // Calculate connection line coordinates
              const sourceX = sourceComp.x;
              const sourceY = sourceComp.y;
              const targetX = targetComp.x;
              const targetY = targetComp.y;
              
              // Determine connection type class for styling
              const connectionType = conn.refType || 'default';
              const isSelected = selectedComponent && 
                (selectedComponent.id === conn.sourceId || selectedComponent.id === conn.targetId);
              
              return (
                <g key={`conn-${index}`} className={`connection ${connectionType} ${isSelected ? 'selected' : ''}`}>
                  {/* Main connection line */}
                  <line
                    x1={sourceX}
                    y1={sourceY}
                    x2={targetX}
                    y2={targetY}
                    strokeWidth={isSelected ? 3 : 2}
                    className={`connection-line ${connectionType}`}
                  />
                  
                  {/* Arrow at target end */}
                  <polygon 
                    points="0,-5 10,0 0,5"
                    className={`connection-arrow ${connectionType}`}
                    transform={`translate(${targetX}, ${targetY}) rotate(${Math.atan2(targetY - sourceY, targetX - sourceX) * (180 / Math.PI)})`}
                  />
                  
                  {/* Label to show connection type */}
                  <text
                    x={(sourceX + targetX) / 2}
                    y={(sourceY + targetY) / 2 - 10}
                    className="connection-label"
                    textAnchor="middle"
                    dy=".3em"
                  >
                    {conn.type}
                  </text>
                </g>
              );
            })}
          </svg>
          
          {/* Render diagram components */}
          {diagramComponents.length === 0 ? (
            <div className="diagram-placeholder">
              <p>Drag and drop components from the icon menu to create your diagram</p>
            </div>
          ) : (
            diagramComponents.map(component => (
              <div 
                key={component.id}
                className={`diagram-component ${selectedComponent?.id === component.id ? 'selected' : ''}`}
                style={{
                  position: 'absolute',
                  left: `${component.x - 40}px`, // Center the component
                  top: `${component.y - 40}px`
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedComponent(component);
                  
                  // Get the position for the ConfigurationInfoBox
                  const rect = e.currentTarget.getBoundingClientRect();
                  const canvasRect = document.querySelector('.diagram-canvas').getBoundingClientRect();
                  
                  // Set position relative to the canvas
                  setConfigBoxPosition({
                    x: component.x,
                    y: component.y
                  });
                }}
                draggable="true"
                onDragStart={(e) => {
                  // Set data for drag operation
                  e.dataTransfer.setData("componentId", component.id);
                  // Set drag image to be the component itself
                  e.dataTransfer.setDragImage(e.currentTarget, 40, 40);
                }}
              >
                <div className="component-icon">{component.icon}</div>
                <div className="component-name">{component.name || component.type || "Unknown Component"}</div>
              </div>
            ))
          )}
        </div>
        
        {/* Configuration Info Box - Moved outside diagram canvas to prevent event bubbling */}
        {selectedComponent && (
          <div 
            className="config-box-overlay" 
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}>
            <ConfigurationInfoBox
              component={selectedComponent}
              position={configBoxPosition}
              onSave={handleSaveConfig}
              onClose={handleCloseConfig}
              onConnectionsChange={handleConnectionChange}
              availableReferences={diagramComponents.filter(comp => 
                comp.id !== selectedComponent.id
              )}
            />
          </div>
        )}
        
        <div className="properties-panel">
          <h3>Properties</h3>
          <div className="properties-content">
            {selectedComponent ? (
              <div className="component-properties">
                <h4>{selectedComponent.name}</h4>
                <p>Type: {selectedComponent.id.split('-')[0]}</p>
                {Object.keys(selectedComponent.config || {}).length > 0 ? (
                  <div className="config-summary">
                    <h5>Configuration:</h5>
                    <ul>
                      {Object.entries(selectedComponent.config).map(([key, value]) => {
                        if (typeof value === 'object' && value !== null) {
                          return (
                            <li key={key}>
                              <strong>{key}:</strong> 
                              {Array.isArray(value) 
                                ? ` ${value.length} items`
                                : ` ${Object.keys(value).length} properties`}
                            </li>
                          );
                        } else {
                          return (
                            <li key={key}><strong>{key}:</strong> {String(value)}</li>
                          );
                        }
                      })}
                    </ul>
                  </div>
                ) : (
                  <p>No configuration set. Click the component to configure.</p>
                )}
              </div>
            ) : (
              <p>Select a component to view its properties</p>
            )}
          </div>
          
          {/* Terraform Code Generation Section */}
          <TerraformCodeView 
            diagramComponents={diagramComponents}
            cloudProvider={diagram?.base || 'AWS'}
          />
        </div>
      </div>
    </div>
  );
};

export default DiagramEditView;