import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TerraformCodeView from '../../../../components/diagram/TerraformCodeView';
import { generateTerraformCode } from '../../../../utils/terraformGenerator';

// Mock the terraformGenerator utility
jest.mock('../../../../utils/terraformGenerator', () => ({
  generateTerraformCode: jest.fn()
}));

describe('TerraformCodeView Component', () => {
  const mockComponents = [
    {
      id: 'ec2-12345',
      name: 'Web Server',
      type: 'ec2',
      config: {
        Name: 'web-server',
        'Instance Type': 't2.micro',
        'AMI ID': 'ami-12345678'
      }
    },
    {
      id: 's3-67890',
      name: 'Data Bucket',
      type: 's3',
      config: {
        'Bucket Name': 'data-storage-bucket',
        'Region': 'us-east-1',
        'Access Control': 'private'
      }
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock the terraform code generation
    generateTerraformCode.mockReturnValue({
      providerCode: 'provider "aws" {\n  region = "us-east-1"\n}',
      resourceCode: 'resource "aws_instance" "web_server" {\n  ami = "ami-12345678"\n  instance_type = "t2.micro"\n}\n\nresource "aws_s3_bucket" "data_bucket" {\n  bucket = "data-storage-bucket"\n  acl = "private"\n}'
    });
  });

  test('renders correctly with components', () => {
    render(<TerraformCodeView diagramComponents={mockComponents} cloudProvider="AWS" />);
    
    // Check if the section title is displayed
    expect(screen.getByText('Terraform Code')).toBeInTheDocument();
  });

  test('generates terraform code when button is clicked', async () => {
    render(<TerraformCodeView diagramComponents={mockComponents} cloudProvider="AWS" />);
    
    // Click the generate code button
    const generateButton = screen.getByText('Generate Terraform Code');
    fireEvent.click(generateButton);
    
    // Check if the code generation function was called
    expect(generateTerraformCode).toHaveBeenCalledWith(mockComponents, 'AWS');
    
    // Check if the code is displayed
    await waitFor(() => {
      expect(screen.getByText(/provider "aws"/)).toBeInTheDocument();
      expect(screen.getByText(/resource "aws_instance"/)).toBeInTheDocument();
      expect(screen.getByText(/resource "aws_s3_bucket"/)).toBeInTheDocument();
    });
  });
  
  test('shows copy button after code generation', async () => {
    render(<TerraformCodeView diagramComponents={mockComponents} cloudProvider="AWS" />);
    
    // Initially, copy button should not be visible
    expect(screen.queryByText('Copy Code')).not.toBeInTheDocument();
    
    // Generate code
    const generateButton = screen.getByText('Generate Terraform Code');
    fireEvent.click(generateButton);
    
    // Now copy button should be visible
    await waitFor(() => {
      expect(screen.getByText('Copy Code')).toBeInTheDocument();
    });
  });
  
  test('copies code to clipboard when copy button is clicked', async () => {
    // Mock clipboard write functionality
    const mockClipboard = {
      writeText: jest.fn().mockImplementation(() => Promise.resolve())
    };
    Object.defineProperty(navigator, 'clipboard', {
      value: mockClipboard,
      writable: true
    });
    
    render(<TerraformCodeView diagramComponents={mockComponents} cloudProvider="AWS" />);
    
    // Generate code first
    const generateButton = screen.getByText('Generate Terraform Code');
    fireEvent.click(generateButton);
    
    // Wait for code generation
    await waitFor(() => {
      expect(screen.getByText('Copy Code')).toBeInTheDocument();
    });
    
    // Click copy button
    const copyButton = screen.getByText('Copy Code');
    fireEvent.click(copyButton);
    
    // Check if clipboard.writeText was called
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expect.stringContaining('provider "aws"'));
    });
    
    // Check if button text changes to "Copied!"
    expect(screen.getByText('Copied!')).toBeInTheDocument();
    
    // Wait for button text to change back
    await waitFor(() => {
      expect(screen.getByText('Copy Code')).toBeInTheDocument();
    }, { timeout: 3000 });
  });
  
  test('handles empty component list', () => {
    render(<TerraformCodeView diagramComponents={[]} cloudProvider="AWS" />);
    
    // Generate button should still be there
    const generateButton = screen.getByText('Generate Terraform Code');
    fireEvent.click(generateButton);
    
    // Check if code generation was called with empty array
    expect(generateTerraformCode).toHaveBeenCalledWith([], 'AWS');
    
    // Should show a message about no components
    expect(screen.getByText(/No components to generate code from/i)).toBeInTheDocument();
  });
  
  test('displays different provider code for different cloud providers', () => {
    // Override mock for GCP
    generateTerraformCode.mockReturnValue({
      providerCode: 'provider "google" {\n  project = "my-project"\n  region = "us-central1"\n}',
      resourceCode: 'resource "google_compute_instance" "web_server" {\n  name = "web-server"\n  machine_type = "e2-medium"\n}'
    });
    
    render(<TerraformCodeView diagramComponents={mockComponents} cloudProvider="GCP" />);
    
    // Generate code
    const generateButton = screen.getByText('Generate Terraform Code');
    fireEvent.click(generateButton);
    
    // Check if the GCP provider code is displayed
    expect(screen.getByText(/provider "google"/)).toBeInTheDocument();
  });
  
  test('updates code when components change', async () => {
    const { rerender } = render(
      <TerraformCodeView diagramComponents={mockComponents} cloudProvider="AWS" />
    );
    
    // Generate code
    const generateButton = screen.getByText('Generate Terraform Code');
    fireEvent.click(generateButton);
    
    // First code generation
    await waitFor(() => {
      expect(generateTerraformCode).toHaveBeenCalledWith(mockComponents, 'AWS');
    });
    
    // Update with new components
    const updatedComponents = [
      ...mockComponents,
      {
        id: 'lambda-12345',
        name: 'Processing Function',
        type: 'lambda',
        config: {
          Name: 'data-processor',
          Runtime: 'nodejs16.x'
        }
      }
    ];
    
    // Mock new code generation result
    generateTerraformCode.mockReturnValue({
      providerCode: 'provider "aws" {\n  region = "us-east-1"\n}',
      resourceCode: 'resource "aws_instance" "web_server" {...}\n\nresource "aws_s3_bucket" "data_bucket" {...}\n\nresource "aws_lambda_function" "data_processor" {...}'
    });
    
    // Re-render with new components
    rerender(<TerraformCodeView diagramComponents={updatedComponents} cloudProvider="AWS" />);
    
    // Click generate again
    fireEvent.click(screen.getByText('Generate Terraform Code'));
    
    // Check if code generation was called with updated components
    await waitFor(() => {
      expect(generateTerraformCode).toHaveBeenCalledWith(updatedComponents, 'AWS');
    });
    
    // Check for the new lambda function in the code
    expect(screen.getByText(/aws_lambda_function/)).toBeInTheDocument();
  });
});