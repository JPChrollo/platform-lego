import React, { useState, useEffect } from 'react';
import './ConfigurationInfoBox.css';

/**
 * ConfigurationInfoBox component for editing component properties
 * @param {Object} props - Component properties
 * @param {Object} props.component - The component being configured
 * @param {Function} props.onConfigUpdate - Callback when config is updated
 * @param {Array} props.allComponents - All components in the diagram (for references)
 * @param {Function} props.onConnectionChange - Callback when connections are updated
 * @returns {JSX.Element} ConfigurationInfoBox component
 */
const ConfigurationInfoBox = ({ component, onConfigUpdate, allComponents = [], onConnectionChange }) => {
  const [config, setConfig] = useState({});
  const [connections, setConnections] = useState({});
  
  // Update local config state when component changes
  useEffect(() => {
    setConfig(component.config || {});
    
    // Extract and set connections from config
    const extractedConnections = {};
    
    // Look for reference fields in the config
    if (component.config) {
      Object.entries(component.config).forEach(([key, value]) => {
        // Check if the value looks like a component reference ID
        if (typeof value === 'string' && value.includes('-')) {
          const referencedComponent = allComponents.find(c => c.id === value);
          if (referencedComponent) {
            extractedConnections[key] = {
              targetId: value,
              type: key,
              sourceId: component.id,
              label: key
            };
          }
        }
      });
    }
    
    setConnections(extractedConnections);
  }, [component, allComponents]);
  
  // Notify parent component when connections change
  useEffect(() => {
    if (onConnectionChange) {
      onConnectionChange(component.id, Object.values(connections));
    }
  }, [connections, component.id, onConnectionChange]);
  
  // Define configurations for different component types
  const ComponentConfigurations = {
    vpc: {
      title: 'VPC Configuration',
      fields: [
        { name: 'Name', label: 'Name', type: 'text', default: 'main-vpc' },
        { name: 'CIDR Block', label: 'CIDR Block', type: 'text', default: '10.0.0.0/16', terraformKey: 'cidr_block' },
        { name: 'Enable DNS Support', label: 'Enable DNS Support', type: 'checkbox', default: true, terraformKey: 'enable_dns_support' },
        { name: 'Enable DNS Hostnames', label: 'Enable DNS Hostnames', type: 'checkbox', default: false, terraformKey: 'enable_dns_hostnames' },
        { name: 'Instance Tenancy', label: 'Instance Tenancy', type: 'select', options: ['default', 'dedicated', 'host'], default: 'default', terraformKey: 'instance_tenancy' },
        { name: 'Tags', label: 'Tags', type: 'tags', default: {}, terraformKey: 'tags' }
      ]
    },
    subnet: {
      title: 'Subnet Configuration',
      fields: [
        { name: 'Name', label: 'Name', type: 'text', default: 'subnet-1' },
        { name: 'CIDR Block', label: 'CIDR Block', type: 'text', default: '10.0.1.0/24', terraformKey: 'cidr_block' },
        { name: 'VPC', label: 'VPC', type: 'reference', refType: 'vpc', default: '', terraformKey: 'vpc_id' },
        { name: 'Availability Zone', label: 'Availability Zone', type: 'text', default: 'us-east-1a', terraformKey: 'availability_zone' },
        { name: 'Map Public IP on Launch', label: 'Map Public IP on Launch', type: 'checkbox', default: false, terraformKey: 'map_public_ip_on_launch' },
        { name: 'Tags', label: 'Tags', type: 'tags', default: {}, terraformKey: 'tags' }
      ]
    },
    'security-group': {
      title: 'Security Group Configuration',
      fields: [
        { name: 'Name', label: 'Name', type: 'text', default: 'security-group-1' },
        { name: 'Description', label: 'Description', type: 'text', default: 'Security Group managed by Terraform', terraformKey: 'description' },
        { name: 'VPC', label: 'VPC', type: 'reference', refType: 'vpc', default: '', terraformKey: 'vpc_id' },
        { name: 'Inbound Rules', label: 'Inbound Rules', type: 'rules', default: [], terraformKey: 'ingress' },
        { name: 'Outbound Rules', label: 'Outbound Rules', type: 'rules', default: [], terraformKey: 'egress' },
        { name: 'Tags', label: 'Tags', type: 'tags', default: {}, terraformKey: 'tags' }
      ]
    },
    ec2: {
      title: 'EC2 Instance Configuration',
      fields: [
        { name: 'Name', label: 'Name', type: 'text', default: 'ec2-instance' },
        { name: 'Instance Type', label: 'Instance Type', type: 'select', options: ['t2.micro', 't2.small', 't2.medium', 't3.micro', 't3.small', 't3.medium'], default: 't2.micro', terraformKey: 'instance_type' },
        { name: 'AMI ID', label: 'AMI ID', type: 'text', default: 'ami-0c55b159cbfafe1f0', terraformKey: 'ami' },
        { name: 'Subnet', label: 'Subnet', type: 'reference', refType: 'subnet', default: '', terraformKey: 'subnet_id' },
        { name: 'Security Group', label: 'Security Group', type: 'reference', refType: 'security-group', default: '', terraformKey: 'vpc_security_group_ids' },
        { name: 'Associate Public IP', label: 'Associate Public IP', type: 'checkbox', default: false, terraformKey: 'associate_public_ip_address' },
        { name: 'Key Pair', label: 'Key Pair', type: 'text', default: '', terraformKey: 'key_name' },
        { name: 'Monitoring', label: 'Monitoring', type: 'checkbox', default: false, terraformKey: 'monitoring' },
        { name: 'User Data', label: 'User Data', type: 'textarea', default: '', terraformKey: 'user_data' },
        { name: 'Tags', label: 'Tags', type: 'tags', default: {}, terraformKey: 'tags' }
      ]
    },
    s3: {
      title: 'S3 Bucket Configuration',
      fields: [
        { name: 'Bucket Name', label: 'Bucket Name', type: 'text', default: 'my-unique-bucket-name', terraformKey: 'bucket' },
        { name: 'Access Control', label: 'Access Control', type: 'select', options: ['private', 'public-read', 'public-read-write', 'authenticated-read'], default: 'private', terraformKey: 'acl' },
        { name: 'Versioning', label: 'Enable Versioning', type: 'checkbox', default: false, terraformKey: 'versioning.enabled' },
        { name: 'Encryption', label: 'Enable Encryption', type: 'checkbox', default: false, terraformKey: 'server_side_encryption_configuration.rule.apply_server_side_encryption_by_default.sse_algorithm' },
        { name: 'Object Lock', label: 'Enable Object Lock', type: 'checkbox', default: false, terraformKey: 'object_lock_enabled' },
        { name: 'Tags', label: 'Tags', type: 'tags', default: {}, terraformKey: 'tags' }
      ]
    },
    rds: {
      title: 'RDS Database Configuration',
      fields: [
        { name: 'Name', label: 'Identifier', type: 'text', default: 'database-1', terraformKey: 'identifier' },
        { name: 'Engine', label: 'Engine', type: 'select', options: ['mysql', 'postgres', 'oracle-se2', 'sqlserver-ex'], default: 'mysql', terraformKey: 'engine' },
        { name: 'Engine Version', label: 'Engine Version', type: 'text', default: '5.7', terraformKey: 'engine_version' },
        { name: 'Instance Class', label: 'Instance Class', type: 'select', options: ['db.t3.micro', 'db.t3.small', 'db.t3.medium', 'db.m5.large'], default: 'db.t3.micro', terraformKey: 'instance_class' },
        { name: 'Allocated Storage', label: 'Allocated Storage (GB)', type: 'number', default: 20, terraformKey: 'allocated_storage' },
        { name: 'Storage Type', label: 'Storage Type', type: 'select', options: ['standard', 'gp2', 'io1'], default: 'gp2', terraformKey: 'storage_type' },
        { name: 'Master Username', label: 'Master Username', type: 'text', default: 'admin', terraformKey: 'username' },
        { name: 'Master Password', label: 'Master Password', type: 'password', default: 'change-me-in-production', terraformKey: 'password' },
        { name: 'VPC', label: 'VPC Security Group', type: 'reference', refType: 'security-group', default: '', terraformKey: 'vpc_security_group_ids' },
        { name: 'Subnet Group', label: 'DB Subnet Group', type: 'text', default: '', terraformKey: 'db_subnet_group_name' },
        { name: 'Multi AZ', label: 'Multi-AZ Deployment', type: 'checkbox', default: false, terraformKey: 'multi_az' },
        { name: 'Tags', label: 'Tags', type: 'tags', default: {}, terraformKey: 'tags' }
      ]
    },
    lambda: {
      title: 'Lambda Function Configuration',
      fields: [
        { name: 'Name', label: 'Function Name', type: 'text', default: 'my-lambda-function', terraformKey: 'function_name' },
        { name: 'Runtime', label: 'Runtime', type: 'select', options: ['nodejs14.x', 'nodejs16.x', 'python3.8', 'python3.9', 'java11', 'dotnet6'], default: 'nodejs14.x', terraformKey: 'runtime' },
        { name: 'Handler', label: 'Handler', type: 'text', default: 'index.handler', terraformKey: 'handler' },
        { name: 'Memory Size', label: 'Memory Size (MB)', type: 'number', default: 128, terraformKey: 'memory_size' },
        { name: 'Timeout', label: 'Timeout (seconds)', type: 'number', default: 3, terraformKey: 'timeout' },
        { name: 'Environment Variables', label: 'Environment Variables', type: 'keyValue', default: {}, terraformKey: 'environment.variables' },
        { name: 'VPC', label: 'VPC', type: 'reference', refType: 'vpc', default: '', terraformKey: 'vpc_config.subnet_ids' },
        { name: 'Security Group', label: 'Security Group', type: 'reference', refType: 'security-group', default: '', terraformKey: 'vpc_config.security_group_ids' },
        { name: 'Subnet', label: 'Subnet', type: 'reference', refType: 'subnet', default: '', terraformKey: 'vpc_config.subnet_ids' },
        { name: 'Tags', label: 'Tags', type: 'tags', default: {}, terraformKey: 'tags' }
      ]
    },
    dynamodb: {
      title: 'DynamoDB Table Configuration',
      fields: [
        { name: 'Name', label: 'Table Name', type: 'text', default: 'my-table', terraformKey: 'name' },
        { name: 'Billing Mode', label: 'Billing Mode', type: 'select', options: ['PROVISIONED', 'PAY_PER_REQUEST'], default: 'PAY_PER_REQUEST', terraformKey: 'billing_mode' },
        { name: 'Hash Key', label: 'Hash Key', type: 'text', default: 'id', terraformKey: 'hash_key' },
        { name: 'Range Key', label: 'Range Key', type: 'text', default: '', terraformKey: 'range_key' },
        { name: 'Read Capacity', label: 'Read Capacity', type: 'number', default: 5, terraformKey: 'read_capacity' },
        { name: 'Write Capacity', label: 'Write Capacity', type: 'number', default: 5, terraformKey: 'write_capacity' },
        { name: 'Point-in-time Recovery', label: 'Point-in-time Recovery', type: 'checkbox', default: false, terraformKey: 'point_in_time_recovery.enabled' },
        { name: 'Encryption Enabled', label: 'Server-Side Encryption', type: 'checkbox', default: true, terraformKey: 'server_side_encryption.enabled' },
        { name: 'TTL Attribute', label: 'TTL Attribute', type: 'text', default: '', terraformKey: 'ttl.attribute_name' },
        { name: 'Tags', label: 'Tags', type: 'tags', default: {}, terraformKey: 'tags' }
      ]
    },
    elb: {
      title: 'Load Balancer Configuration',
      fields: [
        { name: 'Name', label: 'Load Balancer Name', type: 'text', default: 'my-loadbalancer', terraformKey: 'name' },
        { name: 'Load Balancer Type', label: 'Type', type: 'select', options: ['application', 'network', 'gateway'], default: 'application', terraformKey: 'load_balancer_type' },
        { name: 'Internal', label: 'Internal', type: 'checkbox', default: false, terraformKey: 'internal' },
        { name: 'VPC', label: 'VPC', type: 'reference', refType: 'vpc', default: '', terraformKey: 'subnets' },
        { name: 'Subnets', label: 'Subnet', type: 'reference', refType: 'subnet', default: '', terraformKey: 'subnets' },
        { name: 'Security Groups', label: 'Security Group', type: 'reference', refType: 'security-group', default: '', terraformKey: 'security_groups' },
        { name: 'Enable Deletion Protection', label: 'Enable Deletion Protection', type: 'checkbox', default: false, terraformKey: 'enable_deletion_protection' },
        { name: 'Tags', label: 'Tags', type: 'tags', default: {}, terraformKey: 'tags' }
      ]
    },
    cloudtrail: {
      title: 'CloudTrail Configuration',
      fields: [
        { name: 'Name', label: 'Trail Name', type: 'text', default: 'my-trail', terraformKey: 'name' },
        { name: 'S3 Bucket', label: 'S3 Bucket', type: 'reference', refType: 's3', default: '', terraformKey: 's3_bucket_name' },
        { name: 'Include Global Service Events', label: 'Include Global Service Events', type: 'checkbox', default: true, terraformKey: 'include_global_service_events' },
        { name: 'Is Multi-region Trail', label: 'Multi-region Trail', type: 'checkbox', default: true, terraformKey: 'is_multi_region_trail' },
        { name: 'Enable Logging', label: 'Enable Logging', type: 'checkbox', default: true, terraformKey: 'enable_logging' },
        { name: 'Enable Log File Validation', label: 'Enable Log File Validation', type: 'checkbox', default: true, terraformKey: 'enable_log_file_validation' },
        { name: 'Tags', label: 'Tags', type: 'tags', default: {}, terraformKey: 'tags' }
      ]
    },
    'nat-gateway': {
      title: 'NAT Gateway Configuration',
      fields: [
        { name: 'Name', label: 'NAT Gateway Name', type: 'text', default: 'my-nat-gateway', terraformKey: 'name' },
        { name: 'Subnet', label: 'Subnet', type: 'reference', refType: 'subnet', default: '', terraformKey: 'subnet_id' },
        { name: 'Connectivity Type', label: 'Connectivity Type', type: 'select', options: ['public', 'private'], default: 'public', terraformKey: 'connectivity_type' },
        { name: 'Tags', label: 'Tags', type: 'tags', default: {}, terraformKey: 'tags' }
      ]
    },
    'network-acl': {
      title: 'Network ACL Configuration',
      fields: [
        { name: 'Name', label: 'Network ACL Name', type: 'text', default: 'my-network-acl', terraformKey: 'name' },
        { name: 'VPC', label: 'VPC', type: 'reference', refType: 'vpc', default: '', terraformKey: 'vpc_id' },
        { name: 'Subnet Associations', label: 'Subnet Association', type: 'reference', refType: 'subnet', default: '', terraformKey: 'subnet_id' },
        { name: 'Inbound Rules', label: 'Inbound Rules', type: 'rules', default: [], terraformKey: 'ingress' },
        { name: 'Outbound Rules', label: 'Outbound Rules', type: 'rules', default: [], terraformKey: 'egress' },
        { name: 'Tags', label: 'Tags', type: 'tags', default: {}, terraformKey: 'tags' }
      ]
    }
  };
  
  // Get the appropriate configuration fields for the component type
  const componentConfig = ComponentConfigurations[component.type] || {
    title: `${component.type} Configuration`,
    fields: [
      { name: 'Name', label: 'Name', type: 'text', default: component.id }
    ]
  };
  
  /**
   * Handle field change
   * @param {String} name - Field name
   * @param {any} value - Field value
   * @param {String} fieldType - Type of field being changed
   */
  const handleFieldChange = (name, value, fieldType = null) => {
    const updatedConfig = { ...config, [name]: value };
    setConfig(updatedConfig);
    onConfigUpdate(updatedConfig);
    
    // If this is a reference field, update connections
    if (fieldType === 'reference' || componentConfig.fields.some(f => f.name === name && f.type === 'reference')) {
      const updatedConnections = { ...connections };
      
      if (value) {
        // Add or update connection
        updatedConnections[name] = {
          sourceId: component.id,
          targetId: value,
          type: name,
          label: name
        };
      } else {
        // Remove connection if value is empty
        delete updatedConnections[name];
      }
      
      setConnections(updatedConnections);
    }
  };

  /**
   * Handle tag update
   * @param {String} key - Tag key
   * @param {String} value - Tag value
   */
  const handleTagChange = (key, value) => {
    const currentTags = config.Tags || {};
    const updatedTags = { ...currentTags, [key]: value };
    handleFieldChange('Tags', updatedTags);
  };

  /**
   * Remove a tag
   * @param {String} key - Tag key to remove
   */
  const handleRemoveTag = (key) => {
    const currentTags = { ...config.Tags };
    delete currentTags[key];
    handleFieldChange('Tags', currentTags);
  };

  /**
   * Add a new tag
   */
  const handleAddTag = () => {
    handleTagChange(`tag-${Object.keys(config.Tags || {}).length + 1}`, 'value');
  };

  /**
   * Handle rule update for security groups or network ACLs
   * @param {String} fieldName - Field name (Inbound Rules or Outbound Rules)
   * @param {Number} index - Rule index
   * @param {String} property - Rule property
   * @param {any} value - Rule property value
   */
  const handleRuleChange = (fieldName, index, property, value) => {
    const rules = [...(config[fieldName] || [])];
    
    // If the rule doesn't exist yet, create it
    if (!rules[index]) {
      rules[index] = {};
    }
    
    // Update the rule
    rules[index] = { ...rules[index], [property]: value };
    
    // Update the config
    handleFieldChange(fieldName, rules);
  };

  /**
   * Add a new rule
   * @param {String} fieldName - Field name (Inbound Rules or Outbound Rules)
   */
  const handleAddRule = (fieldName) => {
    const rules = [...(config[fieldName] || [])];
    rules.push({
      protocol: 'tcp',
      fromPort: 0,
      toPort: 0,
      cidrBlock: '0.0.0.0/0',
      description: `Rule ${rules.length + 1}`
    });
    handleFieldChange(fieldName, rules);
  };

  /**
   * Remove a rule
   * @param {String} fieldName - Field name (Inbound Rules or Outbound Rules)
   * @param {Number} index - Rule index
   */
  const handleRemoveRule = (fieldName, index) => {
    const rules = [...(config[fieldName] || [])];
    rules.splice(index, 1);
    handleFieldChange(fieldName, rules);
  };
  
  /**
   * Handle key-value update (for environment variables)
   * @param {String} fieldName - Field name
   * @param {String} key - Key
   * @param {String} value - Value
   */
  const handleKeyValueChange = (fieldName, key, value) => {
    const currentData = config[fieldName] || {};
    const updatedData = { ...currentData, [key]: value };
    handleFieldChange(fieldName, updatedData);
  };

  /**
   * Remove a key-value entry
   * @param {String} fieldName - Field name
   * @param {String} key - Key to remove
   */
  const handleRemoveKeyValue = (fieldName, key) => {
    const currentData = { ...config[fieldName] };
    delete currentData[key];
    handleFieldChange(fieldName, currentData);
  };

  /**
   * Add a new key-value entry
   * @param {String} fieldName - Field name
   */
  const handleAddKeyValue = (fieldName) => {
    handleKeyValueChange(fieldName, `key-${Object.keys(config[fieldName] || {}).length + 1}`, 'value');
  };

  /**
   * Render a field based on its type
   * @param {Object} field - Field definition
   * @returns {JSX.Element} Field input element
   */
  const renderField = (field) => {
    const value = config[field.name] !== undefined ? config[field.name] : field.default;
    
    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className="form-input"
          />
        );
      
      case 'number':
        return (
          <input
            type="number"
            value={value || 0}
            onChange={(e) => handleFieldChange(field.name, parseInt(e.target.value, 10) || 0)}
            className="form-input"
          />
        );
      
      case 'password':
        return (
          <input
            type="password"
            value={value || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className="form-input"
          />
        );
      
      case 'checkbox':
        return (
          <input
            type="checkbox"
            checked={value || false}
            onChange={(e) => handleFieldChange(field.name, e.target.checked)}
            className="form-checkbox"
          />
        );
      
      case 'select':
        return (
          <select
            value={value || field.default}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className="form-select"
          >
            {field.options.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );
      
      case 'textarea':
        return (
          <textarea
            value={value || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className="form-textarea"
            rows={5}
          />
        );
      
      case 'tags':
        return (
          <div className="tags-container">
            {Object.entries(value || {}).map(([key, tagValue]) => (
              <div key={key} className="tag-item">
                <input
                  type="text"
                  value={key}
                  onChange={(e) => {
                    const newKey = e.target.value;
                    const newValue = value[key];
                    handleRemoveTag(key);
                    handleTagChange(newKey, newValue);
                  }}
                  className="tag-key"
                  placeholder="Key"
                />
                <input
                  type="text"
                  value={tagValue}
                  onChange={(e) => handleTagChange(key, e.target.value)}
                  className="tag-value"
                  placeholder="Value"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveTag(key)}
                  className="tag-remove"
                >
                  ×
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddTag}
              className="add-button"
            >
              + Add Tag
            </button>
          </div>
        );
      
      case 'reference':
        // Get available components for reference
        const availableRefs = allComponents.filter(c => {
          // Filter by component type and exclude self-references
          if (c.id === component.id) return false;
          
          // If refType contains multiple types (comma-separated), check if component type is in the list
          if (field.refType.includes(',')) {
            const types = field.refType.split(',').map(t => t.trim());
            return types.includes(c.type);
          }
          
          // Otherwise, check if component type matches the refType
          return c.type === field.refType;
        });
        
        // Group components by type for better organization
        const groupedRefs = availableRefs.reduce((acc, ref) => {
          const type = ref.type;
          if (!acc[type]) {
            acc[type] = [];
          }
          acc[type].push(ref);
          return acc;
        }, {});
        
        return (
          <select
            value={value || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value, 'reference')}
            className="form-select"
          >
            <option value="">-- Select a component --</option>
            {Object.entries(groupedRefs).map(([type, refs]) => (
              <optgroup key={type} label={type.charAt(0).toUpperCase() + type.slice(1)}>
                {refs.map(ref => (
                  <option key={ref.id} value={ref.id}>
                    {ref.config.Name || ref.id} ({ref.type})
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        );
      
      case 'rules':
        const rules = value || [];
        
        return (
          <div className="rules-container">
            {rules.map((rule, index) => (
              <div key={index} className="rule-item">
                <div className="rule-header">
                  <span>Rule {index + 1}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveRule(field.name, index)}
                    className="rule-remove"
                  >
                    ×
                  </button>
                </div>
                <div className="rule-fields">
                  <div className="rule-field">
                    <label>Protocol:</label>
                    <select
                      value={rule.protocol || 'tcp'}
                      onChange={(e) => handleRuleChange(field.name, index, 'protocol', e.target.value)}
                      className="rule-input"
                    >
                      <option value="tcp">TCP</option>
                      <option value="udp">UDP</option>
                      <option value="icmp">ICMP</option>
                      <option value="-1">All</option>
                    </select>
                  </div>
                  
                  {rule.protocol !== 'icmp' && rule.protocol !== '-1' && (
                    <>
                      <div className="rule-field">
                        <label>From Port:</label>
                        <input
                          type="number"
                          value={rule.fromPort || 0}
                          onChange={(e) => handleRuleChange(field.name, index, 'fromPort', parseInt(e.target.value, 10) || 0)}
                          className="rule-input"
                        />
                      </div>
                      <div className="rule-field">
                        <label>To Port:</label>
                        <input
                          type="number"
                          value={rule.toPort || 0}
                          onChange={(e) => handleRuleChange(field.name, index, 'toPort', parseInt(e.target.value, 10) || 0)}
                          className="rule-input"
                        />
                      </div>
                    </>
                  )}
                  
                  <div className="rule-field">
                    <label>CIDR Block:</label>
                    <input
                      type="text"
                      value={rule.cidrBlock || '0.0.0.0/0'}
                      onChange={(e) => handleRuleChange(field.name, index, 'cidrBlock', e.target.value)}
                      className="rule-input"
                    />
                  </div>
                  
                  <div className="rule-field">
                    <label>Description:</label>
                    <input
                      type="text"
                      value={rule.description || ''}
                      onChange={(e) => handleRuleChange(field.name, index, 'description', e.target.value)}
                      className="rule-input"
                    />
                  </div>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => handleAddRule(field.name)}
              className="add-button"
            >
              + Add Rule
            </button>
          </div>
        );
      
      case 'keyValue':
        const keyValues = value || {};
        
        return (
          <div className="key-value-container">
            {Object.entries(keyValues).map(([key, kvValue]) => (
              <div key={key} className="key-value-item">
                <input
                  type="text"
                  value={key}
                  onChange={(e) => {
                    const newKey = e.target.value;
                    const newValue = keyValues[key];
                    handleRemoveKeyValue(field.name, key);
                    handleKeyValueChange(field.name, newKey, newValue);
                  }}
                  className="key-value-key"
                  placeholder="Key"
                />
                <input
                  type="text"
                  value={kvValue}
                  onChange={(e) => handleKeyValueChange(field.name, key, e.target.value)}
                  className="key-value-value"
                  placeholder="Value"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveKeyValue(field.name, key)}
                  className="key-value-remove"
                >
                  ×
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => handleAddKeyValue(field.name)}
              className="add-button"
            >
              + Add Variable
            </button>
          </div>
        );
      
      default:
        return <span>Unknown field type: {field.type}</span>;
    }
  };

  return (
    <div className="configuration-info-box">
      <h3>{componentConfig.title}</h3>
      <p className="component-id">Component ID: {component.id}</p>
      
      <div className="configuration-fields">
        {componentConfig.fields.map((field) => (
          <div key={field.name} className="configuration-field">
            <label htmlFor={field.name}>{field.label}:</label>
            {renderField(field)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConfigurationInfoBox;