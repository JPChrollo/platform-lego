/**
 * Terraform code generator utility for cloud components
 * This module provides functions to generate Terraform code based on diagram components
 */

/**
 * Helper function to generate tags block for AWS resources
 * @param {Object} config - Component configuration
 * @param {String} defaultName - Default name if not specified
 * @returns {String} Terraform tags block
 */
const generateTagsBlock = (config, defaultName) => {
  const name = config.Name || defaultName;
  
  if (config.Tags) {
    return `
  tags = {
    Name = "${name}"
    ${Object.entries(config.Tags).map(([key, value]) => `    ${key} = "${value}"`).join('\n')}
  }`;
  } else {
    return `
  tags = {
    Name = "${name}"
  }`;
  }
};

/**
 * Helper function to find referenced component
 * @param {String} referenceId - The referenced component ID
 * @param {String} referenceName - The referenced component name (if available)
 * @param {Array} allComponents - All components in the diagram
 * @param {String} defaultRefType - Default reference type if not found
 * @returns {Object} Terraform reference data including data source and reference string
 */
const resolveReference = (referenceId, referenceName, allComponents, defaultRefType = 'main') => {
  if (!referenceId) {
    return {
      dataSource: '',
      reference: `aws_${defaultRefType}.${defaultRefType}.id`
    };
  }
  
  const refComponent = allComponents.find(c => c.id === referenceId);
  
  if (refComponent) {
    const refType = refComponent.id.split('-')[0];
    const refName = referenceName || refComponent.name || refComponent.id;
    const sanitizedRefName = refName.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
    
    // Generate data source lookup
    const dataSource = `
data "aws_${refType}" "${sanitizedRefName}" {
  name = "${refName}"
}`;
    
    return {
      dataSource,
      reference: `data.aws_${refType}.${sanitizedRefName}.id`
    };
  }
  
  return {
    dataSource: '',
    reference: `aws_${defaultRefType}.${defaultRefType}.id`
  };
};

/**
 * Generates AWS VPC Terraform code
 * @param {Object} component - The VPC component with configuration
 * @returns {String} Terraform code for AWS VPC
 */
export const generateVPCTerraform = (component) => {
  const config = component.config || {};
  const name = config.Name || 'main';
  const cidrBlock = config['CIDR Block'] || '10.0.0.0/16';
  const enableDnsSupport = config['Enable DNS Support'] === undefined ? true : config['Enable DNS Support'];
  const enableDnsHostnames = config['Enable DNS Hostnames'] === undefined ? false : config['Enable DNS Hostnames'];
  const instanceTenancy = config['Instance Tenancy'] || 'default';

  // Generate tags
  const tagsBlock = generateTagsBlock(config, name);

  return `resource "aws_vpc" "${component.id}" {
  cidr_block           = "${cidrBlock}"
  instance_tenancy     = "${instanceTenancy}"
  enable_dns_support   = ${enableDnsSupport}
  enable_dns_hostnames = ${enableDnsHostnames}${tagsBlock}
}`;
};

/**
 * Generates AWS Subnet Terraform code
 * @param {Object} component - The Subnet component with configuration
 * @param {Array} allComponents - All diagram components (to resolve references)
 * @returns {String} Terraform code for AWS Subnet
 */
export const generateSubnetTerraform = (component, allComponents) => {
  const config = component.config || {};
  const name = config.Name || `subnet-${component.id}`;
  const cidrBlock = config['CIDR Block'] || '10.0.1.0/24';
  const availabilityZone = config['Availability Zone'] || 'us-east-1a';
  const mapPublicIp = config['Map Public IP on Launch'] === undefined ? false : config['Map Public IP on Launch'];
  
  // Resolve VPC reference
  const { dataSource, reference } = resolveReference(config.VPC, config.VPC_name, allComponents, 'vpc');
  
  // Generate tags
  const tagsBlock = generateTagsBlock(config, name);

  return `${dataSource}

resource "aws_subnet" "${component.id}" {
  vpc_id                  = ${reference}
  cidr_block              = "${cidrBlock}"
  availability_zone       = "${availabilityZone}"
  map_public_ip_on_launch = ${mapPublicIp}${tagsBlock}
}`;
};

/**
 * Generates AWS Security Group Terraform code
 * @param {Object} component - The Security Group component with configuration
 * @param {Array} allComponents - All diagram components (to resolve references)
 * @returns {String} Terraform code for AWS Security Group
 */
export const generateSecurityGroupTerraform = (component, allComponents) => {
  const config = component.config || {};
  const name = config.Name || `sg-${component.id}`;
  const description = config.Description || 'Security Group managed by Terraform';
  
  // Resolve VPC reference with data source
  const { dataSource, reference } = resolveReference(config.VPC, config.VPC_name, allComponents, 'vpc');

  // Generate tags
  const tagsBlock = generateTagsBlock(config, name);

  // Generate base security group
  const securityGroupCode = `${dataSource}

resource "aws_security_group" "${component.id}" {
  name        = "${name}"
  description = "${description}"
  vpc_id      = ${reference}${tagsBlock}
}`;

  // Generate ingress rules if defined
  let ingressRulesCode = '';
  if (config['Inbound Rules'] && Array.isArray(config['Inbound Rules'])) {
    ingressRulesCode = config['Inbound Rules'].map((rule, index) => {
      const protocol = rule.protocol || 'tcp';
      const fromPort = rule.fromPort || 0;
      const toPort = rule.toPort || 0;
      const cidrBlock = rule.cidrBlock || '0.0.0.0/0';
      const description = rule.description || `Rule ${index + 1}`;
      
      return `
resource "aws_vpc_security_group_ingress_rule" "${component.id}_ingress_${index}" {
  security_group_id = aws_security_group.${component.id}.id
  cidr_ipv4         = "${cidrBlock}"
  from_port         = ${fromPort}
  ip_protocol       = "${protocol}"
  to_port           = ${toPort}
  description       = "${description}"
}`;
    }).join('\n');
  } else {
    // Default ingress rule for SSH
    ingressRulesCode = `
resource "aws_vpc_security_group_ingress_rule" "${component.id}_ingress_ssh" {
  security_group_id = aws_security_group.${component.id}.id
  cidr_ipv4         = "0.0.0.0/0"
  from_port         = 22
  ip_protocol       = "tcp"
  to_port           = 22
  description       = "SSH access"
}`;
  }

  // Generate egress rules if defined
  let egressRulesCode = '';
  if (config['Outbound Rules'] && Array.isArray(config['Outbound Rules'])) {
    egressRulesCode = config['Outbound Rules'].map((rule, index) => {
      const protocol = rule.protocol || '-1';
      const fromPort = rule.fromPort || 0;
      const toPort = rule.toPort || 0;
      const cidrBlock = rule.cidrBlock || '0.0.0.0/0';
      const description = rule.description || `Rule ${index + 1}`;
      
      return `
resource "aws_vpc_security_group_egress_rule" "${component.id}_egress_${index}" {
  security_group_id = aws_security_group.${component.id}.id
  cidr_ipv4         = "${cidrBlock}"
  from_port         = ${fromPort}
  ip_protocol       = "${protocol}"
  to_port           = ${toPort}
  description       = "${description}"
}`;
    }).join('\n');
  } else {
    // Default egress rule allowing all outbound traffic
    egressRulesCode = `
resource "aws_vpc_security_group_egress_rule" "${component.id}_egress_all" {
  security_group_id = aws_security_group.${component.id}.id
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "-1"
  description       = "Allow all outbound traffic"
}`;
  }

  return `${securityGroupCode}
${ingressRulesCode}
${egressRulesCode}`;
};

/**
 * Generates AWS EC2 Instance Terraform code
 * @param {Object} component - The EC2 component with configuration
 * @param {Array} allComponents - All diagram components (to resolve references)
 * @returns {String} Terraform code for AWS EC2 Instance
 */
