import React, { useState, useEffect } from 'react';
import './TerraformCodeView.css';
import { generateTerraformCode } from '../../utils/terraformGenerator';

/**
 * Component to display and manage Terraform code generation
 */
const TerraformCodeView = ({ diagramComponents, cloudProvider }) => {
  const [terraformCode, setTerraformCode] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);
  
  useEffect(() => {
    // Generate terraform code whenever components change
    if (diagramComponents.length > 0) {
      const code = generateTerraformCode(diagramComponents);
      setTerraformCode(code);
    } else {
      setTerraformCode('# No components to generate Terraform code');
    }
  }, [diagramComponents]);
  
  const handleCopyCode = () => {
    navigator.clipboard.writeText(terraformCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const toggleShowCode = () => {
    setShowCode(!showCode);
  };
  
  return (
    <div className="terraform-code-view">
      <h3>Terraform Code Generation</h3>
      <p>
        Generate Infrastructure as Code for your cloud diagram.
        <button 
          className="toggle-code-btn"
          onClick={toggleShowCode}
        >
          {showCode ? 'Hide Code' : 'Show Code'}
        </button>
      </p>
      
      {showCode && (
        <>
          <div className="code-actions">
            <button 
              className={`copy-code-btn ${copied ? 'copied' : ''}`}
              onClick={handleCopyCode}
            >
              {copied ? 'Copied!' : 'Copy Code'}
            </button>
          </div>
          <div className="code-container">
            <pre className="terraform-code">
              {terraformCode}
            </pre>
          </div>
        </>
      )}
    </div>
  );
};

export default TerraformCodeView;