import { Response } from "express";
import Task, { TaskStatus } from "../models/task";
import { Op } from "sequelize";
import { AuthRequest } from "../middleware/auth.middleware";
import { handleValidationErrors } from "../validators/validators";

// Get All Tasks (with filters)
export const getTasks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, search, startDate, endDate, priority } = req.query;
    
    // Base condition - user can only see their own tasks
    const where: any = { userId: req.userId };

    // Filter by status
    if (status && Object.values(TaskStatus).includes(status as TaskStatus)) {
      where.status = status;
    }

    // Search by title or description
    if (search && typeof search === 'string') {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Filter by date range
    if (startDate || endDate) {
      where.dueDate = {};
      if (startDate) {
        where.dueDate[Op.gte] = new Date(startDate as string);
      }
      if (endDate) {
        where.dueDate[Op.lte] = new Date(endDate as string);
      }
    }

    // Filter by priority
    if (priority) {
      const priorityNum = parseInt(priority as string);
      if (!isNaN(priorityNum) && priorityNum >= 1 && priorityNum <= 5) {
        where.priority = priorityNum;
      }
    }

    const tasks = await Task.findAll({ 
      where,
      order: [
        ['priority', 'DESC'],
        ['dueDate', 'ASC']
      ]
    });

    res.json({
      count: tasks.length,
      tasks
    });
  } catch (error: any) {
    console.error("Error al obtener tareas:", error);
    res.status(500).json({ 
      error: "Error al obtener tareas",
      message: "Ha ocurrido un error interno. Por favor, intente más tarde."
    });
  }
};

// Get Single Task
export const getTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!id) {
      res.status(400).json({ 
        error: "ID inválido",
        message: "El ID de la tarea es requerido" 
      });
      return;
    }

    const task = await Task.findOne({
      where: { 
        id: id,
        userId: req.userId
      }
    });

    if (!task) {
      res.status(404).json({ 
        error: "Tarea no encontrada",
        message: "La tarea no existe o no tiene permisos para acceder a ella" 
      });
      return;
    }

    res.json({ task });
  } catch (error: any) {
    console.error("Error al obtener tarea:", error);
    res.status(500).json({ 
      error: "Error al obtener tarea",
      message: "Ha ocurrido un error interno. Por favor, intente más tarde."
    });
  }
};

// Create Task
export const createTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (handleValidationErrors(req, res)) return;

    const { title, description, dueDate, priority, color, imageUrl } = req.body;

    // Create task
    const task = await Task.create({
      title,
      description: description || '',
      status: TaskStatus.PENDIENTE,
      dueDate,
      userId: req.userId,
      priority: priority || 1,
      color: color || '#FFFFFF',
      imageUrl: imageUrl || null
    });

    res.status(201).json({
      message: "Tarea creada exitosamente",
      task
    });
  } catch (error: any) {
    console.error("Error al crear tarea:", error);
    res.status(500).json({ 
      error: "Error al crear tarea",
      message: "Ha ocurrido un error interno. Por favor, intente más tarde."
    });
  }
};

// Update Task
export const updateTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (handleValidationErrors(req, res)) return;

    const { id } = req.params;
    const { status, title, description, dueDate, priority, color, imageUrl } = req.body;

    // Validate ID
    if (!id) {
      res.status(400).json({ 
        error: "ID inválido",
        message: "El ID de la tarea es requerido" 
      });
      return;
    }

    const task = await Task.findOne({
      where: { 
        id: id,
        userId: req.userId // Ensure user can only update their own tasks
      }
    });

    if (!task) {
      res.status(404).json({ 
        error: "Tarea no encontrada",
        message: "La tarea no existe o no tiene permisos para modificarla" 
      });
      return;
    }

    // Business rule: Completed tasks cannot be modified
    if (task.status === TaskStatus.COMPLETADA) {
      res.status(400).json({ 
        error: "Tarea completada",
        message: "Las tareas completadas no pueden ser modificadas" 
      });
      return;
    }

    // Business rule: Cannot go back to PENDIENTE
    if (status === TaskStatus.PENDIENTE && task.status !== TaskStatus.PENDIENTE) {
      res.status(400).json({ 
        error: "Transición de estado inválida",
        message: "No se puede regresar una tarea al estado PENDIENTE" 
      });
      return;
    }

    // Business rule: Can only go to EN PROGRESO from PENDIENTE
    if (status === TaskStatus.EN_PROGRESO && task.status !== TaskStatus.PENDIENTE) {
      res.status(400).json({ 
        error: "Transición de estado inválida",
        message: "Solo se puede cambiar a EN PROGRESO desde PENDIENTE" 
      });
      return;
    }

    // Update task
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (dueDate !== undefined) updateData.dueDate = dueDate;
    if (priority !== undefined) updateData.priority = priority;
    if (color !== undefined) updateData.color = color;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;

    await task.update(updateData);

    res.json({
      message: "Tarea actualizada exitosamente",
      task
    });
  } catch (error: any) {
    console.error("Error al actualizar tarea:", error);
    res.status(500).json({ 
      error: "Error al actualizar tarea",
      message: "Ha ocurrido un error interno. Por favor, intente más tarde."
    });
  }
};

// Delete Task
export const deleteTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!id) {
      res.status(400).json({ 
        error: "ID inválido",
        message: "El ID de la tarea es requerido" 
      });
      return;
    }

    const task = await Task.findOne({
      where: { 
        id: id,
        userId: req.userId // Ensure user can only delete their own tasks
      }
    });

    if (!task) {
      res.status(404).json({ 
        error: "Tarea no encontrada",
        message: "La tarea no existe o no tiene permisos para eliminarla" 
      });
      return;
    }

    await task.destroy();

    res.json({
      message: "Tarea eliminada exitosamente"
    });
  } catch (error: any) {
    console.error("Error al eliminar tarea:", error);
    res.status(500).json({ 
      error: "Error al eliminar tarea",
      message: "Ha ocurrido un error interno. Por favor, intente más tarde."
    });
  }
};