import mongoose from 'mongoose';

const cloudComponentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Component name is required'],
    trim: true,
    maxlength: [255, 'Name cannot exceed 255 characters']
  },
  component_type: {
    type: String,
    required: [true, 'Component type is required'],
    trim: true
  },
  diagram_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Diagram',
    required: true
  },
  position_x: {
    type: Number,
    required: [true, 'X position is required']
  },
  position_y: {
    type: Number,
    required: [true, 'Y position is required']
  },
  configuration: {
    type: Object,
    default: {}
  },
  // These can be kept for backward compatibility
  code: {
    type: String
  },
  icon: {
    type: String // Path or URL to the component's image or emoji
  },
  component_configuration: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ComponentConfiguration'
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
cloudComponentSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

const CloudComponent = mongoose.model('CloudComponent', cloudComponentSchema);

export default CloudComponent;