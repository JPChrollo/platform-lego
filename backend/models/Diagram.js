import mongoose from 'mongoose';

const diagramSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Diagram name is required'],
    trim: true
  },
  base: {
    type: String,
    required: [true, 'Cloud service provider is required'],
    enum: ['AWS', 'GCP', 'Azure'], // Based on the options from the diagram creation page
    trim: true
  },
  cloud_components: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CloudComponent'
  }],
  aws_secret_key_id: {
    type: String,
    trim: true
  },
  aws_secret_access_key: {
    type: String,
    trim: true
  },
  region: {
    type: String,
    trim: true
  },
  estimated_cost: {
    type: Number,
    default: 0
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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
diagramSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

const Diagram = mongoose.model('Diagram', diagramSchema);

export default Diagram;