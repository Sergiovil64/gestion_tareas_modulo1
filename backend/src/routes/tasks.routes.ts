import express from "express";
import { createTask, getTasks } from "../controllers/tasks.controller";

const taskRouter = express.Router(); 

taskRouter.get('/', getTasks); 
taskRouter.post('/', createTask);

export default taskRouter; 