export const generateEC2Terraform = (component, allComponents) => {
  const config = component.config || {};
  const name = config.Name || `ec2-${component.id}`;
  const instanceType = config['Instance Type'] || 't2.micro';
  const amiId = config['AMI ID'] || ''; // Will use data source to find latest AMI
  const associatePublicIp = config['Associate Public IP'] === undefined ? false : config['Associate Public IP'];
  const monitoring = config['Monitoring'] === undefined ? false : config['Monitoring'];
  const ebsOptimized = config['EBS Optimized'] === undefined ? false : config['EBS Optimized'];
  const ebsVolumeSize = config['Root Volume Size'] || 8;
  const ebsVolumeType = config['Root Volume Type'] || 'gp3';
  const instanceProfileArn = config['IAM Instance Profile'] || '';

  // Resolve references
  const subnetRef = resolveReference(config.Subnet, allComponents, 'subnet');
  
  // Handle security groups - could be multiple in a real scenario
  let securityGroupsRef = '[]';
  if (config['Security Group']) {
    const sgRef = resolveReference(config['Security Group'], allComponents, 'security-group');
    securityGroupsRef = `[${sgRef}]`;
  }

  // Handle User Data if present
  let userDataBlock = '';
  if (config['User Data']) {
    userDataBlock = `
  user_data = <<-EOF
${config['User Data']}
EOF
  user_data_replace_on_change = true`;
  } else {
    // Default user data to install basic tools
    userDataBlock = `
  user_data = <<-EOF
#!/bin/bash
# Install basic utilities
apt-get update
apt-get install -y htop vim git curl wget unzip
echo "EC2 instance ${name} setup completed"
EOF
  user_data_replace_on_change = true`;
  }
  
  // Generate tags
  const tagsBlock = generateTagsBlock(config, name);

  return `# Data source to find the latest Amazon Linux 2 AMI
data "aws_ami" "${component.id}_ami" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# Create an IAM instance profile (optional - uncomment if needed)
# resource "aws_iam_instance_profile" "${component.id}_profile" {
#   name = "${name}-instance-profile"
#   role = aws_iam_role.${component.id}_role.name
# }
# 
# resource "aws_iam_role" "${component.id}_role" {
#   name = "${name}-role"
#   assume_role_policy = jsonencode({
#     Version = "2012-10-17"
#     Statement = [
#       {
#         Action = "sts:AssumeRole"
#         Effect = "Allow"
#         Principal = {
#           Service = "ec2.amazonaws.com"
#         }
#       },
#     ]
#   })
# }

# Create a key pair for SSH access
resource "aws_key_pair" "${component.id}_key" {
  key_name   = "${name}-key"
  public_key = file("\${path.module}/ssh_keys/${name}.pub")  # You'll need to create this key
}

# Create the EC2 instance
resource "aws_instance" "${component.id}" {
  ami                         = ${amiId ? `"${amiId}"` : "data.aws_ami." + component.id + "_ami.id"}
  instance_type               = "${instanceType}"
  subnet_id                   = ${subnetRef}
  vpc_security_group_ids      = ${securityGroupsRef}
  associate_public_ip_address = ${associatePublicIp}
  monitoring                  = ${monitoring}
  ebs_optimized               = ${ebsOptimized}
  key_name                    = aws_key_pair.${component.id}_key.key_name
  iam_instance_profile        = ${instanceProfileArn ? `"${instanceProfileArn}"` : 'null'}${userDataBlock}

  root_block_device {
    volume_size           = ${ebsVolumeSize}
    volume_type           = "${ebsVolumeType}"
    delete_on_termination = true
    encrypted             = true
  }

  # Enable detailed monitoring
  metadata_options {
    http_endpoint = "enabled"
    http_tokens   = "required" # IMDSv2
  }

  # Enable termination protection for production instances
  disable_api_termination = false # Set to true for production instances${tagsBlock}
}

# Create and attach an additional EBS volume (optional - uncomment if needed)
# resource "aws_ebs_volume" "${component.id}_data_volume" {
#   availability_zone = aws_instance.${component.id}.availability_zone
#   size              = 50
#   type              = "gp3"
#   encrypted         = true
# 
#   tags = {
#     Name = "${name}-data-volume"
#   }
# }
# 
# resource "aws_volume_attachment" "${component.id}_data_attachment" {
#   device_name = "/dev/sdf"
#   volume_id   = aws_ebs_volume.${component.id}_data_volume.id
#   instance_id = aws_instance.${component.id}.id
# }

# Output the instance ID and public IP address
output "${component.id}_instance_id" {
  value       = aws_instance.${component.id}.id
  description = "ID of the EC2 instance"
}

output "${component.id}_public_ip" {
  value       = aws_instance.${component.id}.public_ip
  description = "Public IP address of the EC2 instance"
}`;
};

/**
 * Generates AWS S3 Bucket Terraform code
 * @param {Object} component - The S3 component with configuration
 * @returns {String} Terraform code for AWS S3 Bucket
 */
export const generateS3Terraform = (component) => {
  const config = component.config || {};
  const name = config['Bucket Name'] || `bucket-${component.id}`;
  const acl = config['Access Control'] || 'private';
  const versioning = config.Versioning === undefined ? false : config.Versioning;
  const encryption = config.Encryption === undefined ? true : config.Encryption; // Default to true for encryption
  const objectLock = config['Object Lock'] === undefined ? false : config['Object Lock'];
  
  // Generate tags
  const tagsBlock = generateTagsBlock(config, name);

  return `# S3 bucket resource
resource "aws_s3_bucket" "${component.id}" {
  bucket = "${name}"
  force_destroy = false  # Set to true if you want to allow terraform to delete non-empty buckets

  # Prevent public access to this bucket and its objects
  # This is a security best practice for most use cases
  object_lock_enabled = ${objectLock}${tagsBlock}
}

# S3 bucket ACL configuration
resource "aws_s3_bucket_acl" "${component.id}_acl" {
  bucket = aws_s3_bucket.${component.id}.id
  acl    = "${acl}"
}

# S3 bucket versioning configuration
resource "aws_s3_bucket_versioning" "${component.id}_versioning" {
  bucket = aws_s3_bucket.${component.id}.id
  
  versioning_configuration {
    status = ${versioning ? '"Enabled"' : '"Disabled"'}
  }
}

# S3 bucket server-side encryption configuration (enabled by default for security)
resource "aws_s3_bucket_server_side_encryption_configuration" "${component.id}_encryption" {
  bucket = aws_s3_bucket.${component.id}.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

# S3 bucket public access block (enabled by default for security)
resource "aws_s3_bucket_public_access_block" "${component.id}_public_access_block" {
  bucket = aws_s3_bucket.${component.id}.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 bucket lifecycle configuration for object expiration (optional)
resource "aws_s3_bucket_lifecycle_configuration" "${component.id}_lifecycle" {
  bucket = aws_s3_bucket.${component.id}.id

  rule {
    id      = "default"
    status  = "Enabled"

    # Example: transition objects to cheaper storage after 90 days
    transition {
      days          = 90
      storage_class = "STANDARD_IA"
    }

    # Example: delete objects after 365 days
    expiration {
      days = 365
    }
  }
}

# Output the S3 bucket name and ARN
output "${component.id}_bucket_name" {
  value       = aws_s3_bucket.${component.id}.bucket
  description = "The name of the S3 bucket"
}

output "${component.id}_bucket_arn" {
  value       = aws_s3_bucket.${component.id}.arn
  description = "The ARN of the S3 bucket"
}`;
};

/**
 * Generates AWS RDS Instance Terraform code
 * @param {Object} component - The RDS component with configuration
 * @param {Array} allComponents - All diagram components (to resolve references)
 * @returns {String} Terraform code for AWS RDS Instance
 */
export const generateRDSTerraform = (component, allComponents) => {
  const config = component.config || {};
  const identifier = config.Name || `rds-${component.id}`;
  const engine = config.Engine || 'mysql';
  const engineVersion = config['Engine Version'] || '5.7';
  const instanceClass = config['Instance Class'] || 'db.t3.micro';
  const allocatedStorage = config['Allocated Storage'] || 20;
  const storageType = config['Storage Type'] || 'gp2';
  const username = config['Master Username'] || 'admin';
  const dbName = config.Name ? config.Name.replace(/[^a-zA-Z0-9]/g, '') : `db${component.id.replace(/[^a-zA-Z0-9]/g, '')}`;
  
  // For security, we use SSM Parameter Store for the password in production
  const parameterName = `/database/${identifier}/master-password`;
  
  // Resolve VPC security groups - could be multiple
  const sgRef = resolveReference(config['Security Group'] || config.VPC, allComponents, 'security-group');
  
  // Find subnets for DB subnet group
  let subnetIds = [];
  const vpcRef = config.VPC ? config.VPC : null;
  
  if (vpcRef) {
    // Find all subnets in the same VPC for DB subnet group
    const vpcSubnets = allComponents.filter(c => 
      c.type === 'subnet' && c.config && c.config.VPC === vpcRef
    );
    
    if (vpcSubnets.length > 0) {
      subnetIds = vpcSubnets.map(subnet => `aws_subnet.${subnet.id}.id`);
    }
  }
  
  const subnetIdsString = subnetIds.length > 0 
    ? subnetIds.join(', ') 
    : 'aws_subnet.main.id /* Update with your actual subnet IDs */';
  
  // Generate tags
  const tagsBlock = generateTagsBlock(config, identifier);

  const multiAZ = config['Multi AZ'] === undefined ? false : config['Multi AZ'];
  const backupRetentionPeriod = config['Backup Retention Period'] || 7;
  const backupWindow = config['Backup Window'] || "03:00-04:00";
  const maintenanceWindow = config['Maintenance Window'] || "Mon:04:00-Mon:05:00";

  return `# Create DB subnet group from existing subnets
resource "aws_db_subnet_group" "${component.id}_subnet_group" {
  name        = "${identifier}-subnet-group"
  description = "DB subnet group for ${identifier}"
  subnet_ids  = [${subnetIdsString}]${tagsBlock}
}

# Store database password securely in Parameter Store
resource "aws_ssm_parameter" "${component.id}_password" {
  name        = "${parameterName}"
  description = "Master password for ${identifier} database"
  type        = "SecureString"
  value       = "ChangeMe!ComplexPassword123!" # Change this for production use
}

# Create the RDS instance
resource "aws_db_instance" "${component.id}" {
  identifier              = "${identifier}"
  engine                  = "${engine}"
  engine_version          = "${engineVersion}"
  instance_class          = "${instanceClass}"
  allocated_storage       = ${allocatedStorage}
  storage_type            = "${storageType}"
  db_name                 = "${dbName}"
  username                = "${username}"
  password                = aws_ssm_parameter.${component.id}_password.value
  db_subnet_group_name    = aws_db_subnet_group.${component.id}_subnet_group.name
  vpc_security_group_ids  = [${sgRef}]
  multi_az                = ${multiAZ}
  backup_retention_period = ${backupRetentionPeriod}
  backup_window           = "${backupWindow}"
  maintenance_window      = "${maintenanceWindow}"
  skip_final_snapshot     = true # Set to false for production
  deletion_protection     = false # Set to true for production
  apply_immediately       = true # Set to false for production${tagsBlock}
}

# Output the RDS endpoint for reference
output "${component.id}_endpoint" {
  value       = aws_db_instance.${component.id}.endpoint
  description = "The connection endpoint for the ${identifier} database"
}

# Output the RDS instance ARN for reference
output "${component.id}_arn" {
  value       = aws_db_instance.${component.id}.arn
  description = "The ARN of the ${identifier} database"
}`;
};

