import mongoose from 'mongoose';

const planErrorSchema = new mongoose.Schema({
  error_id: {
    type: String,
    required: [true, 'Error ID is required'],
    trim: true
  },
  plan_id: {
    type: String,
    required: [true, 'Plan ID is required'],
    trim: true
  },
  cloud_component: {
    type: Object,
    required: true
  },
  error_description: {
    type: String,
    required: true
  },
  terraform_plan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TerraformPlan',
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

const PlanError = mongoose.model('PlanError', planErrorSchema);

export default PlanError;