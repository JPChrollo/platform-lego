import React, { useState, useRef, useEffect } from 'react';
import IconMenu from './IconMenu';
import ConfigurationInfoBox from './ConfigurationInfoBox';
import TerraformCodeView from './TerraformCodeView';
import './DiagramEditView.css';

/**
 * DiagramEditView component for editing cloud architecture diagrams
 * @param {Object} props - Component properties
 * @returns {JSX.Element} DiagramEditView component
 */
const DiagramEditView = () => {
  const [components, setComponents] = useState([]);
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [viewMode, setViewMode] = useState('diagram'); // diagram, terraform
  const canvasRef = useRef(null);
  const [draggingComponent, setDraggingComponent] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  /**
   * Handle drag over event
   * @param {Event} e - Drag over event
   */
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  /**
   * Handle drop event when a component is dropped on the canvas
   * @param {Event} e - Drop event
   */
  const handleDrop = (e) => {
    e.preventDefault();
    
    const componentType = e.dataTransfer.getData('componentType');
    
    if (componentType) {
      // Calculate drop position relative to the canvas
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Add the new component to the components array
      const newComponent = {
        id: `${componentType}-${components.length + 1}`,
        type: componentType,
        x,
        y,
        config: {}
      };
      
      setComponents([...components, newComponent]);
    }
  };

  /**
   * Handle component selection
   * @param {Object} component - Selected component
   */
  const handleComponentSelect = (component) => {
    setSelectedComponent(component);
  };

  /**
   * Handle mouse down event on component
   * @param {Event} e - Mouse down event
   * @param {Object} component - Component being clicked
   */
  const handleMouseDown = (e, component) => {
    e.stopPropagation();
    
    // Calculate offset between mouse position and component position
    const offsetX = e.clientX - component.x;
    const offsetY = e.clientY - component.y;
    
    setDraggingComponent(component);
    setDragOffset({ x: offsetX, y: offsetY });
    setIsDragging(true);
    
    // Also select the component
    handleComponentSelect(component);
  };

  /**
   * Handle mouse move event for dragging
   * @param {Event} e - Mouse move event
   */
  const handleMouseMove = (e) => {
    if (isDragging && draggingComponent) {
      e.preventDefault();
      
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      
      const x = e.clientX - rect.left - dragOffset.x;
      const y = e.clientY - rect.top - dragOffset.y;
      
      // Update the component's position
      setComponents(components.map(comp => 
        comp.id === draggingComponent.id ? { ...comp, x, y } : comp
      ));
      
      // Also update the selected component reference
      setDraggingComponent({ ...draggingComponent, x, y });
    }
  };

  /**
   * Handle mouse up event to end dragging
   */
  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggingComponent(null);
  };

  /**
   * Handle canvas click - deselect components
   */
  const handleCanvasClick = () => {
    setSelectedComponent(null);
  };

  /**
   * Update component configuration
   * @param {Object} updatedConfig - Updated configuration
   */
  const handleConfigUpdate = (updatedConfig) => {
    if (selectedComponent) {
      const updatedComponents = components.map(comp =>
        comp.id === selectedComponent.id ? { ...comp, config: updatedConfig } : comp
      );
      
      setComponents(updatedComponents);
      setSelectedComponent({ ...selectedComponent, config: updatedConfig });
    }
  };

  /**
   * Toggle between diagram view and terraform view
   */
  const toggleViewMode = () => {
    setViewMode(viewMode === 'diagram' ? 'terraform' : 'diagram');
  };

  /**
   * Export diagram as JSON
   */
  const exportDiagram = () => {
    const diagramData = {
      components,
      version: '1.0'
    };
    
    const dataStr = JSON.stringify(diagramData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'cloud-diagram.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  /**
   * Import diagram from JSON file
   */
  const importDiagram = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data && data.components) {
          setComponents(data.components);
        }
      } catch (error) {
        console.error('Error importing diagram:', error);
        alert('Invalid diagram file format.');
      }
    };
    reader.readAsText(file);
    
    // Reset the input value so the same file can be imported again if needed
    e.target.value = '';
  };

  // Add event listeners for mouse move and mouse up
  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, draggingComponent]);

  return (
    <div className="diagram-edit-view">
      <div className="toolbar">
        <button onClick={toggleViewMode} className={`view-toggle ${viewMode}`}>
          {viewMode === 'diagram' ? 'View Terraform Code' : 'Back to Diagram'}
        </button>
        <button onClick={exportDiagram} className="export-button">
          Export Diagram
        </button>
        <label htmlFor="import-file" className="import-button">
          Import Diagram
        </label>
        <input
          type="file"
          id="import-file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={importDiagram}
        />
      </div>
      
      {viewMode === 'diagram' ? (
        <>
          <IconMenu onComponentDrop={(componentType) => {
            // Handle drops into the icon menu (delete component)
            if (selectedComponent) {
              setComponents(components.filter(c => c.id !== selectedComponent.id));
              setSelectedComponent(null);
            }
          }} />
          
          <div 
            ref={canvasRef}
            className="diagram-canvas"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={handleCanvasClick}
          >
            {components.map(component => (
              <div 
                key={component.id}
                className={`diagram-component ${selectedComponent && selectedComponent.id === component.id ? 'selected' : ''}`}
                style={{ 
                  left: component.x, 
                  top: component.y 
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleComponentSelect(component);
                }}
                onMouseDown={(e) => handleMouseDown(e, component)}
                draggable={false}
              >
                <div className="component-icon">
                  <img 
                    src={`/icons/${component.type}.svg`} 
                    alt={component.type}
                  />
                </div>
                <div className="component-label">
                  {component.config.Name || component.id}
                </div>
              </div>
            ))}
          </div>
          
          {selectedComponent && (
            <ConfigurationInfoBox 
              component={selectedComponent} 
              onConfigUpdate={handleConfigUpdate}
              allComponents={components}
            />
          )}
        </>
      ) : (
        <div className="terraform-view-container">
          <TerraformCodeView components={components} />
        </div>
      )}
    </div>
  );
};

export default DiagramEditView;