/**
 * Generates AWS Lambda Function Terraform code
 * @param {Object} component - The Lambda component with configuration
 * @param {Array} allComponents - All diagram components (to resolve references)
 * @returns {String} Terraform code for AWS Lambda Function
 */
export const generateLambdaTerraform = (component, allComponents) => {
  const config = component.config || {};
  const name = config.Name || `lambda-${component.id}`;
  const runtime = config.Runtime || 'nodejs14.x';
  const handler = config.Handler || 'index.handler';
  const memorySize = config['Memory Size'] || 128;
  const timeout = config.Timeout || 3;
  
  // Environment variables - optional
  let envVarsBlock = '';
  if (config['Environment Variables'] && Object.keys(config['Environment Variables']).length > 0) {
    const envVarsList = Object.entries(config['Environment Variables'])
      .map(([key, value]) => `      ${key} = "${value}"`)
      .join('\n');
      
    envVarsBlock = `
  environment {
    variables = {
${envVarsList}
    }
  }`;
  }
  
  // VPC configuration - optional
  let vpcConfigBlock = '';
  if (config.VPC || config.Subnet || config['Security Group']) {
    const subnetRef = config.Subnet ? resolveReference(config.Subnet, allComponents, 'subnet') : null;
    const sgRef = config['Security Group'] ? resolveReference(config['Security Group'], allComponents, 'security-group') : null;
    
    if (subnetRef && sgRef) {
      vpcConfigBlock = `
  vpc_config {
    subnet_ids         = [${subnetRef}]
    security_group_ids = [${sgRef}]
  }`;
    }
  }
  
  // Generate tags
  const tagsBlock = generateTagsBlock(config, name);

  return `# Create a Lambda deployment package - this creates a zip file with a basic Lambda function
resource "local_file" "${component.id}_function_code" {
  filename = "${name}/index.js"
  content  = <<-EOT
    exports.handler = async (event) => {
      console.log('Event: ', JSON.stringify(event, null, 2));
      return {
        statusCode: 200,
        body: JSON.stringify('Hello from Lambda!'),
      };
    };
  EOT
}

data "archive_file" "${component.id}_zip" {
  type        = "zip"
  source_dir  = "${name}"
  output_path = "${name}.zip"
  depends_on  = [local_file.${component.id}_function_code]
}

# IAM role for Lambda execution
resource "aws_iam_role" "${component.id}_role" {
  name = "${name}-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
      Effect = "Allow"
      Sid    = ""
    }]
  })
}

# Basic execution policy for Lambda
resource "aws_iam_role_policy_attachment" "${component.id}_basic" {
  role       = aws_iam_role.${component.id}_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Add VPC access policy if VPC config is specified
${vpcConfigBlock ? `
resource "aws_iam_role_policy_attachment" "${component.id}_vpc_access" {
  role       = aws_iam_role.${component.id}_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}` : ''}

# Lambda function resource
resource "aws_lambda_function" "${component.id}" {
  function_name    = "${name}"
  role             = aws_iam_role.${component.id}_role.arn
  handler          = "${handler}"
  runtime          = "${runtime}"
  memory_size      = ${memorySize}
  timeout          = ${timeout}
  filename         = data.archive_file.${component.id}_zip.output_path
  source_code_hash = data.archive_file.${component.id}_zip.output_base64sha256${envVarsBlock}${vpcConfigBlock}${tagsBlock}
}

# CloudWatch Log Group for Lambda
resource "aws_cloudwatch_log_group" "${component.id}_logs" {
  name              = "/aws/lambda/${name}"
  retention_in_days = 14${tagsBlock}
}

# Lambda function URL (optional - uncomment if you want to expose via URL)
# resource "aws_lambda_function_url" "${component.id}_url" {
#   function_name      = aws_lambda_function.${component.id}.function_name
#   authorization_type = "NONE"
# }

# Output to show the Lambda function URL if enabled
# output "${component.id}_function_url" {
#   value = aws_lambda_function_url.${component.id}_url.function_url
# }`;
};

/**
 * Generates AWS DynamoDB Table Terraform code
 * @param {Object} component - The DynamoDB component with configuration
 * @returns {String} Terraform code for AWS DynamoDB Table
 */
