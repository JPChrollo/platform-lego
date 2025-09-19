import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User, Diagram, CloudComponent, ComponentConfiguration, TerraformPlan, PlanData, PlanError, Deployment } from './models/index.js';

// Load environment variables
dotenv.config();

const migrateDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    // Disable strict mode for this migration to allow saving documents with fields not defined in the schema
    mongoose.set('strictQuery', false);

    console.log('Connected to MongoDB');

    // Create collections for all models if they don't exist
    console.log('Starting database migration...');

    // Get list of existing collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);

    // Create collections if they don't exist
    const models = [
      { 
        name: 'users', 
        model: User,
        defaults: { 
          username: 'temp_user', 
          email: 'temp@example.com', 
          password: 'temppassword',
          diagrams: []
        } 
      },
      { 
        name: 'diagrams', 
        model: Diagram,
        defaults: { 
          name: 'temp_diagram', 
          base: 'AWS',
          cloud_components: []
        } 
      },
      { 
        name: 'cloudcomponents', 
        model: CloudComponent,
        defaults: { 
          name: 'temp_component', 
          code: 'temp_code',
          icon: 'temp_icon.png'
        } 
      },
      { 
        name: 'componentconfigurations', 
        model: ComponentConfiguration,
        defaults: { 
          component_name: 'temp_config',
          terraform_resources: [{ type: 'aws_resource', name: 'temp_resource' }]
        } 
      },
      { 
        name: 'terraformplans', 
        model: TerraformPlan,
        defaults: { 
          status: 'pending'
        } 
      },
      { 
        name: 'plandata', 
        model: PlanData,
        defaults: { 
          resource_type: 'temp_resource',
          data: {}
        } 
      },
      { 
        name: 'planerrors', 
        model: PlanError,
        defaults: { 
          message: 'temp_error',
          code: 'ERR001'
        } 
      },
      { 
        name: 'deployments', 
        model: Deployment,
        defaults: { 
          status: 'pending'
        } 
      }
    ];

    for (const { name, model, defaults } of models) {
      if (!collectionNames.includes(name)) {
        try {
          console.log(`Creating collection: ${name}`);
          // Create a dummy document with defaults to ensure the collection is created
          const tempDoc = new model(defaults);
          await tempDoc.save();
          await model.deleteMany({});
          console.log(`Collection ${name} created successfully`);
        } catch (error) {
          console.error(`Error creating collection ${name}:`, error.message);
        }
      } else {
        console.log(`Collection ${name} already exists`);
      }
    }

    // Update User schema to add diagrams array if not present
    console.log('Updating User schema to add diagrams array if not present');
    const usersToUpdate = await User.find({ diagrams: { $exists: false } });
    for (const user of usersToUpdate) {
      user.diagrams = [];
      await user.save();
    }
    console.log(`Updated ${usersToUpdate.length} user records`);

    console.log('Database migration completed successfully');
  } catch (error) {
    console.error('Database migration failed:', error.message);
    if (error.errors) {
      for (const field in error.errors) {
        console.error(`- Field "${field}": ${error.errors[field].message}`);
      }
    }
  } finally {
    // Close the connection
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the migration
migrateDatabase();