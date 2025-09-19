import React, { useState, useEffect } from 'react';
import { generateTerraformCode } from '../utils/terraformGenerator';
import './TerraformCodeView.css';

/**
 * Component for displaying generated Terraform code
 * @param {Object} props - Component properties
 * @param {Array} props.components - Array of diagram components
 * @returns {JSX.Element} Terraform code view component
 */
const TerraformCodeView = ({ components }) => {
  const [terraformCode, setTerraformCode] = useState('');
  const [supportedTypes, setSupportedTypes] = useState([]);
  const [unsupportedComponents, setUnsupportedComponents] = useState([]);
  
  useEffect(() => {
    // Generate code and identify supported vs. unsupported components
    const code = generateTerraformCode(components);
    setTerraformCode(code);
    
    // Define supported component types (must match the switch statement in terraformGenerator)
    const supportedComponentTypes = [
      'vpc', 'subnet', 'security-group', 'ec2', 's3', 'rds',
      'lambda', 'dynamodb', 'elb', 'cloudtrail', 'nat-gateway', 'network-acl'
    ];
    setSupportedTypes(supportedComponentTypes);
    
    // Identify any unsupported components
    const unsupported = components.filter(
      component => !supportedComponentTypes.includes(component.id.split('-')[0])
    );
    setUnsupportedComponents(unsupported);
  }, [components]);
  
  // Handler to copy terraform code to clipboard
  const handleCopyCode = () => {
    navigator.clipboard.writeText(terraformCode)
      .then(() => {
        alert('Terraform code copied to clipboard!');
      })
      .catch(err => {
        console.error('Failed to copy code: ', err);
      });
  };

  return (
    <div className="terraform-code-view">
      <div className="code-header">
        <h3>Terraform Code</h3>
        <button onClick={handleCopyCode} className="copy-button">
          Copy Code
        </button>
      </div>
      
      {unsupportedComponents.length > 0 && (
        <div className="warning-box">
          <h4>Warning: Unsupported Components</h4>
          <p>The following components cannot be converted to Terraform code:</p>
          <ul>
            {unsupportedComponents.map(component => (
              <li key={component.id}>{component.name || component.id}</li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="supported-types">
        <h4>Supported AWS Resources:</h4>
        <div className="type-badges">
          {supportedTypes.map(type => (
            <span key={type} className="type-badge">
              {type.toUpperCase()}
            </span>
          ))}
        </div>
      </div>
      
      <div className="code-container">
        <pre>
          <code>{terraformCode}</code>
        </pre>
      </div>
      
      <div className="terraform-info">
        <p>
          <strong>Note:</strong> This code is for reference. In a production environment,
          you should review and customize the generated code according to your specific requirements.
        </p>
      </div>
    </div>
  );
};

export default TerraformCodeView;