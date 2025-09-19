import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TerraformCodeView from '../../src/components/TerraformCodeView';
import api from '../../src/services/api';

// Mock the api module
jest.mock('../../src/services/api');

describe('TerraformCodeView Component', () => {
  const mockDiagram = {
    _id: 'test-diagram-id',
    name: 'Test AWS Diagram',
    base: 'AWS',
    cloud_components: [
      {
        _id: 'ec2-comp',
        component_type: 'ec2',
        name: 'Web Server',
        position_x: 200,
        position_y: 200,
        configuration: {
          Name: 'web-server',
          'Instance Type': 't2.micro',
          'AMI ID': 'ami-12345678'
        }
      },
      {
        _id: 's3-comp',
        component_type: 's3',
        name: 'Data Bucket',
        position_x: 500,
        position_y: 200,
        configuration: {
          'Bucket Name': 'data-bucket',
          'Region': 'us-east-1',
          'Access Control': 'private'
        },
        connections: [
          {
            target_id: 'ec2-comp',
            type: 'Accessed by'
          }
        ]
      }
    ]
  };

  const mockTerraformCode = `
    provider "aws" {
      region = "us-east-1"
    }
    
    resource "aws_instance" "web_server" {
      ami           = "ami-12345678"
      instance_type = "t2.micro"
      tags = {
        Name = "web-server"
      }
    }
    
    resource "aws_s3_bucket" "data_bucket" {
      bucket = "data-bucket"
      acl    = "private"
    }
  `;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock the generateTerraformCode function
    api.generateTerraformCode.mockResolvedValue({ code: mockTerraformCode });
  });

  test('renders loading state initially', () => {
    render(<TerraformCodeView diagramId="test-diagram-id" />);
    
    expect(screen.getByText(/generating terraform code/i)).toBeInTheDocument();
  });

  test('renders terraform code after loading', async () => {
    render(<TerraformCodeView diagramId="test-diagram-id" />);
    
    await waitFor(() => {
      expect(screen.queryByText(/generating terraform code/i)).not.toBeInTheDocument();
    });
    
    expect(screen.getByText(/provider "aws"/)).toBeInTheDocument();
    expect(screen.getByText(/resource "aws_instance"/)).toBeInTheDocument();
    expect(screen.getByText(/resource "aws_s3_bucket"/)).toBeInTheDocument();
  });

  test('shows error when code generation fails', async () => {
    // Mock API error
    api.generateTerraformCode.mockRejectedValue(new Error('Failed to generate Terraform code'));
    
    render(<TerraformCodeView diagramId="test-diagram-id" />);
    
    await waitFor(() => {
      expect(screen.getByText(/error generating terraform code/i)).toBeInTheDocument();
    });
  });

  test('calls API with correct diagram ID', async () => {
    render(<TerraformCodeView diagramId="test-diagram-id" />);
    
    await waitFor(() => {
      expect(api.generateTerraformCode).toHaveBeenCalledWith('test-diagram-id');
    });
  });

  test('allows copying terraform code to clipboard', async () => {
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockResolvedValue(undefined),
      },
    });
    
    render(<TerraformCodeView diagramId="test-diagram-id" />);
    
    // Wait for code to load
    await waitFor(() => {
      expect(screen.queryByText(/generating terraform code/i)).not.toBeInTheDocument();
    });
    
    // Click copy button
    const copyButton = screen.getByText(/copy/i);
    await userEvent.click(copyButton);
    
    // Verify clipboard API was called with the correct text
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockTerraformCode);
    
    // Check for success message
    await waitFor(() => {
      expect(screen.getByText(/copied to clipboard/i)).toBeInTheDocument();
    });
  });

  test('allows downloading terraform code as a file', async () => {
    // Mock document.createElement and element.click
    const mockAnchor = {
      href: '',
      download: '',
      style: {},
      click: jest.fn(),
      remove: jest.fn(),
    };
    
    jest.spyOn(document, 'createElement').mockImplementation((tag) => {
      if (tag === 'a') return mockAnchor;
      return document.createElement(tag);
    });
    
    // Mock URL.createObjectURL
    global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = jest.fn();
    
    render(<TerraformCodeView diagramId="test-diagram-id" />);
    
    // Wait for code to load
    await waitFor(() => {
      expect(screen.queryByText(/generating terraform code/i)).not.toBeInTheDocument();
    });
    
    // Click download button
    const downloadButton = screen.getByText(/download/i);
    await userEvent.click(downloadButton);
    
    // Verify download was triggered
    expect(mockAnchor.download).toBe('terraform-config.tf');
    expect(mockAnchor.click).toHaveBeenCalled();
    expect(mockAnchor.remove).toHaveBeenCalled();
    
    // Verify blob URL was created and revoked
    expect(global.URL.createObjectURL).toHaveBeenCalled();
    expect(global.URL.revokeObjectURL).toHaveBeenCalled();
  });

  test('refreshes terraform code when refresh button is clicked', async () => {
    render(<TerraformCodeView diagramId="test-diagram-id" />);
    
    // Wait for initial code to load
    await waitFor(() => {
      expect(screen.queryByText(/generating terraform code/i)).not.toBeInTheDocument();
    });
    
    // Mock a different response for the second API call
    const updatedCode = `
      provider "aws" {
        region = "us-west-1"
      }
      
      resource "aws_instance" "updated_server" {
        ami           = "ami-87654321"
        instance_type = "t3.large"
      }
    `;
    api.generateTerraformCode.mockResolvedValueOnce({ code: updatedCode });
    
    // Click refresh button
    const refreshButton = screen.getByText(/refresh/i);
    await userEvent.click(refreshButton);
    
    // Should show loading state again
    expect(screen.getByText(/generating terraform code/i)).toBeInTheDocument();
    
    // Should load updated code
    await waitFor(() => {
      expect(screen.queryByText(/generating terraform code/i)).not.toBeInTheDocument();
      expect(screen.getByText(/us-west-1/)).toBeInTheDocument();
      expect(screen.getByText(/t3.large/)).toBeInTheDocument();
    });
    
    // API should have been called twice
    expect(api.generateTerraformCode).toHaveBeenCalledTimes(2);
  });

  test('shows validation errors when present in the response', async () => {
    // Mock API response with validation errors
    api.generateTerraformCode.mockResolvedValue({
      code: mockTerraformCode,
      validationErrors: [
        { line: 10, message: 'Invalid resource configuration' },
        { line: 15, message: 'Missing required property' }
      ]
    });
    
    render(<TerraformCodeView diagramId="test-diagram-id" />);
    
    // Wait for code to load
    await waitFor(() => {
      expect(screen.queryByText(/generating terraform code/i)).not.toBeInTheDocument();
    });
    
    // Check if validation errors are displayed
    expect(screen.getByText(/invalid resource configuration/i)).toBeInTheDocument();
    expect(screen.getByText(/missing required property/i)).toBeInTheDocument();
  });

  test('toggles between different providers when available', async () => {
    // Mock API response with multiple providers
    api.generateTerraformCode.mockResolvedValue({
      code: {
        aws: mockTerraformCode,
        azure: `
          provider "azurerm" {
            features {}
          }
          
          resource "azurerm_virtual_machine" "example" {
            name = "web-server"
            location = "East US"
            vm_size = "Standard_DS1_v2"
          }
        `
      }
    });
    
    render(<TerraformCodeView diagramId="test-diagram-id" />);
    
    // Wait for code to load
    await waitFor(() => {
      expect(screen.queryByText(/generating terraform code/i)).not.toBeInTheDocument();
    });
    
    // Should initially show AWS code
    expect(screen.getByText(/provider "aws"/)).toBeInTheDocument();
    
    // Click on Azure provider button
    const azureButton = screen.getByText(/azure/i);
    await userEvent.click(azureButton);
    
    // Should show Azure code
    expect(screen.getByText(/provider "azurerm"/)).toBeInTheDocument();
    expect(screen.getByText(/azurerm_virtual_machine/)).toBeInTheDocument();
  });

  test('applies syntax highlighting to the code', async () => {
    render(<TerraformCodeView diagramId="test-diagram-id" />);
    
    // Wait for code to load
    await waitFor(() => {
      expect(screen.queryByText(/generating terraform code/i)).not.toBeInTheDocument();
    });
    
    // Check for syntax highlighting elements
    const codeElement = screen.getByTestId('terraform-code');
    expect(codeElement.querySelectorAll('.token')).not.toHaveLength(0);
  });
});