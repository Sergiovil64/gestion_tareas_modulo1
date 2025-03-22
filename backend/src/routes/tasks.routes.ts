import express from "express";
import { createTask, deleteTask, getTask, getTasks, updateTask } from "../controllers/tasks.controller";
import { body } from "express-validator";

const taskRouter = express.Router(); 
// Las cookies no se guardaban en el navegador segun lo esperado, comentando solucion por fines de demostracion.

// taskRouter.get('/', verifyToken, getTasks); 
// taskRouter.post('/', verifyToken, [
//     body("title").notEmpty().withMessage("El titulo es obligatorio."),
//     body("dueDate").isDate().withMessage("Formato de fecha no es válido.")
// ], createTask);
// taskRouter.get('/:id', verifyToken, getTask);
// taskRouter.put('/:id', verifyToken, updateTask);
// taskRouter.delete('/:id', verifyToken, deleteTask);

taskRouter.get('/', getTasks); 
taskRouter.post('/', [
    body("title").notEmpty().withMessage("El titulo es obligatorio."),
    body("dueDate").isDate().withMessage("Formato de fecha no es válido.")
], createTask);
taskRouter.get('/:id', getTask);
taskRouter.put('/:id', updateTask);
taskRouter.delete('/:id', deleteTask);

export default taskRouter; 