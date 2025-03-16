import express from "express";
import { createTask, deleteTask, getTask, getTasks, updateTask } from "../controllers/tasks.controller";
import { verifyToken } from "../middleware/auth.middleware";
import { body } from "express-validator";

const taskRouter = express.Router(); 

taskRouter.get('/', verifyToken, getTasks); 
taskRouter.post('/', verifyToken, [
    body("title").notEmpty().withMessage("El titulo es obligatorio."),
    body("dueDate").isDate().withMessage("Formato de fecha no es válido.")
], createTask);
taskRouter.get('/:id', verifyToken, getTask);
taskRouter.put('/:id', verifyToken, updateTask);
taskRouter.delete('/:id', verifyToken, deleteTask);

export default taskRouter; 