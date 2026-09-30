# AWS CloudFormation deployment script for MCP Supervisor
#!/bin/bash

# Configuration
STACK_NAME=\"mcp-supervisor-cluster\"
REGION=\"us-east-1\"
TEMPLATE_FILE=\"aws-cloudformation.yaml\"

echo \"Deploying MCP Supervisor to AWS...\"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo \"AWS CLI is not installed. Please install it first.\"
    exit 1
fi

# Deploy CloudFormation stack
aws cloudformation deploy \
    --stack-name  \
    --template-file  \
    --region  \
    --capabilities CAPABILITY_IAM

echo \"Deployment complete!\" 
echo \"Check the AWS CloudFormation console for status.\"
