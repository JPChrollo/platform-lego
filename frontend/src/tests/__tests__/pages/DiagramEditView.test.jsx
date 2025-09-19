import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, useParams, useNavigate } from 'react-router-dom';
import DiagramEditView from '../../../../pages/DiagramEdit/DiagramEditView';
import { diagramService } from '../../../../services/api';

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
  useNavigate: jest.fn()
}));

// Mock api service
jest.mock('../../../../services/api', () => ({
  diagramService: {
    getDiagram: jest.fn(),
    updateDiagram: jest.fn()
  }
}));

// Mock child components
jest.mock('../../../../components/diagram/IconMenu', () => ({
  __esModule: true,
  default: function MockIconMenu() {
    return <div data-testid="mock-icon-menu">Icon Menu</div>;
  }
}));

jest.mock('../../../../components/diagram/ConfigurationInfoBox', () => ({
  __esModule: true,
  default: function MockConfigBox({ component, onSave, onClose }) {
    return (
      <div data-testid="mock-config-box">
        <div>Configuring: {component?.name || 'Unknown'}</div>
        <button onClick={() => onSave(component?.id, { test: 'updated' })}>Save</button>
        <button onClick={onClose}>Close</button>
      </div>
    );
  }
}));

jest.mock('../../../../components/diagram/TerraformCodeView', () => ({
  __esModule: true,
  default: function MockTerraformView() {
    return <div data-testid="mock-terraform-view">Terraform Code</div>;
  }
}));

describe('DiagramEditView Component', () => {
  const mockNavigate = jest.fn();
  const mockDiagramData = {
    _id: 'test-diagram-id',
    name: 'Test AWS Diagram',
    base: 'AWS',
    cloud_components: [
      {
        _id: 'comp1',
        component_type: 'ec2',
        name: 'Test EC2',
        position_x: 100,
        position_y: 100,
        configuration: {
          name: 'test-ec2-instance'
        }
      }
    ]
  };

  beforeEach(() => {
    useParams.mockReturnValue({ id: 'test-diagram-id' });
    useNavigate.mockReturnValue(mockNavigate);
    diagramService.getDiagram.mockResolvedValue({ data: mockDiagramData });
    diagramService.updateDiagram.mockResolvedValue({ data: mockDiagramData });
    
    // Mock drag and drop events
    Element.prototype.getBoundingClientRect = jest.fn(() => ({
      width: 200,
      height: 200,
      top: 0,
      left: 0,
      bottom: 200,
      right: 200,
      x: 0,
      y: 0
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should render loading state initially', () => {
    render(<DiagramEditView />, { wrapper: BrowserRouter });
    expect(screen.getByText('Loading diagram...')).toBeInTheDocument();
  });

  test('should fetch and render diagram data', async () => {
    render(<DiagramEditView />, { wrapper: BrowserRouter });

    // Wait for loading to complete
    await waitFor(() => {
      expect(diagramService.getDiagram).toHaveBeenCalledWith('test-diagram-id');
    });

    // Check if diagram title is rendered
    await waitFor(() => {
      expect(screen.getByText('Test AWS Diagram')).toBeInTheDocument();
    });
  });

  test('should handle diagram component selection', async () => {
    render(<DiagramEditView />, { wrapper: BrowserRouter });

    // Wait for diagram to load
    await waitFor(() => {
      expect(screen.queryByText('Loading diagram...')).not.toBeInTheDocument();
    });

    // Find a component and click it
    const components = await screen.findAllByClassName('diagram-component');
    fireEvent.click(components[0]);

    // Check if configuration box is displayed
    await waitFor(() => {
      expect(screen.getByTestId('mock-config-box')).toBeInTheDocument();
    });
  });

  test('should save diagram when save button is clicked', async () => {
    render(<DiagramEditView />, { wrapper: BrowserRouter });

    // Wait for diagram to load
    await waitFor(() => {
      expect(screen.queryByText('Loading diagram...')).not.toBeInTheDocument();
    });

    // Click save diagram button
    const saveButton = screen.getByText('Save Diagram');
    fireEvent.click(saveButton);

    // Check if the API was called
    await waitFor(() => {
      expect(diagramService.updateDiagram).toHaveBeenCalled();
    });

    // Mock window.alert should be called
    expect(global.alert).toHaveBeenCalledWith('Diagram saved successfully');
  });

  test('should toggle icon menu visibility', async () => {
    render(<DiagramEditView />, { wrapper: BrowserRouter });

    // Wait for diagram to load
    await waitFor(() => {
      expect(screen.queryByText('Loading diagram...')).not.toBeInTheDocument();
    });

    // Initially IconMenu should be visible
    expect(screen.getByTestId('mock-icon-menu')).toBeInTheDocument();

    // Click the toggle button to hide it
    const toggleButton = screen.getByText('→');
    fireEvent.click(toggleButton);

    // IconMenu should now be hidden
    expect(screen.queryByTestId('mock-icon-menu')).not.toBeInTheDocument();
  });

  test('should handle save configuration', async () => {
    render(<DiagramEditView />, { wrapper: BrowserRouter });

    // Wait for diagram to load
    await waitFor(() => {
      expect(screen.queryByText('Loading diagram...')).not.toBeInTheDocument();
    });

    // Select a component
    const components = await screen.findAllByClassName('diagram-component');
    fireEvent.click(components[0]);

    // Configuration box should be displayed
    expect(screen.getByTestId('mock-config-box')).toBeInTheDocument();

    // Click save button in config box
    const saveConfigButton = screen.getByText('Save');
    fireEvent.click(saveConfigButton);

    // Component should still be selected after saving
    expect(screen.getByTestId('mock-config-box')).toBeInTheDocument();
  });

  test('should close configuration when close button is clicked', async () => {
    render(<DiagramEditView />, { wrapper: BrowserRouter });

    // Wait for diagram to load
    await waitFor(() => {
      expect(screen.queryByText('Loading diagram...')).not.toBeInTheDocument();
    });

    // Select a component
    const components = await screen.findAllByClassName('diagram-component');
    fireEvent.click(components[0]);

    // Configuration box should be displayed
    expect(screen.getByTestId('mock-config-box')).toBeInTheDocument();

    // Click close button in config box
    const closeButton = screen.getByText('Close');
    fireEvent.click(closeButton);

    // Configuration box should no longer be visible
    await waitFor(() => {
      expect(screen.queryByTestId('mock-config-box')).not.toBeInTheDocument();
    });
  });
});