export const generateDynamoDBTerraform = (component) => {
  const config = component.config || {};
  const name = config.Name || `dynamodb-${component.id}`;
  const billingMode = config['Billing Mode'] || 'PAY_PER_REQUEST';
  const hashKey = config['Hash Key'] || 'id';
  const rangeKey = config['Range Key'];
  const readCapacity = config['Read Capacity'] || 5;
  const writeCapacity = config['Write Capacity'] || 5;
  const streamEnabled = config['Stream Enabled'] === undefined ? false : config['Stream Enabled'];
  const streamViewType = config['Stream View Type'] || 'NEW_AND_OLD_IMAGES';
  
  // Generate secondary indexes if defined
  const gsiConfig = config['GSI'] || [];
  let gsiBlocks = '';
  
  if (Array.isArray(gsiConfig) && gsiConfig.length > 0) {
    gsiBlocks = gsiConfig.map((gsi, index) => {
      const gsiName = gsi.name || `gsi-${index}`;
      const gsiHashKey = gsi.hashKey || hashKey;
      const gsiRangeKey = gsi.rangeKey;
      const gsiProjectionType = gsi.projectionType || 'ALL';
      const gsiNonKeyAttributes = gsi.nonKeyAttributes || [];
      
      let projectionBlock = `
    projection_type = "${gsiProjectionType}"`;
      
      if (gsiProjectionType === 'INCLUDE' && gsiNonKeyAttributes.length > 0) {
        projectionBlock += `
    non_key_attributes = ${JSON.stringify(gsiNonKeyAttributes)}`;
      }
      
      let capacityBlock = '';
      if (billingMode === 'PROVISIONED') {
        capacityBlock = `
    read_capacity  = ${gsi.readCapacity || readCapacity}
    write_capacity = ${gsi.writeCapacity || writeCapacity}`;
      }
      
      return `
  global_secondary_index {
    name               = "${gsiName}"
    hash_key           = "${gsiHashKey}"${gsiRangeKey ? `\n    range_key          = "${gsiRangeKey}"` : ''}${capacityBlock}
    projection {${projectionBlock}
    }
  }`;
    }).join('');
  }
  
  // Generate tags
  const tagsBlock = generateTagsBlock(config, name);
  
  // Capacity settings based on billing mode
  let capacitySettings = '';
  if (billingMode === 'PROVISIONED') {
    capacitySettings = `
  read_capacity  = ${readCapacity}
  write_capacity = ${writeCapacity}`;
  }

  // Point-in-time recovery configuration
  const pitRecovery = config['Point-in-time Recovery'] === undefined ? true : config['Point-in-time Recovery']; // Enable by default

  // Server-side encryption configuration
  const encryption = config['Encryption Enabled'] === undefined ? true : config['Encryption Enabled']; // Enable by default

  // TTL specification
  const ttlAttribute = config['TTL Attribute'] || 'expirationTime';

  // Autoscaling for provisioned capacity
  let autoscalingCode = '';
  if (billingMode === 'PROVISIONED') {
    autoscalingCode = `
# Autoscaling configuration for read capacity
resource "aws_appautoscaling_target" "${component.id}_read_target" {
  max_capacity       = ${readCapacity * 5} # 5x the base capacity
  min_capacity       = ${readCapacity}
  resource_id        = "table/${name}"
  scalable_dimension = "dynamodb:table:ReadCapacityUnits"
  service_namespace  = "dynamodb"
}

resource "aws_appautoscaling_policy" "${component.id}_read_policy" {
  name               = "${name}-read-autoscaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.${component.id}_read_target.resource_id
  scalable_dimension = aws_appautoscaling_target.${component.id}_read_target.scalable_dimension
  service_namespace  = aws_appautoscaling_target.${component.id}_read_target.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "DynamoDBReadCapacityUtilization"
    }
    target_value = 70.0 # Target 70% utilization
  }
}

# Autoscaling configuration for write capacity
resource "aws_appautoscaling_target" "${component.id}_write_target" {
  max_capacity       = ${writeCapacity * 5} # 5x the base capacity
  min_capacity       = ${writeCapacity}
  resource_id        = "table/${name}"
  scalable_dimension = "dynamodb:table:WriteCapacityUnits"
  service_namespace  = "dynamodb"
}

resource "aws_appautoscaling_policy" "${component.id}_write_policy" {
  name               = "${name}-write-autoscaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.${component.id}_write_target.resource_id
  scalable_dimension = aws_appautoscaling_target.${component.id}_write_target.scalable_dimension
  service_namespace  = aws_appautoscaling_target.${component.id}_write_target.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "DynamoDBWriteCapacityUtilization"
    }
    target_value = 70.0 # Target 70% utilization
  }
}`;
  }

  return `# Main DynamoDB table resource
resource "aws_dynamodb_table" "${component.id}" {
  name           = "${name}"
  billing_mode   = "${billingMode}"${capacitySettings}
  hash_key       = "${hashKey}"${rangeKey ? `\n  range_key      = "${rangeKey}"` : ''}

  # Primary key attributes
  attribute {
    name = "${hashKey}"
    type = "S"  # String type
  }${rangeKey ? `\n
  attribute {
    name = "${rangeKey}"
    type = "S"  # String type
  }` : ''}${gsiConfig.length > 0 ? gsiConfig.map(gsi => `

  # GSI attributes
  attribute {
    name = "${gsi.hashKey || hashKey}"
    type = "S"  # String type
  }${gsi.rangeKey ? `
  attribute {
    name = "${gsi.rangeKey}"
    type = "S"  # String type
  }` : ''}`).join('') : ''}

  # Stream configuration
  stream_enabled   = ${streamEnabled}${streamEnabled ? `\n  stream_view_type = "${streamViewType}"` : ''}

  # Point-in-time recovery
  point_in_time_recovery {
    enabled = ${pitRecovery}
  }

  # Server-side encryption
  server_side_encryption {
    enabled = ${encryption}
  }

  # TTL configuration
  ttl {
    attribute_name = "${ttlAttribute}"
    enabled        = true
  }${gsiBlocks}${tagsBlock}

  # Prevent recreation of the table when certain non-critical attributes change
  lifecycle {
    ignore_changes = [
      read_capacity,
      write_capacity
    ]
  }
}

# CloudWatch alarm for consumed read capacity
resource "aws_cloudwatch_metric_alarm" "${component.id}_read_capacity_alarm" {
  alarm_name          = "${name}-high-read-capacity-utilization"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "ConsumedReadCapacityUnits"
  namespace           = "AWS/DynamoDB"
  period              = "300"
  statistic           = "Sum"
  threshold           = ${billingMode === 'PROVISIONED' ? readCapacity * 60 * 5 * 0.8 : '4000'}  # 80% of max capacity for 5 minutes
  alarm_description   = "This alarm monitors DynamoDB table ${name} read capacity utilization"
  
  dimensions = {
    TableName = aws_dynamodb_table.${component.id}.name
  }
  
  alarm_actions = [] # Add SNS topic ARNs here for notifications
}

# CloudWatch alarm for consumed write capacity
resource "aws_cloudwatch_metric_alarm" "${component.id}_write_capacity_alarm" {
  alarm_name          = "${name}-high-write-capacity-utilization"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "ConsumedWriteCapacityUnits"
  namespace           = "AWS/DynamoDB"
  period              = "300"
  statistic           = "Sum"
  threshold           = ${billingMode === 'PROVISIONED' ? writeCapacity * 60 * 5 * 0.8 : '4000'}  # 80% of max capacity for 5 minutes
  alarm_description   = "This alarm monitors DynamoDB table ${name} write capacity utilization"
  
  dimensions = {
    TableName = aws_dynamodb_table.${component.id}.name
  }
  
  alarm_actions = [] # Add SNS topic ARNs here for notifications
}${autoscalingCode}

# Output the DynamoDB table name and ARN
output "${component.id}_table_name" {
  value       = aws_dynamodb_table.${component.id}.name
  description = "Name of the DynamoDB table"
}

output "${component.id}_table_arn" {
  value       = aws_dynamodb_table.${component.id}.arn
  description = "ARN of the DynamoDB table"
}`;
};

/**
 * Generates AWS Load Balancer Terraform code
 * @param {Object} component - The ELB component with configuration
 * @param {Array} allComponents - All diagram components (to resolve references)
 * @returns {String} Terraform code for AWS Load Balancer
 */
