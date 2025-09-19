import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import IconMenu from '../../src/components/IconMenu';
import api from '../../src/services/api';

// Mock the api module
jest.mock('../../src/services/api');

describe('IconMenu Component', () => {
  const mockComponentTemplates = {
    'AWS': [
      {
        type: 'ec2',
        name: 'EC2 Instance',
        icon: 'ec2-icon.png',
        description: 'Elastic Compute Cloud',
        defaultConfiguration: {
          Name: '',
          'Instance Type': 't2.micro',
          'AMI ID': ''
        }
      },
      {
        type: 's3',
        name: 'S3 Bucket',
        icon: 's3-icon.png',
        description: 'Simple Storage Service',
        defaultConfiguration: {
          Name: '',
          'Region': 'us-east-1',
          'Access Control': 'private'
        }
      },
      {
        type: 'vpc',
        name: 'VPC',
        icon: 'vpc-icon.png',
        description: 'Virtual Private Cloud',
        defaultConfiguration: {
          Name: '',
          'CIDR Block': '10.0.0.0/16'
        }
      }
    ],
    'Azure': [
      {
        type: 'vm',
        name: 'Virtual Machine',
        icon: 'vm-icon.png',
        description: 'Azure VM',
        defaultConfiguration: {
          Name: '',
          'Size': 'Standard_B1s',
          'Image': 'Ubuntu 20.04 LTS'
        }
      },
      {
        type: 'storage',
        name: 'Storage Account',
        icon: 'storage-icon.png',
        description: 'Azure Storage',
        defaultConfiguration: {
          Name: '',
          'Kind': 'StorageV2',
          'Replication': 'LRS'
        }
      }
    ]
  };

  const mockOnComponentSelect = jest.fn();
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock the getComponentTemplates function
    api.getComponentTemplates.mockImplementation((provider) => {
      return Promise.resolve(mockComponentTemplates[provider] || []);
    });
  });

  test('renders loading state initially', () => {
    render(<IconMenu cloudProvider="AWS" onComponentSelect={mockOnComponentSelect} />);
    
    expect(screen.getByText(/loading components/i)).toBeInTheDocument();
  });

  test('renders AWS components after loading', async () => {
    render(<IconMenu cloudProvider="AWS" onComponentSelect={mockOnComponentSelect} />);
    
    await waitFor(() => {
      expect(screen.queryByText(/loading components/i)).not.toBeInTheDocument();
    });
    
    expect(screen.getByText('EC2 Instance')).toBeInTheDocument();
    expect(screen.getByText('S3 Bucket')).toBeInTheDocument();
    expect(screen.getByText('VPC')).toBeInTheDocument();
  });

  test('renders Azure components when Azure is selected', async () => {
    render(<IconMenu cloudProvider="Azure" onComponentSelect={mockOnComponentSelect} />);
    
    await waitFor(() => {
      expect(screen.queryByText(/loading components/i)).not.toBeInTheDocument();
    });
    
    expect(screen.getByText('Virtual Machine')).toBeInTheDocument();
    expect(screen.getByText('Storage Account')).toBeInTheDocument();
    expect(screen.queryByText('EC2 Instance')).not.toBeInTheDocument();
  });

  test('calls API with correct cloud provider', async () => {
    render(<IconMenu cloudProvider="AWS" onComponentSelect={mockOnComponentSelect} />);
    
    await waitFor(() => {
      expect(api.getComponentTemplates).toHaveBeenCalledWith('AWS');
    });
  });

  test('calls onComponentSelect when component is clicked', async () => {
    render(<IconMenu cloudProvider="AWS" onComponentSelect={mockOnComponentSelect} />);
    
    await waitFor(() => {
      expect(screen.queryByText(/loading components/i)).not.toBeInTheDocument();
    });
    
    // Click on EC2 component
    await userEvent.click(screen.getByText('EC2 Instance'));
    
    expect(mockOnComponentSelect).toHaveBeenCalledWith(mockComponentTemplates.AWS[0]);
  });

  test('shows error when component loading fails', async () => {
    // Mock API error
    api.getComponentTemplates.mockRejectedValue(new Error('Failed to load components'));
    
    render(<IconMenu cloudProvider="AWS" onComponentSelect={mockOnComponentSelect} />);
    
    await waitFor(() => {
      expect(screen.getByText(/error loading components/i)).toBeInTheDocument();
    });
  });

  test('displays component descriptions on hover', async () => {
    render(<IconMenu cloudProvider="AWS" onComponentSelect={mockOnComponentSelect} />);
    
    await waitFor(() => {
      expect(screen.queryByText(/loading components/i)).not.toBeInTheDocument();
    });
    
    // Hover over EC2 component
    const ec2Component = screen.getByText('EC2 Instance');
    await userEvent.hover(ec2Component);
    
    // Check if tooltip/description is shown
    expect(screen.getByText('Elastic Compute Cloud')).toBeInTheDocument();
  });

  test('changes cloud provider when prop changes', async () => {
    const { rerender } = render(<IconMenu cloudProvider="AWS" onComponentSelect={mockOnComponentSelect} />);
    
    await waitFor(() => {
      expect(screen.queryByText(/loading components/i)).not.toBeInTheDocument();
      expect(screen.getByText('EC2 Instance')).toBeInTheDocument();
    });
    
    // Change cloud provider
    rerender(<IconMenu cloudProvider="Azure" onComponentSelect={mockOnComponentSelect} />);
    
    // Should show loading again
    expect(screen.getByText(/loading components/i)).toBeInTheDocument();
    
    // Then load Azure components
    await waitFor(() => {
      expect(screen.queryByText(/loading components/i)).not.toBeInTheDocument();
      expect(screen.getByText('Virtual Machine')).toBeInTheDocument();
      expect(screen.queryByText('EC2 Instance')).not.toBeInTheDocument();
    });
    
    // API should be called with new provider
    expect(api.getComponentTemplates).toHaveBeenCalledWith('Azure');
  });

  test('applies drag start handler to components', async () => {
    render(<IconMenu cloudProvider="AWS" onComponentSelect={mockOnComponentSelect} />);
    
    await waitFor(() => {
      expect(screen.queryByText(/loading components/i)).not.toBeInTheDocument();
    });
    
    // Get EC2 component
    const ec2Component = screen.getByText('EC2 Instance').closest('.component-icon');
    
    // Create a mock drag event
    const mockDataTransfer = {
      setData: jest.fn(),
      effectAllowed: null
    };
    
    // Trigger drag start
    const dragStartEvent = new Event('dragstart', { bubbles: true });
    dragStartEvent.dataTransfer = mockDataTransfer;
    
    ec2Component.dispatchEvent(dragStartEvent);
    
    // Verify data transfer was set
    expect(mockDataTransfer.setData).toHaveBeenCalledWith(
      'application/json',
      JSON.stringify(mockComponentTemplates.AWS[0])
    );
    expect(mockDataTransfer.effectAllowed).toBe('copy');
  });

  test('renders component icons correctly', async () => {
    render(<IconMenu cloudProvider="AWS" onComponentSelect={mockOnComponentSelect} />);
    
    await waitFor(() => {
      expect(screen.queryByText(/loading components/i)).not.toBeInTheDocument();
    });
    
    // Check if icons are rendered
    const icons = screen.getAllByRole('img');
    expect(icons.length).toBe(3); // 3 AWS components
    
    // Check first icon src
    expect(icons[0]).toHaveAttribute('src', 'ec2-icon.png');
    expect(icons[0]).toHaveAttribute('alt', 'EC2 Instance');
  });

  test('groups components by category when categories are provided', async () => {
    // Mock API to return categorized components
    api.getComponentTemplates.mockResolvedValueOnce([
      {
        type: 'ec2',
        name: 'EC2 Instance',
        icon: 'ec2-icon.png',
        category: 'Compute',
        description: 'Elastic Compute Cloud'
      },
      {
        type: 's3',
        name: 'S3 Bucket',
        icon: 's3-icon.png',
        category: 'Storage',
        description: 'Simple Storage Service'
      },
      {
        type: 'lambda',
        name: 'Lambda Function',
        icon: 'lambda-icon.png',
        category: 'Compute',
        description: 'Serverless Functions'
      }
    ]);
    
    render(<IconMenu cloudProvider="AWS" onComponentSelect={mockOnComponentSelect} />);
    
    await waitFor(() => {
      expect(screen.queryByText(/loading components/i)).not.toBeInTheDocument();
    });
    
    // Check if categories are rendered
    expect(screen.getByText('Compute')).toBeInTheDocument();
    expect(screen.getByText('Storage')).toBeInTheDocument();
    
    // Check if components are grouped by category
    const computeSection = screen.getByText('Compute').closest('.component-category');
    within(computeSection).getByText('EC2 Instance');
    within(computeSection).getByText('Lambda Function');
    
    const storageSection = screen.getByText('Storage').closest('.component-category');
    within(storageSection).getByText('S3 Bucket');
  });

  test('provides search functionality for components', async () => {
    render(<IconMenu cloudProvider="AWS" onComponentSelect={mockOnComponentSelect} />);
    
    await waitFor(() => {
      expect(screen.queryByText(/loading components/i)).not.toBeInTheDocument();
    });
    
    // Get search input
    const searchInput = screen.getByPlaceholderText(/search components/i);
    
    // Search for "S3"
    await userEvent.type(searchInput, 'S3');
    
    // Only S3 component should be visible
    expect(screen.getByText('S3 Bucket')).toBeInTheDocument();
    expect(screen.queryByText('EC2 Instance')).not.toBeInTheDocument();
    expect(screen.queryByText('VPC')).not.toBeInTheDocument();
    
    // Clear search
    await userEvent.clear(searchInput);
    
    // All components should be visible again
    expect(screen.getByText('S3 Bucket')).toBeInTheDocument();
    expect(screen.getByText('EC2 Instance')).toBeInTheDocument();
    expect(screen.getByText('VPC')).toBeInTheDocument();
  });

  test('search is case-insensitive and searches descriptions too', async () => {
    render(<IconMenu cloudProvider="AWS" onComponentSelect={mockOnComponentSelect} />);
    
    await waitFor(() => {
      expect(screen.queryByText(/loading components/i)).not.toBeInTheDocument();
    });
    
    // Get search input
    const searchInput = screen.getByPlaceholderText(/search components/i);
    
    // Search for "storage" (part of S3 description)
    await userEvent.type(searchInput, 'storage');
    
    // Only S3 component should be visible (matches description)
    expect(screen.getByText('S3 Bucket')).toBeInTheDocument();
    expect(screen.queryByText('EC2 Instance')).not.toBeInTheDocument();
    
    // Search for "VIRTual" (case-insensitive)
    await userEvent.clear(searchInput);
    await userEvent.type(searchInput, 'VIRTual');
    
    // VPC should be visible (Virtual Private Cloud)
    expect(screen.getByText('VPC')).toBeInTheDocument();
  });
});

// Helper function for testing within a specific element
function within(element) {
  return {
    getByText: (text) => {
      const nodes = Array.from(element.querySelectorAll('*'));
      const found = nodes.find(node => node.textContent.includes(text));
      if (!found) {
        throw new Error(`Text "${text}" not found within the given element`);
      }
      return found;
    }
  };
}