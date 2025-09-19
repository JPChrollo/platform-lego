import mongoose from 'mongoose';

const componentConfigurationSchema = new mongoose.Schema({
  component_name: {
    type: String,
    required: [true, 'Component name is required'],
    trim: true
  },
  terraform_resources: [{
    type: Object, // Store as flexible objects to accommodate different resource types
    required: true
  }],
  estimated_cost: {
    type: Number,
    default: 0
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Pre-save hook to update the 'updated_at' field
componentConfigurationSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

const ComponentConfiguration = mongoose.model('ComponentConfiguration', componentConfigurationSchema);

export default ComponentConfiguration;