import mongoose from 'mongoose';

const planDataSchema = new mongoose.Schema({
  plan_id: {
    type: String,
    required: [true, 'Plan ID is required'],
    trim: true
  },
  cloud_component: {
    type: Object,
    required: true
  },
  change_type: {
    type: String,
    enum: ['create', 'update', 'delete', 'no-op'],
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

const PlanData = mongoose.model('PlanData', planDataSchema);

export default PlanData;