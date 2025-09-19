import mongoose from 'mongoose';

const deploymentSchema = new mongoose.Schema({
  deployment_id: {
    type: String,
    required: [true, 'Deployment ID is required'],
    unique: true,
    trim: true
  },
  diagram_name: {
    type: String,
    required: [true, 'Diagram name is required'],
    trim: true
  },
  terraform_plan: {
    type: Object,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'failed'],
    default: 'pending'
  },
  terraform_plan_ref: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TerraformPlan',
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  completed_at: {
    type: Date
  }
});

const Deployment = mongoose.model('Deployment', deploymentSchema);

export default Deployment;