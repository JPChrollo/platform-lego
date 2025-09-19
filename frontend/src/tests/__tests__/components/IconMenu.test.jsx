import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import IconMenu from '../../../../components/diagram/IconMenu';

describe('IconMenu Component', () => {
  const mockOnClose = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock drag events
    global.DataTransfer = class {
      constructor() {
        this.data = {};
      }
      setData(format, data) {
        this.data[format] = data;
      }
      getData(format) {
        return this.data[format] || '';
      }
    };
  });

  test('renders with AWS components by default', () => {
    render(<IconMenu onClose={mockOnClose} />);
    
    // Check if component heading is displayed
    expect(screen.getByText(/AWS Components/i)).toBeInTheDocument();
    
    // Check if AWS components are rendered
    expect(screen.getByText('EC2')).toBeInTheDocument();
    expect(screen.getByText('S3 Bucket')).toBeInTheDocument();
    expect(screen.getByText('Lambda')).toBeInTheDocument();
  });

  test('renders components for specified cloud provider', () => {
    render(<IconMenu cloudProvider="GCP" onClose={mockOnClose} />);
    
    // Check if GCP components are rendered
    expect(screen.getByText(/GCP Components/i)).toBeInTheDocument();
    expect(screen.getByText('Compute Engine')).toBeInTheDocument();
    expect(screen.getByText('Cloud Storage')).toBeInTheDocument();
    expect(screen.getByText('Cloud Functions')).toBeInTheDocument();
  });

  test('calls onClose when close button is clicked', () => {
    render(<IconMenu onClose={mockOnClose} />);
    
    // Find and click the close button
    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);
    
    // Check if onClose was called
    expect(mockOnClose).toHaveBeenCalled();
  });

  test('handles dragStart event correctly', () => {
    render(<IconMenu onClose={mockOnClose} />);
    
    // Get a draggable component
    const ec2Component = screen.getByText('EC2').closest('.icon-menu-item');
    
    // Create a mock event
    const mockEvent = {
      dataTransfer: new global.DataTransfer(),
      preventDefault: jest.fn(),
      stopPropagation: jest.fn()
    };
    
    // Trigger dragStart
    fireEvent.dragStart(ec2Component, mockEvent);
    
    // Check if component data was set
    const componentData = mockEvent.dataTransfer.getData('component');
    expect(componentData).toBeTruthy();
    
    // Parse the data to check content
    const parsedData = JSON.parse(componentData);
    expect(parsedData.id).toBe('ec2');
    expect(parsedData.name).toBe('EC2');
  });

  test('switches between cloud providers', () => {
    render(<IconMenu onClose={mockOnClose} />);
    
    // Initially AWS components should be shown
    expect(screen.getByText(/AWS Components/i)).toBeInTheDocument();
    
    // Get the GCP provider button
    const gcpButton = screen.getByText('GCP');
    fireEvent.click(gcpButton);
    
    // Now GCP components should be shown
    expect(screen.getByText(/GCP Components/i)).toBeInTheDocument();
    expect(screen.getByText('Compute Engine')).toBeInTheDocument();
    
    // Switch to Azure
    const azureButton = screen.getByText('Azure');
    fireEvent.click(azureButton);
    
    // Azure components should be shown
    expect(screen.getByText(/Azure Components/i)).toBeInTheDocument();
    expect(screen.getByText('Virtual Machines')).toBeInTheDocument();
  });

  test('has correct drag preview image', () => {
    render(<IconMenu onClose={mockOnClose} />);
    
    // Get a draggable component
    const ec2Component = screen.getByText('EC2').closest('.icon-menu-item');
    
    // Mock setDragImage method
    const mockSetDragImage = jest.fn();
    
    // Create a mock event with setDragImage method
    const mockEvent = {
      dataTransfer: {
        setData: jest.fn(),
        setDragImage: mockSetDragImage,
        effectAllowed: ''
      },
      preventDefault: jest.fn(),
      stopPropagation: jest.fn()
    };
    
    // Trigger dragStart
    fireEvent.dragStart(ec2Component, mockEvent);
    
    // Check if setDragImage was called
    expect(mockSetDragImage).toHaveBeenCalled();
    
    // Check if effectAllowed was set to copy
    expect(mockEvent.dataTransfer.effectAllowed).toBe('copy');
  });

  test('renders search input and filters components', () => {
    render(<IconMenu onClose={mockOnClose} />);
    
    // Get search input
    const searchInput = screen.getByPlaceholderText(/Search components/i);
    expect(searchInput).toBeInTheDocument();
    
    // Initially all components should be visible
    expect(screen.getByText('EC2')).toBeInTheDocument();
    expect(screen.getByText('S3 Bucket')).toBeInTheDocument();
    expect(screen.getByText('Lambda')).toBeInTheDocument();
    
    // Type in search box to filter
    fireEvent.change(searchInput, { target: { value: 'ec2' } });
    
    // Only EC2 should remain visible
    expect(screen.getByText('EC2')).toBeInTheDocument();
    
    // These components should be hidden or filtered out
    const s3Elements = screen.queryAllByText('S3 Bucket');
    expect(s3Elements.every(el => el.closest('.icon-menu-item').style.display === 'none')).toBe(true);
  });
});