export const generateELBTerraform = (component, allComponents) => {
  const config = component.config || {};
  const name = config.Name || `lb-${component.id}`;
  const loadBalancerType = config['Load Balancer Type'] || 'application'; // 'application', 'network', or 'gateway'
  const internal = config.Internal === undefined ? false : config.Internal;
  const targetPort = config['Target Port'] || 80;
  const listenerPort = config['Listener Port'] || 80;
  const healthCheckPath = config['Health Check Path'] || '/';
  const healthCheckPort = config['Health Check Port'] || 'traffic-port';
  const targetType = config['Target Type'] || 'instance'; // 'instance', 'ip', 'lambda', or 'alb'
  const protocol = config['Protocol'] || 'HTTP';
  const deregistrationDelay = config['Deregistration Delay'] || 300;
  const deletionProtection = config['Enable Deletion Protection'] === undefined ? false : config['Enable Deletion Protection'];
  const enableCrossZone = config['Enable Cross-Zone Load Balancing'] === undefined ? true : config['Enable Cross-Zone Load Balancing'];
  const enableHttps = config['Enable HTTPS'] === undefined ? false : config['Enable HTTPS'];
  const sslCertArn = config['SSL Certificate ARN'] || '';
  const idleTimeout = config['Idle Timeout'] || 60;
  const accessLogsEnabled = config['Access Logs Enabled'] === undefined ? false : config['Access Logs Enabled'];
  const accessLogsBucket = config['Access Logs Bucket'] || '';
  const stickiness = config['Enable Stickiness'] === undefined ? false : config['Enable Stickiness'];
  const stickinessType = config['Stickiness Type'] || 'lb_cookie';
  const stickinessExpirationPeriod = config['Stickiness Expiration'] || 86400;
  
  // Resolve references
  const vpcRef = resolveReference(config.VPC, allComponents, 'vpc');
  
  // Subnets reference - load balancers require at least two subnets in different AZs
  let subnetRefs = [];
  
  if (config.Subnets && Array.isArray(config.Subnets)) {
    // Handle multiple subnet references
    subnetRefs = config.Subnets.map(subnet => 
      resolveReference(subnet, allComponents, 'subnet')
    );
  } else if (config.Subnet1 || config.Subnet2) {
    // Handle individual subnet references
    if (config.Subnet1) {
      subnetRefs.push(resolveReference(config.Subnet1, allComponents, 'subnet'));
    }
    if (config.Subnet2) {
      subnetRefs.push(resolveReference(config.Subnet2, allComponents, 'subnet'));
    }
  }
  
  // If we don't have enough subnets, add placeholders
  if (subnetRefs.length < 2) {
    if (subnetRefs.length === 0) {
      subnetRefs.push('"subnet-placeholder-1" # Replace with actual subnet ID');
      subnetRefs.push('"subnet-placeholder-2" # Replace with actual subnet ID');
    } else {
      subnetRefs.push('"subnet-placeholder" # Replace with actual subnet ID');
    }
  }
  
  const subnetsString = subnetRefs.join(', ');
  
  // Security groups - required for application and gateway load balancers
  let securityGroupRef = '';
  if (config['Security Group'] && (loadBalancerType === 'application' || loadBalancerType === 'gateway')) {
    securityGroupRef = resolveReference(config['Security Group'], allComponents, 'security-group');
  } else if (loadBalancerType === 'application' || loadBalancerType === 'gateway') {
    securityGroupRef = `aws_security_group.${component.id}_sg.id`;
  }
  
  // Generate tags
  const tagsBlock = generateTagsBlock(config, name);

  // Create access logs block if enabled
  let accessLogsBlock = '';
  if (accessLogsEnabled && accessLogsBucket) {
    accessLogsBlock = `
  access_logs {
    bucket  = "${accessLogsBucket}"
    prefix  = "${name}-logs"
    enabled = true
  }`;
  }
  
  // Create stickiness block if enabled
  let stickinessBlock = '';
  if (stickiness && loadBalancerType === 'application') {
    stickinessBlock = `
  stickiness {
    type            = "${stickinessType}"
    cookie_duration = ${stickinessExpirationPeriod}
    enabled         = true
  }`;
  }
  
  // Additional configuration for Network Load Balancer
  let nlbConfig = '';
  if (loadBalancerType === 'network') {
    nlbConfig = `
  enable_cross_zone_load_balancing = ${enableCrossZone}`;
  }
  
  return `# Security group for the load balancer (for ALB and Gateway LB)
${loadBalancerType === 'application' || loadBalancerType === 'gateway' ? `resource "aws_security_group" "${component.id}_sg" {
  name        = "${name}-sg"
  description = "Security group for ${name} load balancer"
  vpc_id      = ${vpcRef}

  # Ingress rules for listener ports
  ingress {
    from_port   = ${listenerPort}
    to_port     = ${listenerPort}
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow ${protocol} traffic on port ${listenerPort}"
  }
  ${enableHttps ? `
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow HTTPS traffic on port 443"
  }` : ''}

  # Egress rule to allow all outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }${tagsBlock}
}` : ''}

# Load Balancer
resource "aws_lb" "${component.id}" {
  name                       = "${name}"
  internal                   = ${internal}
  load_balancer_type         = "${loadBalancerType}"
  ${loadBalancerType === 'application' || loadBalancerType === 'gateway' ? `security_groups            = [${securityGroupRef}]` : ''}
  subnets                    = [${subnetsString}]
  enable_deletion_protection = ${deletionProtection}
  ${loadBalancerType === 'application' ? `idle_timeout               = ${idleTimeout}` : ''}${accessLogsBlock}${nlbConfig}${tagsBlock}
  
  # Prevent accidental deletion of the load balancer
  lifecycle {
    create_before_destroy = true
  }
}

# Target Group
resource "aws_lb_target_group" "${component.id}_tg" {
  name                 = "${name}-tg"
  port                 = ${targetPort}
  protocol             = "${protocol}"
  vpc_id               = ${vpcRef}
  target_type          = "${targetType}"
  deregistration_delay = ${deregistrationDelay}
  
  health_check {
    enabled             = true
    path                = "${loadBalancerType === 'application' ? healthCheckPath : ''}"
    port                = "${healthCheckPort}"
    protocol            = "${protocol}"
    healthy_threshold   = 3
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    matcher             = "${loadBalancerType === 'application' ? '200-299' : ''}"
  }${loadBalancerType === 'application' ? stickinessBlock : ''}
  
  # Prevent recreation on health check parameter updates
  lifecycle {
    create_before_destroy = true
  }${tagsBlock}
}

# HTTP Listener (default or redirect to HTTPS)
resource "aws_lb_listener" "${component.id}_http_listener" {
  load_balancer_arn = aws_lb.${component.id}.arn
  port              = "${listenerPort}"
  protocol          = "${loadBalancerType === 'application' ? protocol : 'TCP'}"
  
  default_action {
    type             = "${enableHttps ? 'redirect' : 'forward'}"
    ${enableHttps ? `redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }` : `target_group_arn = aws_lb_target_group.${component.id}_tg.arn`}
  }
}

# HTTPS Listener (if enabled)
${enableHttps && loadBalancerType === 'application' ? `resource "aws_lb_listener" "${component.id}_https_listener" {
  load_balancer_arn = aws_lb.${component.id}.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = "${sslCertArn}"
  
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.${component.id}_tg.arn
  }
}` : ''}

# CloudWatch Alarm for High Response Time/Latency
resource "aws_cloudwatch_metric_alarm" "${component.id}_high_latency" {
  alarm_name          = "${name}-high-latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "${loadBalancerType === 'application' ? 'TargetResponseTime' : 'TCP_ProcessingTime'}"
  namespace           = "AWS/${loadBalancerType === 'application' ? 'ApplicationELB' : loadBalancerType === 'network' ? 'NetworkELB' : 'GatewayELB'}"
  period              = "60"
  statistic           = "Average"
  threshold           = "5"  # 5 seconds, adjust as needed
  alarm_description   = "This alarm monitors ${name} latency"
  
  dimensions = {
    LoadBalancer = aws_lb.${component.id}.arn_suffix
  }
  
  alarm_actions = []  # Add SNS topic ARN here
}

# CloudWatch Alarm for Error Counts (for ALB)
${loadBalancerType === 'application' ? `resource "aws_cloudwatch_metric_alarm" "${component.id}_error_count" {
  alarm_name          = "${name}-5xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = "60"
  statistic           = "Sum"
  threshold           = "10"  # 10 errors, adjust as needed
  alarm_description   = "This alarm monitors ${name} 5XX errors"
  
  dimensions = {
    LoadBalancer = aws_lb.${component.id}.arn_suffix
    TargetGroup  = aws_lb_target_group.${component.id}_tg.arn_suffix
  }
  
  alarm_actions = []  # Add SNS topic ARN here
}` : ''}

# CloudWatch Dashboard for load balancer metrics
resource "aws_cloudwatch_dashboard" "${component.id}_dashboard" {
  dashboard_name = "${name}-dashboard"
  
  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/${loadBalancerType === 'application' ? 'ApplicationELB' : loadBalancerType === 'network' ? 'NetworkELB' : 'GatewayELB'}", "RequestCount", "LoadBalancer", aws_lb.${component.id}.arn_suffix]
          ]
          view    = "timeSeries"
          stacked = false
          region  = "us-east-1"  # Update with your region
          title   = "Request Count"
          period  = 300
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/${loadBalancerType === 'application' ? 'ApplicationELB' : loadBalancerType === 'network' ? 'NetworkELB' : 'GatewayELB'}", "${loadBalancerType === 'application' ? 'TargetResponseTime' : 'TCP_ProcessingTime'}", "LoadBalancer", aws_lb.${component.id}.arn_suffix]
          ]
          view    = "timeSeries"
          stacked = false
          region  = "us-east-1"  # Update with your region
          title   = "Response Time"
          period  = 300
        }
      }
    ]
  })
}

# Outputs
output "${component.id}_lb_dns_name" {
  description = "The DNS name of the load balancer"
  value       = aws_lb.${component.id}.dns_name
}

output "${component.id}_lb_arn" {
  description = "The ARN of the load balancer"
  value       = aws_lb.${component.id}.arn
}

output "${component.id}_lb_zone_id" {
  description = "The canonical hosted zone ID of the load balancer (for Route53 alias record)"
  value       = aws_lb.${component.id}.zone_id
}

output "${component.id}_target_group_arn" {
  description = "The ARN of the target group"
  value       = aws_lb_target_group.${component.id}_tg.arn
}`;
};

/**
 * Generates AWS CloudTrail Terraform code
 * @param {Object} component - The CloudTrail component with configuration
 * @param {Array} allComponents - All diagram components (to resolve references)
 * @returns {String} Terraform code for AWS CloudTrail
 */
export const generateCloudTrailTerraform = (component, allComponents) => {
  const config = component.config || {};
  const name = config.Name || `trail-${component.id}`;
  const includeGlobalEvents = config['Include Global Service Events'] === undefined ? true : config['Include Global Service Events'];
  const isMultiRegion = config['Is Multi-region Trail'] === undefined ? true : config['Is Multi-region Trail'];
  const enableLogging = config['Enable Logging'] === undefined ? true : config['Enable Logging'];
  const enableLogValidation = config['Enable Log File Validation'] === undefined ? true : config['Enable Log File Validation'];
  const enableKmsEncryption = config['Enable KMS Encryption'] === undefined ? true : config['Enable KMS Encryption'];
  const insightSelectors = config['Enable Insights'] === undefined ? true : config['Enable Insights'];
  const enableDataEvents = config['Enable Data Events'] === undefined ? false : config['Enable Data Events'];
  const enableManagementEvents = config['Enable Management Events'] === undefined ? true : config['Enable Management Events'];
  const managementEventsReadWriteType = config['Management Events Read-Write Type'] || 'All';
  const includeS3DataEvents = config['Include S3 Data Events'] === undefined ? true : config['Include S3 Data Events'];
  const includeLambdaDataEvents = config['Include Lambda Data Events'] === undefined ? false : config['Include Lambda Data Events'];
  const cloudWatchLogGroupEnabled = config['CloudWatch Log Group Enabled'] === undefined ? true : config['CloudWatch Log Group Enabled'];
  
  // S3 bucket reference
  let s3BucketName = '';
  let s3BucketRef = '';
  
  if (config['S3 Bucket']) {
    const s3Component = allComponents.find(c => c.id === config['S3 Bucket']);
    if (s3Component) {
      s3BucketRef = `aws_s3_bucket.${s3Component.id}`;
      s3BucketName = s3Component.config && s3Component.config['Bucket Name'] ? 
                     s3Component.config['Bucket Name'] : 
                     `${s3Component.id}-bucket`;
    }
  }
  
  // If no S3 bucket reference was found, we'll create one specifically for CloudTrail
  if (!s3BucketRef) {
    s3BucketRef = `aws_s3_bucket.${component.id}_bucket`;
    s3BucketName = `${name}-logs-${Math.floor(Math.random() * 10000)}`;
  }
  
  // Generate tags
  const tagsBlock = generateTagsBlock(config, name);

  // KMS key for encrypting CloudTrail logs
  let kmsKeyBlock = '';
  if (enableKmsEncryption) {
    kmsKeyBlock = `
# KMS key for CloudTrail log encryption
resource "aws_kms_key" "${component.id}_key" {
  description             = "KMS key for CloudTrail ${name} log encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true
  policy                  = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "Enable IAM User Permissions"
        Effect    = "Allow"
        Principal = {
          AWS = "arn:aws:iam::$\{data.aws_caller_identity.current.account_id}:root"
        }
        Action    = "kms:*"
        Resource  = "*"
      },
      {
        Sid       = "Allow CloudTrail to encrypt logs"
        Effect    = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action    = [
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource  = "*"
      },
      {
        Sid       = "Allow CloudTrail to describe key"
        Effect    = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action    = [
          "kms:DescribeKey",
          "kms:GetKeyPolicy"
        ]
        Resource  = "*"
      },
      {
        Sid       = "Allow CloudWatch to use the key"
        Effect    = "Allow"
        Principal = {
          Service = "logs.amazonaws.com"
        }
        Action    = [
          "kms:Encrypt*",
          "kms:Decrypt*",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:Describe*"
        ]
        Resource  = "*"
      }
    ]
  })${tagsBlock}
}

resource "aws_kms_alias" "${component.id}_key_alias" {
  name          = "alias/cloudtrail-${name}"
  target_key_id = aws_kms_key.${component.id}_key.key_id
}`;
  }

  // CloudWatch Log Group configuration
  let cloudWatchLogGroupBlock = '';
  if (cloudWatchLogGroupEnabled) {
    cloudWatchLogGroupBlock = `
# CloudWatch Log Group for CloudTrail events
resource "aws_cloudwatch_log_group" "${component.id}_log_group" {
  name              = "/aws/cloudtrail/${name}"
  retention_in_days = 90
  kms_key_id        = ${enableKmsEncryption ? `aws_kms_key.${component.id}_key.arn` : 'null'}${tagsBlock}
}

# IAM role for CloudTrail to CloudWatch Logs
resource "aws_iam_role" "${component.id}_cloudwatch_role" {
  name = "cloudtrail-${name}-cloudwatch-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })${tagsBlock}
}

# IAM policy for CloudTrail to CloudWatch Logs
resource "aws_iam_role_policy" "${component.id}_cloudwatch_policy" {
  name = "cloudtrail-${name}-cloudwatch-policy"
  role = aws_iam_role.${component.id}_cloudwatch_role.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "\${aws_cloudwatch_log_group.${component.id}_log_group.arn}:*"
      }
    ]
  })
}`;
  }

  // Get current account ID
  const currentAccountBlock = `
# Get current AWS account ID
data "aws_caller_identity" "current" {}`;

  return `${currentAccountBlock}

# S3 bucket for CloudTrail logs
resource "aws_s3_bucket" "${component.id}_bucket" {
  bucket        = "${s3BucketName}"
  force_destroy = true${tagsBlock}
}

# S3 bucket versioning (recommended for audit logs)
resource "aws_s3_bucket_versioning" "${component.id}_bucket_versioning" {
  bucket = ${s3BucketRef}.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 server-side encryption configuration
resource "aws_s3_bucket_server_side_encryption_configuration" "${component.id}_sse" {
  bucket = ${s3BucketRef}.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = ${enableKmsEncryption ? `"aws:kms"` : `"AES256"`}
      ${enableKmsEncryption ? `kms_master_key_id = aws_kms_key.${component.id}_key.arn` : ''}
    }
  }
}

# S3 bucket lifecycle configuration for log retention
resource "aws_s3_bucket_lifecycle_configuration" "${component.id}_lifecycle" {
  bucket = ${s3BucketRef}.id

  rule {
    id      = "log-retention"
    status  = "Enabled"
    
    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }
    
    transition {
      days          = 90
      storage_class = "GLACIER"
    }
    
    expiration {
      days = 365  # Adjust retention period as needed
    }
  }
}

# S3 bucket policy for CloudTrail logs
resource "aws_s3_bucket_policy" "${component.id}_bucket_policy" {
  bucket = ${s3BucketRef}.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AWSCloudTrailAclCheck"
        Effect    = "Allow"
        Principal = { Service = "cloudtrail.amazonaws.com" }
        Action    = "s3:GetBucketAcl"
        Resource  = ${s3BucketRef}.arn
      },
      {
        Sid       = "AWSCloudTrailWrite"
        Effect    = "Allow"
        Principal = { Service = "cloudtrail.amazonaws.com" }
        Action    = "s3:PutObject"
        Resource  = "\${${s3BucketRef}.arn}/AWSLogs/\${data.aws_caller_identity.current.account_id}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      },
      {
        Sid       = "AllowSSLRequestsOnly"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource  = [
          ${s3BucketRef}.arn,
          "\${${s3BucketRef}.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      }
    ]
  })
}

# S3 public access block for CloudTrail logs bucket
resource "aws_s3_bucket_public_access_block" "${component.id}_public_access_block" {
  bucket                  = ${s3BucketRef}.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}${kmsKeyBlock}${cloudWatchLogGroupBlock}

# AWS CloudTrail trail
resource "aws_cloudtrail" "${component.id}" {
  name                          = "${name}"
  s3_bucket_name                = ${s3BucketRef}.id
  include_global_service_events = ${includeGlobalEvents}
  is_multi_region_trail         = ${isMultiRegion}
  enable_logging                = ${enableLogging}
  enable_log_file_validation    = ${enableLogValidation}
  ${enableKmsEncryption ? `kms_key_id                   = aws_kms_key.${component.id}_key.arn` : ''}
  ${cloudWatchLogGroupEnabled ? `cloud_watch_logs_group_arn    = "\${aws_cloudwatch_log_group.${component.id}_log_group.arn}:*"
  cloud_watch_logs_role_arn     = aws_iam_role.${component.id}_cloudwatch_role.arn` : ''}

  # Insight configuration
  ${insightSelectors ? `insight_selector {
    insight_type = "ApiCallRateInsight"
  }
  
  insight_selector {
    insight_type = "ApiErrorRateInsight"
  }` : ''}

  # Event selectors for detailed logging
  event_selector {
    read_write_type           = "${managementEventsReadWriteType}" # ALL, READ_ONLY, WRITE_ONLY
    include_management_events = ${enableManagementEvents}
    
    ${enableDataEvents && includeS3DataEvents ? `# S3 data events
    data_resource {
      type   = "AWS::S3::Object"
      values = ["arn:aws:s3:::"]  # For all S3 buckets. Use specific buckets as needed.
    }` : ''}
    
    ${enableDataEvents && includeLambdaDataEvents ? `# Lambda data events
    data_resource {
      type   = "AWS::Lambda::Function"
      values = ["arn:aws:lambda"]  # For all Lambda functions. Use specific functions as needed.
    }` : ''}
  }${tagsBlock}

  # Dependencies
  depends_on = [
    aws_s3_bucket_policy.${component.id}_bucket_policy
  ]
}

# CloudWatch metric alarm for unauthorized API calls
resource "aws_cloudwatch_metric_alarm" "${component.id}_unauthorized_api_calls" {
  alarm_name          = "${name}-unauthorized-api-calls"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = "1"
  metric_name         = "UnauthorizedAttemptCount"
  namespace           = "CloudTrailMetrics"
  period              = "300"
  statistic           = "Sum"
  threshold           = "1"
  alarm_description   = "This alarm monitors for unauthorized API calls"
  
  alarm_actions = []  # Add SNS topic ARN for notifications
  
  insufficient_data_actions = []
}

# CloudWatch Log Metric Filter for monitoring unauthorized API calls
resource "aws_cloudwatch_log_metric_filter" "${component.id}_unauthorized_api_filter" {
  count = ${cloudWatchLogGroupEnabled} ? 1 : 0
  
  name           = "${name}-unauthorized-api-calls"
  pattern        = "{ $.errorCode = \"*UnauthorizedOperation\" || $.errorCode = \"AccessDenied*\" }"
  log_group_name = aws_cloudwatch_log_group.${component.id}_log_group.name

  metric_transformation {
    name      = "UnauthorizedAttemptCount"
    namespace = "CloudTrailMetrics"
    value     = "1"
  }
}

# CloudWatch Dashboard for CloudTrail insights
resource "aws_cloudwatch_dashboard" "${component.id}_dashboard" {
  dashboard_name = "${name}-dashboard"
  
  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["CloudTrailMetrics", "UnauthorizedAttemptCount", { stat = "Sum" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = "us-east-1"  # Update with your region
          title   = "Unauthorized API Calls"
          period  = 300
        }
      }
    ]
  })
}

# Outputs
output "${component.id}_trail_arn" {
  description = "ARN of the CloudTrail trail"
  value       = aws_cloudtrail.${component.id}.arn
}

output "${component.id}_logs_bucket" {
  description = "S3 bucket used for CloudTrail logs"
  value       = ${s3BucketRef}.bucket
}`;
};

/**
 * Generates AWS NAT Gateway Terraform code
 * @param {Object} component - The NAT Gateway component with configuration
 * @param {Array} allComponents - All diagram components (to resolve references)
 * @returns {String} Terraform code for AWS NAT Gateway
 */
export const generateNATGatewayTerraform = (component, allComponents) => {
  const config = component.config || {};
  const name = config.Name || `natgw-${component.id}`;
  const connectivityType = config['Connectivity Type'] || 'public';
  
  // Resolve subnet reference
  const subnetRef = resolveReference(config.Subnet, allComponents, 'subnet');
  
  // Find the VPC that contains this subnet
  let vpcId = '';
  if (config.Subnet) {
    const subnetComponent = allComponents.find(c => c.id === config.Subnet);
    if (subnetComponent && subnetComponent.config && subnetComponent.config.VPC) {
      vpcId = subnetComponent.config.VPC;
    }
  }
  
  // Generate tags
  const tagsBlock = generateTagsBlock(config, name);
  
  // Find all private subnets that might need routes to this NAT Gateway
  // This is a common pattern - private subnets use NAT Gateway for outbound internet access
  let routeTableEntries = '';
  if (connectivityType === 'public' && vpcId) {
    // Find private subnets in the same VPC
    const privateSubnets = allComponents.filter(c => 
      c.type === 'subnet' && 
      c.config && 
      c.config.VPC === vpcId && 
      (!c.config['Map Public IP on Launch'] || c.config['Map Public IP on Launch'] === false)
    );
    
    if (privateSubnets.length > 0) {
      // Create a route table for private subnets if they exist
      routeTableEntries = `
# Route table for private subnets using this NAT Gateway
resource "aws_route_table" "${component.id}_private_rt" {
  vpc_id = ${resolveReference(vpcId, allComponents, 'vpc')}${tagsBlock}
}

# Route for internet access via the NAT Gateway
resource "aws_route" "${component.id}_internet_route" {
  route_table_id         = aws_route_table.${component.id}_private_rt.id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.${component.id}.id
}

${privateSubnets.map((subnet, index) => `# Route table association for private subnet
resource "aws_route_table_association" "${component.id}_rt_assoc_${index}" {
  subnet_id      = aws_subnet.${subnet.id}.id
  route_table_id = aws_route_table.${component.id}_private_rt.id
}`).join('\n\n')}`;
    }
  }

  // CloudWatch monitoring resources
  const cloudWatchBlock = `
# CloudWatch Alarm for NAT Gateway error count
resource "aws_cloudwatch_metric_alarm" "${component.id}_error_count" {
  alarm_name          = "${name}-error-count"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "ErrorPortAllocation"
  namespace           = "AWS/NATGateway"
  period              = "60"
  statistic           = "Sum"
  threshold           = "0"  # Any error is concerning
  alarm_description   = "NAT Gateway port allocation errors"
  
  dimensions = {
    NatGatewayId = aws_nat_gateway.${component.id}.id
  }
  
  alarm_actions = []  # Add SNS topic ARN here
}

# CloudWatch Alarm for high connection count
resource "aws_cloudwatch_metric_alarm" "${component.id}_high_connection" {
  alarm_name          = "${name}-high-connection-count"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "3"
  metric_name         = "ConnectionEstablishedCount"
  namespace           = "AWS/NATGateway"
  period              = "60"
  statistic           = "Sum"
  threshold           = "5000"  # Adjust as needed based on your workload
  alarm_description   = "NAT Gateway high connection count"
  
  dimensions = {
    NatGatewayId = aws_nat_gateway.${component.id}.id
  }
  
  alarm_actions = []  # Add SNS topic ARN here
}

# CloudWatch Dashboard for NAT Gateway metrics
resource "aws_cloudwatch_dashboard" "${component.id}_dashboard" {
  dashboard_name = "${name}-dashboard"
  
  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/NATGateway", "BytesOutToDestination", "NatGatewayId", aws_nat_gateway.${component.id}.id],
            [".", "BytesInFromDestination", ".", "."],
            [".", "BytesOutToSource", ".", "."],
            [".", "BytesInFromSource", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = "us-east-1"  # Update with your region
          title   = "NAT Gateway Traffic"
          period  = 300
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/NATGateway", "ConnectionEstablishedCount", "NatGatewayId", aws_nat_gateway.${component.id}.id],
            [".", "ConnectionAttemptCount", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = "us-east-1"  # Update with your region
          title   = "NAT Gateway Connections"
          period  = 300
        }
      }
    ]
  })
}`;

  return `# For public NAT gateways, we need an Elastic IP
${connectivityType === 'public' ? `resource "aws_eip" "${component.id}_eip" {
  domain = "vpc"${tagsBlock}
}` : ''}

# NAT Gateway
resource "aws_nat_gateway" "${component.id}" {
  subnet_id         = ${subnetRef}
  ${connectivityType === 'public' ? `allocation_id     = aws_eip.${component.id}_eip.id` : `connectivity_type = "${connectivityType}"`}${tagsBlock}
  
  # Wait for resources to be available
  depends_on = [${connectivityType === 'public' ? `aws_eip.${component.id}_eip` : ''}]
}${routeTableEntries}${cloudWatchBlock}

# Outputs
output "${component.id}_nat_gateway_id" {
  description = "ID of the NAT Gateway"
  value       = aws_nat_gateway.${component.id}.id
}

output "${component.id}_nat_gateway_public_ip" {
  description = "Public IP address of the NAT Gateway"
  value       = ${connectivityType === 'public' ? `aws_eip.${component.id}_eip.public_ip` : 'null'}
}`;
};

/**
 * Generates AWS Network ACL Terraform code
 * @param {Object} component - The Network ACL component with configuration
 * @param {Array} allComponents - All diagram components (to resolve references)
 * @returns {String} Terraform code for AWS Network ACL
 */
