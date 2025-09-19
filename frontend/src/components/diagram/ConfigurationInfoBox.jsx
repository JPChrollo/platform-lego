import React, { useState, useEffect, useRef } from 'react';
import './ConfigurationInfoBox.css';
import { generateTerraformCode } from '../../utils/terraformGenerator';

// Configuration options for AWS components with Terraform mapping
const componentConfigurations = {
  ec2: [
    { name: 'Name', type: 'text', required: true, tfVar: 'tags.Name' },
    { name: 'Instance Type', type: 'select', options: ['t2.micro', 't2.small', 't2.medium', 't3.micro', 't3.small', 'm5.large'], required: true, tfVar: 'instance_type' },
    { name: 'AMI ID', type: 'text', required: true, tfVar: 'ami' },
    { name: 'Security Group', type: 'reference', required: true, tfVar: 'vpc_security_group_ids', refType: 'security-group' },
    { name: 'Key Pair', type: 'text', required: false, tfVar: 'key_name' },
    { name: 'Subnet', type: 'reference', required: true, tfVar: 'subnet_id', refType: 'subnet' },
    { name: 'User Data', type: 'textarea', required: false, tfVar: 'user_data' },
    { name: 'Associate Public IP', type: 'boolean', required: false, tfVar: 'associate_public_ip_address', defaultValue: false },
    { name: 'Monitoring', type: 'boolean', required: false, tfVar: 'monitoring', defaultValue: false },
    { name: 'Tags', type: 'tags', required: false, tfVar: 'tags' }
  ],
  's3': [
    { name: 'Bucket Name', type: 'text', required: true, tfVar: 'bucket' },
    { name: 'Region', type: 'select', options: ['us-east-1', 'us-east-2', 'us-west-1', 'us-west-2', 'eu-west-1', 'eu-central-1', 'ap-northeast-1', 'ap-southeast-1', 'ap-southeast-2'], required: true },
    { name: 'Access Control', type: 'select', options: ['private', 'public-read', 'public-read-write', 'authenticated-read'], required: true, tfVar: 'acl' },
    { name: 'Versioning', type: 'boolean', required: false, tfVar: 'versioning.enabled', defaultValue: false },
    { name: 'Encryption', type: 'boolean', required: false, tfVar: 'server_side_encryption_configuration', defaultValue: false },
    { name: 'Object Lock', type: 'boolean', required: false, tfVar: 'object_lock_enabled', defaultValue: false },
    { name: 'Tags', type: 'tags', required: false, tfVar: 'tags' }
  ],
  'vpc': [
    { name: 'Name', type: 'text', required: true, tfVar: 'tags.Name' },
    { name: 'CIDR Block', type: 'text', required: true, tfVar: 'cidr_block', defaultValue: '10.0.0.0/16' },
    { name: 'Enable DNS Support', type: 'boolean', required: false, tfVar: 'enable_dns_support', defaultValue: true },
    { name: 'Enable DNS Hostnames', type: 'boolean', required: false, tfVar: 'enable_dns_hostnames', defaultValue: false },
    { name: 'Instance Tenancy', type: 'select', options: ['default', 'dedicated'], required: false, tfVar: 'instance_tenancy', defaultValue: 'default' },
    { name: 'Tags', type: 'tags', required: false, tfVar: 'tags' }
  ],
  'subnet': [
    { name: 'Name', type: 'text', required: true, tfVar: 'tags.Name' },
    { name: 'VPC', type: 'reference', required: true, tfVar: 'vpc_id', refType: 'vpc' },
    { name: 'CIDR Block', type: 'text', required: true, tfVar: 'cidr_block' },
    { name: 'Availability Zone', type: 'select', options: ['us-east-1a', 'us-east-1b', 'us-east-1c', 'us-east-2a', 'us-east-2b', 'us-west-1a', 'us-west-1b', 'us-west-2a', 'us-west-2b', 'us-west-2c', 'eu-west-1a', 'eu-west-1b', 'eu-west-1c', 'eu-central-1a', 'eu-central-1b'], required: true, tfVar: 'availability_zone' },
    { name: 'Map Public IP on Launch', type: 'boolean', required: false, tfVar: 'map_public_ip_on_launch', defaultValue: false },
    { name: 'Tags', type: 'tags', required: false, tfVar: 'tags' }
  ],
  'security-group': [
    { name: 'Name', type: 'text', required: true, tfVar: 'name' },
    { name: 'Description', type: 'text', required: true, tfVar: 'description', defaultValue: 'Security Group managed by Terraform' },
    { name: 'VPC', type: 'reference', required: true, tfVar: 'vpc_id', refType: 'vpc' },
    { name: 'Inbound Rules', type: 'inboundRules', required: false, tfVar: 'ingress' },
    { name: 'Outbound Rules', type: 'outboundRules', required: false, tfVar: 'egress' },
    { name: 'Tags', type: 'tags', required: false, tfVar: 'tags' }
  ],
  'rds': [
    { name: 'Name', type: 'text', required: true, tfVar: 'identifier' },
    { name: 'Engine', type: 'select', options: ['mysql', 'postgres', 'mariadb', 'oracle-ee', 'sqlserver-ee'], required: true, tfVar: 'engine' },
    { name: 'Engine Version', type: 'text', required: true, tfVar: 'engine_version' },
    { name: 'Instance Class', type: 'select', options: ['db.t3.micro', 'db.t3.small', 'db.t3.medium', 'db.m5.large'], required: true, tfVar: 'instance_class' },
    { name: 'Allocated Storage', type: 'text', required: true, tfVar: 'allocated_storage', defaultValue: '20' },
    { name: 'Storage Type', type: 'select', options: ['standard', 'gp2', 'io1'], required: false, tfVar: 'storage_type', defaultValue: 'gp2' },
    { name: 'Master Username', type: 'text', required: true, tfVar: 'username' },
    { name: 'Master Password', type: 'text', required: true, tfVar: 'password' },
    { name: 'Multi AZ', type: 'boolean', required: false, tfVar: 'multi_az', defaultValue: false },
    { name: 'VPC', type: 'reference', required: true, tfVar: 'vpc_security_group_ids', refType: 'vpc' },
    { name: 'Subnet Group', type: 'reference', required: false, tfVar: 'db_subnet_group_name' },
    { name: 'Tags', type: 'tags', required: false, tfVar: 'tags' }
  ],
  'lambda': [
    { name: 'Name', type: 'text', required: true, tfVar: 'function_name' },
    { name: 'Runtime', type: 'select', options: ['nodejs14.x', 'nodejs16.x', 'python3.8', 'python3.9', 'java11', 'dotnetcore3.1', 'go1.x'], required: true, tfVar: 'runtime' },
    { name: 'Handler', type: 'text', required: true, tfVar: 'handler', defaultValue: 'index.handler' },
    { name: 'Memory Size', type: 'text', required: false, tfVar: 'memory_size', defaultValue: '128' },
    { name: 'Timeout', type: 'text', required: false, tfVar: 'timeout', defaultValue: '3' },
    { name: 'Environment Variables', type: 'tags', required: false, tfVar: 'environment.variables' },
    { name: 'VPC', type: 'reference', required: false, tfVar: 'vpc_config.vpc_id', refType: 'vpc' },
    { name: 'Security Group', type: 'reference', required: false, tfVar: 'vpc_config.security_group_ids', refType: 'security-group' },
    { name: 'Subnet', type: 'reference', required: false, tfVar: 'vpc_config.subnet_ids', refType: 'subnet' },
    { name: 'Tags', type: 'tags', required: false, tfVar: 'tags' }
  ],
  'dynamodb': [
    { name: 'Name', type: 'text', required: true, tfVar: 'name' },
    { name: 'Billing Mode', type: 'select', options: ['PROVISIONED', 'PAY_PER_REQUEST'], required: false, tfVar: 'billing_mode', defaultValue: 'PAY_PER_REQUEST' },
    { name: 'Read Capacity', type: 'text', required: false, tfVar: 'read_capacity', defaultValue: '5' },
    { name: 'Write Capacity', type: 'text', required: false, tfVar: 'write_capacity', defaultValue: '5' },
    { name: 'Hash Key', type: 'text', required: true, tfVar: 'hash_key' },
    { name: 'Range Key', type: 'text', required: false, tfVar: 'range_key' },
    { name: 'TTL Attribute', type: 'text', required: false, tfVar: 'ttl.attribute_name' },
    { name: 'Point-in-time Recovery', type: 'boolean', required: false, tfVar: 'point_in_time_recovery.enabled', defaultValue: false },
    { name: 'Encryption Enabled', type: 'boolean', required: false, tfVar: 'server_side_encryption.enabled', defaultValue: false },
    { name: 'Tags', type: 'tags', required: false, tfVar: 'tags' }
  ],
  'elb': [
    { name: 'Name', type: 'text', required: true, tfVar: 'name' },
    { name: 'Load Balancer Type', type: 'select', options: ['application', 'network', 'gateway'], required: true, tfVar: 'load_balancer_type', defaultValue: 'application' },
    { name: 'Internal', type: 'boolean', required: false, tfVar: 'internal', defaultValue: false },
    { name: 'VPC', type: 'reference', required: true, tfVar: 'vpc_id', refType: 'vpc' },
    { name: 'Subnets', type: 'reference', required: true, tfVar: 'subnets', refType: 'subnet' },
    { name: 'Security Groups', type: 'reference', required: false, tfVar: 'security_groups', refType: 'security-group' },
    { name: 'Enable Deletion Protection', type: 'boolean', required: false, tfVar: 'enable_deletion_protection', defaultValue: false },
    { name: 'Tags', type: 'tags', required: false, tfVar: 'tags' }
  ],
  'cloudtrail': [
    { name: 'Name', type: 'text', required: true, tfVar: 'name' },
    { name: 'S3 Bucket', type: 'reference', required: true, tfVar: 's3_bucket_name', refType: 's3' },
    { name: 'Enable Log File Validation', type: 'boolean', required: false, tfVar: 'enable_log_file_validation', defaultValue: true },
    { name: 'Include Global Service Events', type: 'boolean', required: false, tfVar: 'include_global_service_events', defaultValue: true },
    { name: 'Is Multi-region Trail', type: 'boolean', required: false, tfVar: 'is_multi_region_trail', defaultValue: true },
    { name: 'Enable Logging', type: 'boolean', required: false, tfVar: 'enable_logging', defaultValue: true },
    { name: 'Tags', type: 'tags', required: false, tfVar: 'tags' }
  ],
  'nat-gateway': [
    { name: 'Name', type: 'text', required: true, tfVar: 'tags.Name' },
    { name: 'Subnet', type: 'reference', required: true, tfVar: 'subnet_id', refType: 'subnet' },
    { name: 'Connectivity Type', type: 'select', options: ['public', 'private'], required: false, tfVar: 'connectivity_type', defaultValue: 'public' },
    { name: 'Tags', type: 'tags', required: false, tfVar: 'tags' }
  ],
  'network-acl': [
    { name: 'Name', type: 'text', required: true, tfVar: 'tags.Name' },
    { name: 'VPC', type: 'reference', required: true, tfVar: 'vpc_id', refType: 'vpc' },
    { name: 'Subnet Associations', type: 'reference', required: false, tfVar: 'subnet_ids', refType: 'subnet' },
    { name: 'Inbound Rules', type: 'inboundRules', required: false, tfVar: 'ingress' },
    { name: 'Outbound Rules', type: 'outboundRules', required: false, tfVar: 'egress' },
    { name: 'Tags', type: 'tags', required: false, tfVar: 'tags' }
  ]
};

// Default configurations for any component not listed above
const defaultConfigurations = [
  { name: 'Name', type: 'text', required: true },
  { name: 'Description', type: 'textarea', required: false }
];

const ConfigurationInfoBox = ({ 
  component, 
  position, 
  onSave, 
  onClose, 
  availableReferences,
  onConnectionsChange
}) => {
  // Get the base component type from the component id
  const componentType = component.id.split('-')[0];
  
  // Get the configuration options for this component
  const configOptions = componentConfigurations[componentType] || defaultConfigurations;
  
  // Initialize state for configuration values
  const [configValues, setConfigValues] = useState({});
  const [validationErrors, setValidationErrors] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [connections, setConnections] = useState([]);
  
  // Create ref for the ConfigurationInfoBox
  const configBoxRef = useRef(null);

  // Initialize config values from component or with defaults
  useEffect(() => {
    const initialValues = {};
    configOptions.forEach(option => {
      initialValues[option.name] = component.config?.[option.name] || '';
    });
    setConfigValues(initialValues);
    setValidationErrors({});
    setIsSubmitted(false);
    
    // Initialize connections based on reference fields
    const initialConnections = [];
    configOptions.forEach(option => {
      if (option.type === 'reference' && component.config?.[option.name]) {
        const targetId = component.config[option.name];
        initialConnections.push({
          sourceId: component.id,
          targetId: targetId,
          type: option.name.toLowerCase(),
          refType: option.refType
        });
      }
    });
    setConnections(initialConnections);
    
    // Notify parent component about connections
    if (onConnectionsChange && initialConnections.length > 0) {
      onConnectionsChange(component.id, initialConnections);
    }
  }, [component, onConnectionsChange]);

  // Stop event propagation to prevent diagram deselection when interacting with the config box
  const stopEventPropagation = (e) => {
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
  };

  // Effect to add event listeners to prevent canvas interactions while working in the config box
  useEffect(() => {
    const configBox = configBoxRef.current;
    if (configBox) {
      // Capture click events to prevent them from propagating to the canvas
      const preventPropagation = (e) => {
        stopEventPropagation(e);
      };
      
      configBox.addEventListener('mousedown', preventPropagation);
      configBox.addEventListener('click', preventPropagation);
      
      return () => {
        configBox.removeEventListener('mousedown', preventPropagation);
        configBox.removeEventListener('click', preventPropagation);
      };
    }
  }, []);

  // Update a configuration value
  const handleConfigChange = (name, value) => {
    // Update local state
    setConfigValues(prevValues => ({
      ...prevValues,
      [name]: value
    }));
    
    // Clear validation error for this field if it exists
    if (validationErrors[name]) {
      setValidationErrors(prevErrors => ({
        ...prevErrors,
        [name]: null
      }));
    }
    
    // Check if this is a reference field and update connections
    const option = configOptions.find(opt => opt.name === name);
    if (option && option.type === 'reference') {
      // Update connections for this reference field
      setConnections(prevConnections => {
        // Filter out any existing connection for this field
        const filteredConnections = prevConnections.filter(
          conn => !(conn.sourceId === component.id && conn.type === name.toLowerCase())
        );
        
        // Add the new connection if a value is selected
        if (value) {
          const newConnection = {
            sourceId: component.id,
            targetId: value,
            type: name.toLowerCase(),
            refType: option.refType
          };
          
          // Notify parent component about connection changes
          if (onConnectionsChange) {
            onConnectionsChange(component.id, [...filteredConnections, newConnection]);
          }
          
          return [...filteredConnections, newConnection];
        } else {
          // If value is empty, just remove the connection
          if (onConnectionsChange) {
            onConnectionsChange(component.id, filteredConnections);
          }
          
          return filteredConnections;
        }
      });
    }
  };

  // Validate all fields
  const validateFields = () => {
    const errors = {};
    let isValid = true;
    
    configOptions.forEach(option => {
      if (option.required && (!configValues[option.name] || configValues[option.name] === '')) {
        errors[option.name] = 'This field is required';
        isValid = false;
      }
    });
    
    setValidationErrors(errors);
    return isValid;
  };

  // Handle save button click
  const handleSave = () => {
    setIsSubmitted(true);
    
    if (validateFields()) {
      onSave(component.id, configValues);
      
      // Update connections based on all reference fields in the saved configuration
      const updatedConnections = [];
      configOptions.forEach(option => {
        if (option.type === 'reference' && configValues[option.name]) {
          updatedConnections.push({
            sourceId: component.id,
            targetId: configValues[option.name],
            type: option.name.toLowerCase(),
            refType: option.refType
          });
        }
      });
      
      setConnections(updatedConnections);
      
      // Notify parent component about updated connections
      if (onConnectionsChange) {
        onConnectionsChange(component.id, updatedConnections);
      }
    }
  };

  // Handle form submission (prevent default behavior)
  const handleFormSubmit = (e) => {
    e.preventDefault();
    stopEventPropagation(e);
    // Don't actually submit the form
    return false;
  };
  
  return (
    <div 
      ref={configBoxRef}
      className="configuration-info-box"
      style={{
        left: `${position.x + 100}px`,
        top: `${position.y}px`
      }}
      // Stop all click events to prevent the canvas onClick from firing
      onClick={(e) => {
        stopEventPropagation(e);
      }}
      // Add mousedown handler to prevent canvas from receiving clicks
      onMouseDown={(e) => {
        stopEventPropagation(e);
      }}
    >
      <form onSubmit={handleFormSubmit} onClick={stopEventPropagation} onMouseDown={stopEventPropagation}>
      <div className="config-header">
        <h3>{component.name}</h3>
        <button 
          className="close-config-btn" 
          onClick={(e) => {
            stopEventPropagation(e);
            onClose();
          }}
        >×</button>
      </div>
      
      <div className="config-content">
        {configOptions.map(option => (
          <div 
            key={option.name}
            className={`config-field ${validationErrors[option.name] ? 'has-error' : ''}`}
          >
            <label>
              {option.name}
              {option.required && <span className="required-mark"> (Required)</span>}
            </label>
            
            {option.type === 'text' && (
              <input
                type="text"
                value={configValues[option.name] || (option.defaultValue !== undefined ? option.defaultValue : '')}
                onChange={(e) => {
                  stopEventPropagation(e);
                  handleConfigChange(option.name, e.target.value);
                }}
                onClick={stopEventPropagation}
                onMouseDown={stopEventPropagation}
                onFocus={stopEventPropagation}
                onBlur={stopEventPropagation}
                className={validationErrors[option.name] ? 'error' : ''}
              />
            )}
            
            {option.type === 'textarea' && (
              <textarea
                value={configValues[option.name] || (option.defaultValue !== undefined ? option.defaultValue : '')}
                onChange={(e) => {
                  stopEventPropagation(e);
                  handleConfigChange(option.name, e.target.value);
                }}
                onClick={stopEventPropagation}
                onMouseDown={stopEventPropagation}
                onFocus={stopEventPropagation}
                onBlur={stopEventPropagation}
                className={validationErrors[option.name] ? 'error' : ''}
              />
            )}
            
            {option.type === 'select' && (
              <select
                value={configValues[option.name] || (option.defaultValue !== undefined ? option.defaultValue : '')}
                onChange={(e) => {
                  stopEventPropagation(e);
                  handleConfigChange(option.name, e.target.value);
                }}
                onClick={stopEventPropagation}
                onMouseDown={stopEventPropagation}
                onFocus={stopEventPropagation}
                onBlur={stopEventPropagation}
                className={validationErrors[option.name] ? 'error' : ''}
              >
                <option value="">Select...</option>
                {option.options.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            )}
            
            {option.type === 'boolean' && (
              <div className="checkbox-wrapper" onClick={stopEventPropagation}>
                <input
                  type="checkbox"
                  checked={configValues[option.name] !== undefined ? configValues[option.name] : (option.defaultValue || false)}
                  onChange={(e) => {
                    stopEventPropagation(e);
                    handleConfigChange(option.name, e.target.checked);
                  }}
                  onClick={stopEventPropagation}
                  onMouseDown={stopEventPropagation}
                  onFocus={stopEventPropagation}
                />
                <span onClick={stopEventPropagation}>Enable</span>
              </div>
            )}
            
            {option.type === 'reference' && (
              <select
                value={configValues[option.name] || ''}
                onChange={(e) => {
                  stopEventPropagation(e);
                  const selectedValue = e.target.value;
                  const selectedRef = availableReferences?.find(ref => ref.id === selectedValue);
                  
                  // Store both the ID and name of the referenced component
                  handleConfigChange(option.name, selectedValue);
                  
                  // Add the component name as a separate field for Terraform data source reference
                  if (selectedRef) {
                    handleConfigChange(`${option.name}_name`, selectedRef.name || '');
                  }
                }}
                onClick={stopEventPropagation}
                onMouseDown={stopEventPropagation}
                onFocus={stopEventPropagation}
                onBlur={stopEventPropagation}
                className={validationErrors[option.name] ? 'error' : ''}
              >
                <option value="">Select...</option>
                {(() => {
                  // Filter references by type
                  const filteredRefs = availableReferences?.filter(
                    ref => {
                      if (!option.refType) return true;
                      
                      const refType = ref.id.split('-')[0];
                      return refType === option.refType;
                    }
                  ) || [];
                  
                  // Group references by type for better organization
                  const refsByType = {};
                  filteredRefs.forEach(ref => {
                    const type = ref.id.split('-')[0] || 'unknown';
                    if (!refsByType[type]) {
                      refsByType[type] = [];
                    }
                    refsByType[type].push(ref);
                  });
                  
                  // Convert the grouped references into optgroup elements
                  return Object.entries(refsByType).map(([type, refs]) => (
                    <optgroup key={type} label={type.toUpperCase()}>
                      {refs.map(ref => (
                        <option key={ref.id} value={ref.id}>{ref.name || ref.id}</option>
                      ))}
                    </optgroup>
                  ));
                })()}
              </select>
            )}
            
            {option.type === 'tags' && (
              <div className="tags-field">
                <button 
                  className="configure-tags-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    // This would be implemented with a modal to configure tags
                    const tags = prompt('Enter tags as key=value pairs, separated by commas:');
                    if (tags) {
                      const tagsObj = {};
                      tags.split(',').forEach(tag => {
                        const [key, value] = tag.trim().split('=');
                        if (key && value) {
                          tagsObj[key] = value;
                        }
                      });
                      handleConfigChange(option.name, tagsObj);
                    }
                  }}
                >
                  Configure Tags
                </button>
                {configValues[option.name] && Object.keys(configValues[option.name]).length > 0 && (
                  <div className="tags-preview">
                    {Object.entries(configValues[option.name]).map(([key, value]) => (
                      <span key={key} className="tag-item">
                        {key}={value}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {(option.type === 'inboundRules' || option.type === 'outboundRules') && (
              <div className="rules-field">
                <button 
                  className="configure-rules-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Basic implementation - would be better with a modal
                    const ruleType = option.type === 'inboundRules' ? 'inbound' : 'outbound';
                    const currentRules = configValues[option.name] || [];
                    
                    // Simple prompt-based rule configuration (would be better with a modal)
                    const protocol = prompt(`Enter protocol for ${ruleType} rule (tcp, udp, icmp, -1 for all):`, 'tcp');
                    if (!protocol) return;
                    
                    const fromPort = prompt(`Enter from port for ${ruleType} rule:`, ruleType === 'inbound' ? '22' : '0');
                    if (fromPort === null) return;
                    
                    const toPort = prompt(`Enter to port for ${ruleType} rule:`, ruleType === 'inbound' ? '22' : '0');
                    if (toPort === null) return;
                    
                    const cidrBlock = prompt(`Enter CIDR block for ${ruleType} rule:`, '0.0.0.0/0');
                    if (cidrBlock === null) return;
                    
                    const description = prompt(`Enter description for ${ruleType} rule:`, 
                      ruleType === 'inbound' ? 'Allow inbound traffic' : 'Allow outbound traffic');
                    if (description === null) return;
                    
                    const newRule = {
                      protocol,
                      fromPort: parseInt(fromPort),
                      toPort: parseInt(toPort),
                      cidrBlock,
                      description
                    };
                    
                    handleConfigChange(option.name, [...currentRules, newRule]);
                  }}
                >
                  Add Rule
                </button>
                {configValues[option.name] && configValues[option.name].length > 0 && (
                  <div className="rules-list">
                    {configValues[option.name].map((rule, index) => (
                      <div key={index} className="rule-item">
                        {rule.description || `Rule ${index + 1}`}: {rule.protocol} {rule.fromPort}-{rule.toPort} from {rule.cidrBlock}
                        <button 
                          className="remove-rule-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            const newRules = [...configValues[option.name]];
                            newRules.splice(index, 1);
                            handleConfigChange(option.name, newRules);
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {option.type === 'complex' && (
              <div className="complex-field">
                <button 
                  className="configure-complex-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    alert(`Configure ${option.name} - Not implemented in this prototype`);
                  }}
                >
                  Configure {option.name}
                </button>
              </div>
            )}
            
            {validationErrors[option.name] && (
              <div className="error-message">{validationErrors[option.name]}</div>
            )}
          </div>
        ))}
      </div>
      
      <div className="config-actions">
        <button 
          className="save-config-btn"
          onClick={(e) => {
            stopEventPropagation(e);
            handleSave();
          }}
        >
          Save
        </button>
      </div>
      </form>
    </div>
  );
};

export default ConfigurationInfoBox;