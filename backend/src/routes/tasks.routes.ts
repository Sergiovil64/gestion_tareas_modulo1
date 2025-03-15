import express from "express";
import { createTask, getTasks } from "../controllers/tasks.controller";

const taskRouter = express.Router(); 

taskRouter.get('/tasks', getTasks); 
taskRouter.post('/tasks', createTask);

export default taskRouter; 