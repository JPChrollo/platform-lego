import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User, Diagram, CloudComponent, ComponentConfiguration, TerraformPlan, PlanData, PlanError, Deployment } from './models/index.js';

// Load environment variables
dotenv.config();

const migrateDatabase = async () => {
  let connection;
  
  try {
    // Connect to MongoDB directly
    connection = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('Connected to MongoDB');

    // Get list of existing collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);

    // Define collection names based on models
    const requiredCollections = [
      'users',
      'diagrams',
      'cloudcomponents',
      'componentconfigurations',
      'terraformplans',
      'plandata',
      'planerrors',
      'deployments'
    ];

    // Create collections directly using the MongoDB driver (bypassing Mongoose validation)
    for (const collectionName of requiredCollections) {
      if (!collectionNames.includes(collectionName)) {
        try {
          console.log(`Creating collection: ${collectionName}`);
          await mongoose.connection.db.createCollection(collectionName);
          console.log(`Collection ${collectionName} created successfully`);
        } catch (error) {
          console.error(`Error creating collection ${collectionName}:`, error.message);
        }
      } else {
        console.log(`Collection ${collectionName} already exists`);
      }
    }

    // Update User schema to add diagrams array if not present
    console.log('Updating User schema to add diagrams array if not present');
    
    // Use direct MongoDB update instead of Mongoose to avoid validation
    const usersCollection = mongoose.connection.db.collection('users');
    const usersToUpdate = await usersCollection.updateMany(
      { diagrams: { $exists: false } },
      { $set: { diagrams: [] } }
    );
    
    console.log(`Updated ${usersToUpdate.modifiedCount} user records with diagrams array`);

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
    if (connection) {
      await mongoose.disconnect();
      console.log('Disconnected from MongoDB');
    }
  }
};

// Run the migration
migrateDatabase();