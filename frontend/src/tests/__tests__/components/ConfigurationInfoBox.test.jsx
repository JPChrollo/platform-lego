import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ConfigurationInfoBox from '../../../../components/diagram/ConfigurationInfoBox';
import { generateTerraformCode } from '../../../../utils/terraformGenerator';

// Mock the terraformGenerator utility
jest.mock('../../../../utils/terraformGenerator', () => ({
  generateTerraformCode: jest.fn()
}));

describe('ConfigurationInfoBox Component', () => {
  const mockPosition = { x: 100, y: 100 };
  const mockOnSave = jest.fn();
  const mockOnClose = jest.fn();
  const mockOnConnectionsChange = jest.fn();
  
  // Create a mock EC2 component for testing
  const mockEC2Component = {
    id: 'ec2-test-id',
    name: 'Test EC2 Instance',
    type: 'ec2',
    config: {
      Name: 'test-instance',
      'Instance Type': 't2.micro',
      'AMI ID': 'ami-12345678',
    }
  };
  
  // Create mock available references for testing connections
  const mockReferences = [
    {
      id: 'vpc-test-id',
      name: 'Test VPC',
      type: 'vpc',
      config: {}
    },
    {
      id: 's3-test-id',
      name: 'Test S3 Bucket',
      type: 's3',
      config: {}
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders correctly with component data', () => {
    render(
      <ConfigurationInfoBox
        component={mockEC2Component}
        position={mockPosition}
        onSave={mockOnSave}
        onClose={mockOnClose}
        onConnectionsChange={mockOnConnectionsChange}
        availableReferences={mockReferences}
      />
    );

    // Check if component name is displayed
    expect(screen.getByText(/Test EC2 Instance/i)).toBeInTheDocument();
    
    // Check if configuration fields are rendered
    expect(screen.getByLabelText(/Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Instance Type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/AMI ID/i)).toBeInTheDocument();
    
    // Check if the input values are correctly populated
    expect(screen.getByLabelText(/Name/i).value).toBe('test-instance');
    expect(screen.getByLabelText(/Instance Type/i).value).toBe('t2.micro');
    expect(screen.getByLabelText(/AMI ID/i).value).toBe('ami-12345678');
  });

  test('handles form field changes correctly', () => {
    render(
      <ConfigurationInfoBox
        component={mockEC2Component}
        position={mockPosition}
        onSave={mockOnSave}
        onClose={mockOnClose}
        onConnectionsChange={mockOnConnectionsChange}
        availableReferences={mockReferences}
      />
    );

    // Change an input value
    const nameInput = screen.getByLabelText(/Name/i);
    fireEvent.change(nameInput, { target: { value: 'updated-instance-name' } });
    
    // The input value should update
    expect(nameInput.value).toBe('updated-instance-name');
  });

  test('calls onSave with updated values when form is submitted', async () => {
    render(
      <ConfigurationInfoBox
        component={mockEC2Component}
        position={mockPosition}
        onSave={mockOnSave}
        onClose={mockOnClose}
        onConnectionsChange={mockOnConnectionsChange}
        availableReferences={mockReferences}
      />
    );

    // Change input values
    const nameInput = screen.getByLabelText(/Name/i);
    fireEvent.change(nameInput, { target: { value: 'updated-instance-name' } });

    // Submit the form
    const saveButton = screen.getByText(/Save/i);
    fireEvent.click(saveButton);

    // Check if onSave was called with the correct values
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(
        'ec2-test-id',
        expect.objectContaining({
          Name: 'updated-instance-name',
          'Instance Type': 't2.micro',
          'AMI ID': 'ami-12345678'
        })
      );
    });
  });

  test('calls onClose when close button is clicked', () => {
    render(
      <ConfigurationInfoBox
        component={mockEC2Component}
        position={mockPosition}
        onSave={mockOnSave}
        onClose={mockOnClose}
        onConnectionsChange={mockOnConnectionsChange}
        availableReferences={mockReferences}
      />
    );

    // Click the close button
    const closeButton = screen.getByText(/Cancel/i);
    fireEvent.click(closeButton);

    // Check if onClose was called
    expect(mockOnClose).toHaveBeenCalled();
  });

  test('handles reference selection correctly', async () => {
    // Use a component type that has reference fields
    const mockEC2WithReferences = {
      ...mockEC2Component,
      config: {
        ...mockEC2Component.config,
        'Security Group': null,  // Reference field
      }
    };

    render(
      <ConfigurationInfoBox
        component={mockEC2WithReferences}
        position={mockPosition}
        onSave={mockOnSave}
        onClose={mockOnClose}
        onConnectionsChange={mockOnConnectionsChange}
        availableReferences={mockReferences}
      />
    );

    // Find the select for reference field and change its value
    const referenceSelect = screen.getByLabelText(/Security Group/i);
    fireEvent.change(referenceSelect, { target: { value: 'vpc-test-id' } });

    // Submit the form
    const saveButton = screen.getByText(/Save/i);
    fireEvent.click(saveButton);

    // Check if onSave was called with the reference value
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(
        'ec2-test-id',
        expect.objectContaining({
          'Security Group': 'vpc-test-id'
        })
      );
    });

    // Check if onConnectionsChange was called
    expect(mockOnConnectionsChange).toHaveBeenCalled();
  });

  test('stops event propagation to prevent closing on click', () => {
    render(
      <ConfigurationInfoBox
        component={mockEC2Component}
        position={mockPosition}
        onSave={mockOnSave}
        onClose={mockOnClose}
        onConnectionsChange={mockOnConnectionsChange}
        availableReferences={mockReferences}
      />
    );
    
    // Create a mock event with stopPropagation method
    const mockEvent = {
      stopPropagation: jest.fn(),
      preventDefault: jest.fn()
    };
    
    // Get the component container
    const container = screen.getByTestId('config-info-box-container');
    
    // Simulate mousedown event
    fireEvent.mouseDown(container, mockEvent);
    
    // Check if stopPropagation was called
    expect(mockEvent.stopPropagation).toHaveBeenCalled();
    expect(mockEvent.preventDefault).toHaveBeenCalled();
  });
  
  test('shows validation errors for required fields', async () => {
    render(
      <ConfigurationInfoBox
        component={mockEC2Component}
        position={mockPosition}
        onSave={mockOnSave}
        onClose={mockOnClose}
        onConnectionsChange={mockOnConnectionsChange}
        availableReferences={mockReferences}
      />
    );
    
    // Clear a required field
    const amiInput = screen.getByLabelText(/AMI ID/i);
    fireEvent.change(amiInput, { target: { value: '' } });
    
    // Submit the form
    const saveButton = screen.getByText(/Save/i);
    fireEvent.click(saveButton);
    
    // Check for validation error
    await waitFor(() => {
      expect(screen.getByText(/This field is required/i)).toBeInTheDocument();
    });
    
    // onSave should not be called
    expect(mockOnSave).not.toHaveBeenCalled();
  });
});