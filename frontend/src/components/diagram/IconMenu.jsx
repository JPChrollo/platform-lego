import React, { useState, useRef, useEffect } from 'react';
import './IconMenu.css';

// Mock cloud component icons based on cloud provider
// In a real application, these would be fetched from the backend
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

const IconMenu = ({ cloudProvider = 'AWS', onClose }) => {
  const [searchText, setSearchText] = useState('');
  const [menuWidth, setMenuWidth] = useState(250); // Default width
  const [isResizing, setIsResizing] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const resizeStartX = useRef(0);
  const iconMenuRef = useRef(null);

  // Get components for the selected cloud provider
  const components = cloudProviderComponents[cloudProvider] || [];

  // Filter components based on search text
  const filteredComponents = components.filter(component =>
    component.name.toLowerCase().includes(searchText.toLowerCase())
  );

  // Handle resize start
  const handleResizeStart = (e) => {
    setIsResizing(true);
    resizeStartX.current = e.clientX;
  };

  // Handle mouse move during resize
  const handleMouseMove = (e) => {
    if (!isResizing) return;
    
    const newWidth = menuWidth + (e.clientX - resizeStartX.current);
    // Limit the minimum and maximum width
    if (newWidth >= 150 && newWidth <= 400) {
      setMenuWidth(newWidth);
      resizeStartX.current = e.clientX;
    }
  };

  // Handle resize end
  const handleMouseUp = () => {
    setIsResizing(false);
  };

  // Add global event listeners for resize
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // Handle components being dragged back to the icon menu (deletion)
  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('delete-hover');
  };
  
  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove('delete-hover');
  };
  
  // Handle component drop into icon menu
  const handleDrop = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('delete-hover');
    
    // Get component ID from the drop event
    const componentId = e.dataTransfer.getData("componentId");
    
    if (componentId) {
      // Dispatch an event for the parent component to handle deletion
      const deleteEvent = new CustomEvent('component-deleted', {
        detail: {
          componentId: componentId
        }
      });
      document.dispatchEvent(deleteEvent);
    }
  };

  return (
    <div 
      className="icon-menu"
      ref={iconMenuRef}
      style={{ width: `${menuWidth}px` }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="icon-menu-content">
        <h3 className="icon-menu-title">{cloudProvider} Components</h3>
        
        <div className="search-bar-container">
          <input
            type="text"
            className="icon-search-bar"
            placeholder="Search for a component"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <span className="search-icon">🔍</span>
        </div>
        
        <div className="icon-grid">
          {filteredComponents.map(component => (
            <div 
              key={component.id} 
              className="icon-item"
              draggable="true"
              onDragStart={(e) => {
                // Set data for drag operation
                e.dataTransfer.setData("component", JSON.stringify(component));
                // Create a ghost element to show while dragging
                const ghostElement = document.createElement('div');
                ghostElement.className = 'drag-ghost';
                ghostElement.innerHTML = `<div class="icon">${component.icon}</div><div class="icon-name">${component.name}</div>`;
                document.body.appendChild(ghostElement);
                
                // Set the drag image to our ghost element
                e.dataTransfer.setDragImage(ghostElement, 30, 30);
                
                // Remove the ghost element after a short delay
                setTimeout(() => {
                  if (ghostElement.parentNode) {
                    ghostElement.parentNode.removeChild(ghostElement);
                  }
                }, 100);
              }}
              onClick={(e) => {
                // Clone the component for clicking within the diagram
                const rect = e.currentTarget.getBoundingClientRect();
                const clickEvent = new CustomEvent('component-selected', {
                  detail: {
                    component: component,
                    x: rect.left,
                    y: rect.top
                  }
                });
                document.dispatchEvent(clickEvent);
              }}
            >
              <div className="icon">{component.icon}</div>
              <div className="icon-name">{component.name}</div>
            </div>
          ))}
          {filteredComponents.length === 0 && (
            <div className="no-results">No matching components found</div>
          )}
        </div>
      </div>
      
      {/* Resizable divider */}
      <div 
        className="icon-menu-divider"
        onMouseDown={handleResizeStart}
      />
      
      {/* Close button with arrow */}
      <div 
        className={`close-icon-menu ${isHovering ? 'hover' : ''}`}
        onClick={onClose}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        title="Close icon menu"
      >
        <span className="arrow-icon">←</span>
        {isHovering && (
          <span className="close-tooltip">Close icon menu</span>
        )}
      </div>
    </div>
  );
};

export default IconMenu;