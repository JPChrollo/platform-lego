# Platform Lego: Database Migration Guide

This document explains how to run the database migration script to update your MongoDB database schema.

## Overview

The migration script does the following:

1. Creates all necessary collections if they don't exist
2. Updates existing User documents to include the new `diagrams` array field
3. Ensures proper data structure for all models according to the ER diagram

## Prerequisites

- Node.js installed
- MongoDB running
- .env file with MONGODB_URI configured

## Running the Migration

1. Navigate to the backend directory:
```bash
cd backend
```

2. Try running the standard migration script first:
```bash
node dbMigration.js
```

3. If you encounter validation errors, use the direct migration approach:
```bash
node directMigration.js
```

4. Check the console output for any errors or success messages.

## Migration Approaches

### Standard Migration (dbMigration.js)
- Uses Mongoose models to create collections
- Provides default values for required fields
- Maintains schema validation
- Better for new databases or when data integrity is critical

### Direct Migration (directMigration.js)
- Uses MongoDB driver directly to create collections
- Bypasses Mongoose validation
- Better when encountering validation errors
- Recommended for fixing schema issues

## Expected Output

Upon successful completion, you should see output similar to:

```
Connected to MongoDB
Starting database migration...
Collection users already exists
Creating collection: diagrams
Collection diagrams created successfully
Creating collection: cloudcomponents
Collection cloudcomponents created successfully
Creating collection: componentconfigurations
Collection componentconfigurations created successfully
Creating collection: terraformplans
Collection terraformplans created successfully
Creating collection: plandata
Collection plandata created successfully
Creating collection: planerrors
Collection planerrors created successfully
Creating collection: deployments
Collection deployments created successfully
Updating User schema to add diagrams array if not present
Updated X user records
Database migration completed successfully
Disconnected from MongoDB
```

## Troubleshooting

If you encounter any errors during migration:

1. Check that MongoDB is running and accessible
2. Verify the MONGODB_URI in your .env file is correct
3. Ensure you have proper permissions to create and modify collections

For any persistent issues, you can revert the changes by:
- Dropping the newly created collections
- Removing the new fields from the User documents

## Next Steps

After running the migration script, you can:

1. Start the backend server:
```bash
npm start
```

2. Use the API endpoints to create and manage diagrams
3. Connect the frontend to view and interact with diagrams