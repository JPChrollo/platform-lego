import Diagram from '../models/Diagram.js';
import CloudComponent from '../models/CloudComponent.js';

// Get all diagrams for a user
export const getUserDiagrams = async (req, res) => {
  try {
    const userId = req.user._id;
    
    console.log(`Fetching all diagrams for user ${userId}`);
    
    if (!userId) {
      console.error('Missing user ID in request');
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    const diagrams = await Diagram.find({ created_by: userId });
    
    console.log(`Found ${diagrams.length} diagrams for user ${userId}`);
    
    // Return empty array instead of null if no diagrams found
    res.status(200).json(diagrams || []);
  } catch (error) {
    console.error('Error fetching user diagrams:', error);
    
    // Provide detailed error messages
    let errorMessage = 'Failed to fetch diagrams';
    
    if (error.name === 'CastError') {
      errorMessage = 'Invalid user ID format';
    }
    
    res.status(500).json({ message: errorMessage });
  }
};

// Get a single diagram by ID
export const getDiagramById = async (req, res) => {
  try {
    const diagramId = req.params.id;
    const userId = req.user._id;
    
    console.log(`Fetching diagram ${diagramId} for user ${userId}`);
    
    // Use populate to get the full component details
    const diagram = await Diagram.findOne({ 
      _id: diagramId,
      created_by: userId
    }).populate('cloud_components');
    
    if (!diagram) {
      console.log(`Diagram ${diagramId} not found for user ${userId}`);
      return res.status(404).json({ message: 'Diagram not found' });
    }
    
    console.log(`Found diagram: ${diagram.name} with ${diagram.cloud_components?.length || 0} components`);
    
    // If there are no components yet, also fetch any components that might not be linked
    // This is for backward compatibility
    if (!diagram.cloud_components || diagram.cloud_components.length === 0) {
      console.log(`No components linked to diagram, checking for components with diagram_id`);
      
      try {
        const unlinkedComponents = await CloudComponent.find({ diagram_id: diagramId });
        
        if (unlinkedComponents && unlinkedComponents.length > 0) {
          console.log(`Found ${unlinkedComponents.length} unlinked components`);
          
          // Link these components to the diagram
          diagram.cloud_components = unlinkedComponents.map(comp => comp._id);
          await diagram.save();
          
          // Now fetch the updated diagram with populated components
          const updatedDiagram = await Diagram.findOne({ _id: diagramId })
            .populate('cloud_components');
          
          console.log(`Now returning diagram with ${updatedDiagram.cloud_components?.length || 0} components`);
          return res.status(200).json(updatedDiagram);
        }
      } catch (unlinkErr) {
        console.error('Error checking for unlinked components:', unlinkErr);
        // Continue with returning the diagram as is
      }
    }
    
    res.status(200).json(diagram);
  } catch (error) {
    console.error('Error fetching diagram:', error);
    
    // Provide detailed error messages
    let errorMessage = 'Failed to fetch diagram';
    
    if (error.name === 'CastError') {
      errorMessage = 'Invalid diagram ID format';
    }
    
    res.status(500).json({ message: errorMessage });
  }
};

// Create a new diagram
export const createDiagram = async (req, res) => {
  try {
    const { name, cloudProvider } = req.body;
    const userId = req.user._id;
    
    // Add detailed debug logging
    console.log('Create Diagram Request:', {
      body: req.body,
      extractedName: name,
      extractedCloudProvider: cloudProvider,
      userId
    });
    
    if (!name || !cloudProvider) {
      return res.status(400).json({ message: 'Name and cloud provider are required' });
    }
    
    const diagramData = {
      name,
      base: cloudProvider,
      created_by: userId,
      cloud_components: []
    };
    
    console.log('Creating new diagram with data:', diagramData);
    
    const newDiagram = new Diagram(diagramData);
    
    let savedDiagram;
    
    try {
      savedDiagram = await newDiagram.save();
      console.log('Diagram saved successfully:', savedDiagram);
    } catch (saveError) {
      console.error('Error saving diagram:', saveError);
      
      // Check model validation errors
      if (saveError.errors) {
        for (const field in saveError.errors) {
          console.error(`Validation error in field '${field}':`, saveError.errors[field].message);
        }
      }
      
      throw saveError;
    }
    
    // Add the diagram to the user's diagrams array
    // First, check if the user and diagrams array exist
    console.log('User from request:', req.user);
    
    // Initialize diagrams array if it doesn't exist
    if (!req.user.diagrams) {
      console.log('Diagrams array not found, initializing it');
      req.user.diagrams = [];
    }
    
    // Now push the diagram ID
    req.user.diagrams.push(savedDiagram._id);
    await req.user.save();
    
    res.status(201).json(savedDiagram);
  } catch (error) {
    console.error('Error creating diagram:', error);
    
    // Provide more detailed error messages
    let errorMessage = 'Failed to create diagram';
    
    if (error.name === 'TypeError' && error.message.includes('undefined')) {
      errorMessage = 'User data issue: ' + error.message;
    } else if (error.name === 'ValidationError') {
      errorMessage = 'Diagram validation failed: ' + 
        Object.keys(error.errors).map(field => 
          `${field} (${error.errors[field].message})`
        ).join(', ');
    }
    
    res.status(500).json({ message: errorMessage });
  }
};

// Update a diagram
export const updateDiagram = async (req, res) => {
  try {
    const diagramId = req.params.id;
    const userId = req.user._id;
    const { name, cloudProvider, components } = req.body;
    
    console.log(`Updating diagram ${diagramId} for user ${userId} with:`, { 
      name, 
      cloudProvider,
      componentsCount: components ? components.length : 0
    });
    
    const diagram = await Diagram.findOne({ 
      _id: diagramId,
      created_by: userId
    });
    
    if (!diagram) {
      console.log(`Diagram ${diagramId} not found for user ${userId}`);
      return res.status(404).json({ message: 'Diagram not found' });
    }
    
    if (name) diagram.name = name;
    if (cloudProvider) diagram.base = cloudProvider;
    
    // Handle components update
    if (components) {
      try {
        console.log(`Processing ${components.length} components for diagram ${diagramId}`);
        
        // First, delete existing components
        if (diagram.cloud_components && diagram.cloud_components.length > 0) {
          console.log(`Removing ${diagram.cloud_components.length} existing components`);
          // Delete all associated cloud components
          await CloudComponent.deleteMany({ diagram_id: diagramId });
        }
        
        // Reset cloud_components array
        diagram.cloud_components = [];
        
        // Create new components based on the data received
        for (const comp of components) {
          const componentData = {
            diagram_id: diagramId,
            name: comp.name,
            component_type: comp.type,
            position_x: comp.x,
            position_y: comp.y,
            configuration: comp.config || {},
            icon: comp.icon // Save the icon
          };
          
          console.log(`Creating new component: ${comp.name} of type ${comp.type}`);
          const newComponent = new CloudComponent(componentData);
          const savedComponent = await newComponent.save();
          
          // Add new component to the diagram
          diagram.cloud_components.push(savedComponent._id);
        }
      } catch (compError) {
        console.error('Error processing components:', compError);
        return res.status(500).json({ 
          message: `Error updating diagram components: ${compError.message}`
        });
      }
    }
    
    console.log(`Saving updated diagram with changes:`, { 
      name: diagram.name, 
      base: diagram.base,
      componentsCount: diagram.cloud_components.length
    });
    
    const updatedDiagram = await diagram.save();
    console.log('Diagram updated successfully:', updatedDiagram);
    
    res.status(200).json(updatedDiagram);
  } catch (error) {
    console.error('Error updating diagram:', error);
    
    // Provide detailed error messages
    let errorMessage = 'Failed to update diagram';
    
    if (error.name === 'ValidationError') {
      errorMessage = 'Diagram validation failed: ' + 
        Object.keys(error.errors).map(field => 
          `${field} (${error.errors[field].message})`
        ).join(', ');
    } else if (error.name === 'CastError') {
      errorMessage = 'Invalid diagram ID format';
    }
    
    res.status(500).json({ message: errorMessage });
  }
};

// Delete a diagram
export const deleteDiagram = async (req, res) => {
  try {
    const diagramId = req.params.id;
    const userId = req.user._id;
    
    console.log(`Deleting diagram ${diagramId} for user ${userId}`);
    
    const diagram = await Diagram.findOne({ 
      _id: diagramId,
      created_by: userId
    });
    
    if (!diagram) {
      console.log(`Diagram ${diagramId} not found for user ${userId}`);
      return res.status(404).json({ message: 'Diagram not found' });
    }
    
    // Delete all associated cloud components
    console.log(`Deleting all components for diagram ${diagramId}`);
    const deleteResult = await CloudComponent.deleteMany({ diagram_id: diagramId });
    console.log(`Deleted ${deleteResult.deletedCount} components`);
    
    // Remove the diagram from the user's diagrams array
    const user = req.user;
    
    // Initialize diagrams array if it doesn't exist
    if (!user.diagrams) {
      console.log('Initializing user.diagrams array');
      user.diagrams = [];
    } else {
      // Remove diagram from array
      console.log(`Removing diagram ${diagramId} from user's diagrams array`);
      user.diagrams = user.diagrams.filter(
        diagId => diagId.toString() !== diagramId
      );
    }
    
    await user.save();
    
    // Delete the diagram
    console.log(`Removing diagram ${diagramId} from database`);
    // Changed from diagram.remove() to Diagram.findByIdAndDelete() for compatibility
    await Diagram.findByIdAndDelete(diagramId);
    
    console.log('Diagram deleted successfully');
    res.status(200).json({ message: 'Diagram deleted successfully' });
  } catch (error) {
    console.error('Error deleting diagram:', error);
    
    // Provide detailed error messages
    let errorMessage = 'Failed to delete diagram';
    
    if (error.name === 'CastError') {
      errorMessage = 'Invalid diagram ID format';
    }
    
    res.status(500).json({ message: errorMessage });
  }
};

// Add component to diagram
export const addComponentToDiagram = async (req, res) => {
  try {
    const diagramId = req.params.id;
    const userId = req.user._id;
    const { type, name, position, config } = req.body;
    
    console.log(`Adding component to diagram ${diagramId} for user ${userId}:`, { type, name, position });
    
    if (!type || !name || !position) {
      console.log('Missing required fields:', { type, name, position });
      return res.status(400).json({ 
        message: 'Component type, name, and position are required' 
      });
    }
    
    const diagram = await Diagram.findOne({ 
      _id: diagramId,
      created_by: userId
    });
    
    if (!diagram) {
      console.log(`Diagram ${diagramId} not found for user ${userId}`);
      return res.status(404).json({ message: 'Diagram not found' });
    }
    
    // Create new cloud component
    const componentData = {
      diagram_id: diagramId,
      component_type: type,
      name,
      position_x: position.x,
      position_y: position.y,
      configuration: config || {}
    };
    
    console.log('Creating new component with data:', componentData);
    
    const newComponent = new CloudComponent(componentData);
    
    // Initialize cloud_components array if it doesn't exist
    if (!diagram.cloud_components) {
      console.log('Initializing cloud_components array');
      diagram.cloud_components = [];
    }
    
    const savedComponent = await newComponent.save();
    console.log('Component saved successfully:', savedComponent);
    
    // Add component to diagram
    diagram.cloud_components.push(savedComponent._id);
    await diagram.save();
    
    res.status(201).json(savedComponent);
  } catch (error) {
    console.error('Error adding component to diagram:', error);
    
    // Provide detailed error messages
    let errorMessage = 'Failed to add component to diagram';
    
    if (error.name === 'ValidationError') {
      errorMessage = 'Component validation failed: ' + 
        Object.keys(error.errors).map(field => 
          `${field} (${error.errors[field].message})`
        ).join(', ');
    } else if (error.name === 'CastError') {
      errorMessage = 'Invalid ID format';
    }
    
    res.status(500).json({ message: errorMessage });
  }
};

// Delete component from diagram
export const removeComponentFromDiagram = async (req, res) => {
  try {
    const diagramId = req.params.diagramId;
    const componentId = req.params.componentId;
    const userId = req.user._id;
    
    console.log(`Removing component ${componentId} from diagram ${diagramId} for user ${userId}`);
    
    const diagram = await Diagram.findOne({ 
      _id: diagramId,
      created_by: userId
    });
    
    if (!diagram) {
      console.log(`Diagram ${diagramId} not found for user ${userId}`);
      return res.status(404).json({ message: 'Diagram not found' });
    }
    
    // Check if component exists in the diagram
    const componentExists = diagram.cloud_components.some(
      component => component.toString() === componentId
    );
    
    if (!componentExists) {
      console.log(`Component ${componentId} not found in diagram ${diagramId}`);
      return res.status(404).json({ message: 'Component not found in diagram' });
    }
    
    // Remove component from diagram
    console.log(`Filtering out component ${componentId} from diagram.cloud_components`);
    diagram.cloud_components = diagram.cloud_components.filter(
      component => component.toString() !== componentId
    );
    
    await diagram.save();
    
    // Delete the component
    console.log(`Deleting component ${componentId} from database`);
    const deletedComponent = await CloudComponent.findByIdAndDelete(componentId);
    
    if (!deletedComponent) {
      console.log(`Warning: Component ${componentId} not found in database`);
    }
    
    console.log('Component removed successfully');
    res.status(200).json({ message: 'Component removed successfully' });
  } catch (error) {
    console.error('Error removing component from diagram:', error);
    
    // Provide detailed error messages
    let errorMessage = 'Failed to remove component from diagram';
    
    if (error.name === 'CastError') {
      errorMessage = 'Invalid ID format';
    }
    
    res.status(500).json({ message: errorMessage });
  }
};