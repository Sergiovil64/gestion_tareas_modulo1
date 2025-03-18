import { Request, Response } from "express";
import Task from "../models/task";
import { validationResult } from "express-validator";
import { Op } from "sequelize";
import { AuthRequest } from "../middleware/auth.middleware";

// GET TASKS
export const getTasks = async (req: AuthRequest, res: Response) => {
    const { status, search, startDate, endDate } = req.query;
    // Construye la condicion
    const where: any = { userId: req.id };

    // Filtro por estado (status)
    if (status) {
        where.status = status;
    }

    // Búsqueda por título o descripción
    if (search) {
        where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }

    // Filtrado por rango de fechas
    if (startDate || endDate) {
        where.createdAt = {};
        
        // createdAt debe ser mayor al startDate
        if (startDate) {
            where.createdAt[Op.gte] = new Date(startDate as string);
        }
        // createdAt debe ser menor al endDate
        if (endDate) {
            where.createdAt[Op.lte] = new Date(endDate as string); // Fecha de fin
        }
      }

    const tareas = await Task.findAll({ where });
    res.json(tareas); 
}; 

// POST TASK
export const createTask = async (req: AuthRequest, res: Response) => { 
    // Validamos los datos recibidos
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }

    // Creando tarea siempre con status PENDIENTE
    const tarea = await Task.create({...req.body, status: 'PENDIENTE', userId: req.id }); 
    res.status(201).json(tarea); 
};

// GET TASK BY ID
export const getTask = async (req: AuthRequest, res: Response) => { 
    const {id} = req.params;
    // Buscando Task por Id
    const task = await Task.findByPk(id);
    task ? res.json(task) : res.status(404).json({ error: "Tarea no encontrada" });
};

// PUT TASK
export const updateTask = async (req: AuthRequest, res: Response) => { 
    const {id} = req.params;
    const {status} = req.body;

    const task = await Task.findByPk(id);
    if (!task) {
        res.status(404).json({ error: "Tarea no encontrada" });
        return;
    }

    // Tarea COMPLETADA no puede ser modificada
    if (task.status === 'COMPLETADA') {
        res.status(400).json({ error: "Tarea completada no puede ser modificada" });
        return;
    }

    // Tarea EN PROGRESO, COMPLETADA no puede volver a PENDIENTE
    if (status && status === 'PENDIENTE' && task.status !== 'PENDIENTE') {
        res.status(400).json({ error: "Tarea no puede volver a PENDIENTE" });
        return;
    }

    // Solo es posible ir a EN PROGRESO desde PENDIENTE
    if (status && status === "EN PROGRESO" && task.status !== "PENDIENTE") {
        res.status(400).json({ error: "Tarea no puede volver ir a EN PROGRESO al no estar PENDIENTE" });
        return;
    }

    // Actualizando tarea
    await task.update(req.body);
    res.json(task);
};

export const deleteTask = async (req: AuthRequest, res: Response) => { 
    const {id} = req.params;

    const task = await Task.findByPk(id);
    if (!task) {
        res.status(404).json({ error: "Tarea no encontrada" });
        return;
    }
    // Eliminando tarea
    await task.destroy();
    res.json("Tarea Eliminada con éxito.");
};