export const generateNetworkACLTerraform = (component, allComponents) => {
  const config = component.config || {};
  const name = config.Name || `nacl-${component.id}`;
  
  // Resolve VPC reference
  const vpcRef = resolveReference(config.VPC, allComponents, 'vpc');
  
  // Find all subnet associations
  let subnetAssociations = '';
  const subnetIds = [];
  
  // Check for specific subnet associations
  if (config['Subnet Associations']) {
    if (Array.isArray(config['Subnet Associations'])) {
      // Handle multiple subnet associations
      config['Subnet Associations'].forEach((subnetId, index) => {
        const subnetRef = resolveReference(subnetId, allComponents, 'subnet');
        subnetIds.push({ id: subnetId, ref: subnetRef });
      });
    } else {
      // Handle single subnet association
      const subnetRef = resolveReference(config['Subnet Associations'], allComponents, 'subnet');
      subnetIds.push({ id: config['Subnet Associations'], ref: subnetRef });
    }
  } else if (config.VPC) {
    // If no specific subnets, find all subnets in the same VPC
    const vpcSubnets = allComponents.filter(c => 
      c.type === 'subnet' && 
      c.config && 
      c.config.VPC === config.VPC
    );
    
    vpcSubnets.forEach(subnet => {
      const subnetRef = `aws_subnet.${subnet.id}.id`;
      subnetIds.push({ id: subnet.id, ref: subnetRef });
    });
  }
  
  // Generate subnet association resources
  if (subnetIds.length > 0) {
    subnetAssociations = subnetIds.map((subnet, index) => `
# Network ACL association for subnet
resource "aws_network_acl_association" "${component.id}_association_${index}" {
  network_acl_id = aws_network_acl.${component.id}.id
  subnet_id      = ${subnet.ref}
}`).join('');
  }
  
  // Security best practice rules for common use cases
  const webServerRules = config['Web Server Rules'] === undefined ? false : config['Web Server Rules'];
  const databaseRules = config['Database Rules'] === undefined ? false : config['Database Rules'];
  const customInboundRules = config['Custom Inbound Rules'] === undefined ? false : config['Custom Inbound Rules'];
  
  // Default rules common for most use cases
  const commonIngressRules = [
    // Rule 100: Allow HTTP inbound
    {
      protocol: 'tcp',
      rule_no: 100,
      action: 'allow',
      cidr_block: '0.0.0.0/0',
      from_port: 80,
      to_port: 80
    },
    // Rule 110: Allow HTTPS inbound
    {
      protocol: 'tcp',
      rule_no: 110,
      action: 'allow',
      cidr_block: '0.0.0.0/0',
      from_port: 443,
      to_port: 443
    },
    // Rule 120: Allow SSH inbound (for management)
    {
      protocol: 'tcp',
      rule_no: 120,
      action: 'allow',
      cidr_block: '0.0.0.0/0', // In production, restrict to specific IPs
      from_port: 22,
      to_port: 22
    },
    // Rule 130: Allow ephemeral ports for return traffic
    {
      protocol: 'tcp',
      rule_no: 130,
      action: 'allow',
      cidr_block: '0.0.0.0/0',
      from_port: 1024,
      to_port: 65535
    }
  ];
  
  // Database specific rules to add if database flag is set
  const dbIngressRules = [
    // Rule 200: MySQL/Aurora
    {
      protocol: 'tcp',
      rule_no: 200,
      action: 'allow',
      cidr_block: '10.0.0.0/8', // Restrict to VPC CIDR
      from_port: 3306,
      to_port: 3306
    },
    // Rule 210: PostgreSQL
    {
      protocol: 'tcp',
      rule_no: 210,
      action: 'allow',
      cidr_block: '10.0.0.0/8', // Restrict to VPC CIDR
      from_port: 5432,
      to_port: 5432
    }
  ];
  
  // Common egress rules
  const commonEgressRules = [
    // Rule 100: Allow HTTP outbound
    {
      protocol: 'tcp',
      rule_no: 100,
      action: 'allow',
      cidr_block: '0.0.0.0/0',
      from_port: 80,
      to_port: 80
    },
    // Rule 110: Allow HTTPS outbound
    {
      protocol: 'tcp',
      rule_no: 110,
      action: 'allow',
      cidr_block: '0.0.0.0/0',
      from_port: 443,
      to_port: 443
    },
    // Rule 120: Allow outbound response traffic
    {
      protocol: 'tcp',
      rule_no: 120,
      action: 'allow',
      cidr_block: '0.0.0.0/0',
      from_port: 1024,
      to_port: 65535
    },
    // Rule 130: Allow DNS
    {
      protocol: 'udp',
      rule_no: 130,
      action: 'allow',
      cidr_block: '0.0.0.0/0',
      from_port: 53,
      to_port: 53
    }
  ];
  
  // Generate ingress rules based on config
  let ingressRules = [];
  
  if (config['Inbound Rules'] && Array.isArray(config['Inbound Rules'])) {
    // Use user-defined rules
    ingressRules = config['Inbound Rules'];
  } else if (webServerRules) {
    // Use web server rules
    ingressRules = commonIngressRules;
  } else if (databaseRules) {
    // Use database rules combined with SSH for management
    ingressRules = [
      ...dbIngressRules,
      // Allow SSH for management
      {
        protocol: 'tcp',
        rule_no: 120,
        action: 'allow',
        cidr_block: '10.0.0.0/8', // Restrict to VPC CIDR
        from_port: 22,
        to_port: 22
      },
      // Allow ephemeral ports for return traffic
      {
        protocol: 'tcp',
        rule_no: 130,
        action: 'allow',
        cidr_block: '0.0.0.0/0',
        from_port: 1024,
        to_port: 65535
      }
    ];
  } else {
    // Default rules - allow all inbound traffic
    ingressRules = [
      {
        protocol: '-1',
        rule_no: 100,
        action: 'allow',
        cidr_block: '0.0.0.0/0',
        from_port: 0,
        to_port: 0
      }
    ];
  }
  
  // Generate egress rules based on config
  let egressRules = [];
  
  if (config['Outbound Rules'] && Array.isArray(config['Outbound Rules'])) {
    // Use user-defined rules
    egressRules = config['Outbound Rules'];
  } else if (webServerRules || databaseRules) {
    // Use common egress rules for both web server and database
    egressRules = commonEgressRules;
  } else {
    // Default rules - allow all outbound traffic
    egressRules = [
      {
        protocol: '-1',
        rule_no: 100,
        action: 'allow',
        cidr_block: '0.0.0.0/0',
        from_port: 0,
        to_port: 0
      }
    ];
  }
  
  // Generate ingress rules block
  const ingressRulesBlock = ingressRules.map((rule, index) => {
    const ruleNo = rule.rule_no || (100 + index * 10);
    const protocol = rule.protocol || 'tcp';
    const action = rule.action || 'allow';
    const cidrBlock = rule.cidr_block || '0.0.0.0/0';
    const fromPort = rule.from_port !== undefined ? rule.from_port : 0;
    const toPort = rule.to_port !== undefined ? rule.to_port : 0;
    
    return `
  ingress {
    protocol   = "${protocol}"
    rule_no    = ${ruleNo}
    action     = "${action}"
    cidr_block = "${cidrBlock}"
    from_port  = ${fromPort}
    to_port    = ${toPort}
  }`;
  }).join('');
  
  // Generate egress rules block
  const egressRulesBlock = egressRules.map((rule, index) => {
    const ruleNo = rule.rule_no || (100 + index * 10);
    const protocol = rule.protocol || 'tcp';
    const action = rule.action || 'allow';
    const cidrBlock = rule.cidr_block || '0.0.0.0/0';
    const fromPort = rule.from_port !== undefined ? rule.from_port : 0;
    const toPort = rule.to_port !== undefined ? rule.to_port : 0;
    
    return `
  egress {
    protocol   = "${protocol}"
    rule_no    = ${ruleNo}
    action     = "${action}"
    cidr_block = "${cidrBlock}"
    from_port  = ${fromPort}
    to_port    = ${toPort}
  }`;
  }).join('');
  
  // Generate tags
  const tagsBlock = generateTagsBlock(config, name);

  return `# Network ACL resource
resource "aws_network_acl" "${component.id}" {
  vpc_id = ${vpcRef}${ingressRulesBlock}${egressRulesBlock}${tagsBlock}
}${subnetAssociations}

# Output for Network ACL ID
output "${component.id}_network_acl_id" {
  description = "The ID of the Network ACL"
  value       = aws_network_acl.${component.id}.id
}`;
};

/**
 * Generates complete Terraform code for AWS components
 * @param {Array} components - Array of diagram components
 * @returns {String} Complete Terraform configuration
 */
export const generateTerraformCode = (components) => {
  if (!components || !components.length) {
    return '';
  }

  // Provider configuration
  const providerCode = `provider "aws" {
  region = "us-east-1"
  # Access and secret keys will be provided by environment variables
  # AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY
}

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }
}
`;

  // Generate code for each component
  const componentsCode = components.map(component => {
    const componentType = component.id.split('-')[0];
    
    switch (componentType) {
      case 'vpc':
        return generateVPCTerraform(component);
      case 'subnet':
        return generateSubnetTerraform(component, components);
      case 'security-group':
        return generateSecurityGroupTerraform(component, components);
      case 'ec2':
        return generateEC2Terraform(component, components);
      case 's3':
        return generateS3Terraform(component);
      case 'rds':
        return generateRDSTerraform(component, components);
      case 'lambda':
        return generateLambdaTerraform(component, components);
      case 'dynamodb':
        return generateDynamoDBTerraform(component);
      case 'elb':
        return generateELBTerraform(component, components);
      case 'cloudtrail':
        return generateCloudTrailTerraform(component, components);
      case 'nat-gateway':
        return generateNATGatewayTerraform(component, components);
      case 'network-acl':
        return generateNetworkACLTerraform(component, components);
      default:
        return `# Component type '${componentType}' not yet supported for Terraform generation`;
    }
  }).join('\n\n');

  return `${providerCode}\n${componentsCode}`;
};

export default {
  generateTerraformCode,
  generateVPCTerraform,
  generateSubnetTerraform,
  generateSecurityGroupTerraform,
  generateEC2Terraform,
  generateS3Terraform,
  generateRDSTerraform,
  generateLambdaTerraform,
  generateDynamoDBTerraform,
  generateELBTerraform,
  generateCloudTrailTerraform,
  generateNATGatewayTerraform,
  generateNetworkACLTerraform
};