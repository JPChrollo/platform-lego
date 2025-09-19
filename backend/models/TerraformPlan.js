import mongoose from 'mongoose';

const terraformPlanSchema = new mongoose.Schema({
  plan_id: {
    type: String,
    required: [true, 'Plan ID is required'],
    unique: true,
    trim: true
  },
  diagram_name: {
    type: String,
    required: [true, 'Diagram name is required'],
    trim: true
  },
  cloud_components: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CloudComponent'
  }],
  success: {
    type: Boolean,
    default: false
  },
  plan_errors: [{
    type: Object // Store error objects with details
  }],
  plan_data: [{
    type: Object // Store plan data as flexible objects
  }],
  diagram: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Diagram',
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

const TerraformPlan = mongoose.model('TerraformPlan', terraformPlanSchema);

export default TerraformPlan;