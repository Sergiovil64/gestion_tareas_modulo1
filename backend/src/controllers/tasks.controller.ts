import { Request, Response } from "express";
import Task from "../models/task";

export const getTasks = async (req: Request, res: Response) => {
    const tareas = await Task.findAll(); 
    res.json(tareas); 
}; 

export const createTask = async (req: Request, res: Response) => { 
    const tarea = await Task.create(req.body); 
    res.status(201).json(tarea); 
};