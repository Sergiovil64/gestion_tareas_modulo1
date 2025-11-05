import express from "express";
import { createTask, deleteTask, getTask, getTasks, updateTask } from "../controllers/tasks.controller";
import { verifyToken, taskCreationLimiter, requirePremiumFeature } from "../middleware/auth.middleware";
import { taskValidationRules, taskUpdateValidationRules } from "../validators/validators";

const taskRouter = express.Router(); 

// Task Routes
taskRouter.get('/', verifyToken, getTasks);
taskRouter.get('/:id', verifyToken, getTask);
taskRouter.post(
  '/', 
  verifyToken, 
  taskCreationLimiter,
  requirePremiumFeature,
  taskValidationRules, 
  createTask
);
taskRouter.put(
  '/:id', 
  verifyToken,
  requirePremiumFeature,
  taskUpdateValidationRules, 
  updateTask
);
taskRouter.delete('/:id', verifyToken, deleteTask);

export default taskRouter;