import React from 'react';
import './IconMenu.css';

/**
 * IconMenu component that contains draggable cloud components
 * @param {Object} props - Component properties
 * @param {Function} props.onComponentDrop - Callback when component is dropped onto the menu
 * @returns {JSX.Element} IconMenu component
 */
const IconMenu = ({ onComponentDrop }) => {
  // Component types with their display names
  const componentTypes = [
    { id: 'vpc', name: 'VPC' },
    { id: 'subnet', name: 'Subnet' },
    { id: 'security-group', name: 'Security Group' },
    { id: 'ec2', name: 'EC2 Instance' },
    { id: 's3', name: 'S3 Bucket' },
    { id: 'rds', name: 'RDS Database' },
    { id: 'lambda', name: 'Lambda Function' },
    { id: 'dynamodb', name: 'DynamoDB Table' },
    { id: 'elb', name: 'Load Balancer' },
    { id: 'cloudtrail', name: 'CloudTrail' },
    { id: 'nat-gateway', name: 'NAT Gateway' },
    { id: 'network-acl', name: 'Network ACL' }
  ];
  
  /**
   * Handle drag start for components
   * @param {Event} e - Drag start event
   * @param {String} componentType - Type of component being dragged
   */
  const handleDragStart = (e, componentType) => {
    e.dataTransfer.setData('componentType', componentType);
  };

  /**
   * Handle drop event on the icon menu (for deleting components)
   * @param {Event} e - Drop event
   */
  const handleDrop = (e) => {
    e.preventDefault();
    onComponentDrop && onComponentDrop();
  };

  /**
   * Handle drag over event
   * @param {Event} e - Drag over event
   */
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  return (
    <div 
      className="icon-menu"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <div className="icon-menu-header">
        <h3>Cloud Components</h3>
        <div className="trash-zone">
          <span className="trash-icon">🗑️</span>
          <span>Drop here to delete</span>
        </div>
      </div>
      <div className="icon-menu-body">
        {componentTypes.map(component => (
          <div 
            key={component.id}
            className="icon-item"
            draggable
            onDragStart={(e) => handleDragStart(e, component.id)}
          >
            <div className="icon-image">
              <img 
                src={`/icons/${component.id}.svg`} 
                alt={component.name} 
              />
            </div>
            <div className="icon-label">{component.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default IconMenu;