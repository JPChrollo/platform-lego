import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { 
  getUserDiagrams, 
  getDiagramById,
  createDiagram,
  updateDiagram,
  deleteDiagram,
  addComponentToDiagram,
  removeComponentFromDiagram
} from '../controllers/diagramController.js';

const router = express.Router();

// All routes are protected by the auth middleware
router.use(protect);

// Diagram routes
router.get('/', getUserDiagrams);
router.get('/:id', getDiagramById);
router.post('/', createDiagram);
router.put('/:id', updateDiagram);
router.delete('/:id', deleteDiagram);

// Component routes
router.post('/:id/components', addComponentToDiagram);
router.delete('/:diagramId/components/:componentId', removeComponentFromDiagram);

export default router;