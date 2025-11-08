import { Response } from "express";
import User, { UserRole } from "../models/user";
import Task, { TaskStatus } from "../models/task";
import { AuthRequest } from "../middleware/auth.middleware";

// Sanitización de salida
const sanitizeUserOutput = (user: User) => {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive
  };
};

// Get All Users (Admin only)
export const getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'role', 'isActive', 'createdAt']
    });

    res.json({
      count: users.length,
      users
    });
  } catch (error: any) {
    console.error("Error al obtener usuarios:", error);
    res.status(500).json({ 
      error: "Error al obtener usuarios",
      message: "Ha ocurrido un error interno. Por favor, intente más tarde."
    });
  }
};

// Update User Role (Admin only)
export const updateUserRole = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!userId) {
      res.status(400).json({ 
        error: "ID de usuario inválido" 
      });
      return;
    }

    if (!role || !Object.values(UserRole).includes(role)) {
      res.status(400).json({ 
        error: "Rol inválido",
        message: "El rol debe ser: ADMIN, PREMIUM o FREE" 
      });
      return;
    }

    const user = await User.findByPk(userId);
    
    if (!user) {
      res.status(404).json({ 
        error: "Usuario no encontrado" 
      });
      return;
    }

    // Prevent admin from demoting themselves
    if (user.id === req.userId && role !== UserRole.ADMIN) {
      res.status(400).json({ 
        error: "Acción no permitida",
        message: "No puede cambiar su propio rol de administrador" 
      });
      return;
    }

    await user.update({ role });

    res.json({
      message: "Rol actualizado exitosamente",
      user: sanitizeUserOutput(user)
    });
  } catch (error: any) {
    console.error("Error al actualizar rol:", error);
    res.status(500).json({ 
      error: "Error al actualizar rol",
      message: "Ha ocurrido un error interno. Por favor, intente más tarde."
    });
  }
};

export const toggleUserStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    if (!userId) {
      res.status(400).json({ 
        error: "ID de usuario inválido" 
      });
      return;
    }

    const user = await User.findByPk(userId);
    
    if (!user) {
      res.status(404).json({ 
        error: "Usuario no encontrado" 
      });
      return;
    }

    // Previene que el admin se desactive a sí mismo
    if (user.id === req.userId) {
      res.status(400).json({ 
        error: "Acción no permitida",
        message: "No puede desactivar su propia cuenta" 
      });
      return;
    }

    await user.update({ isActive: !user.isActive });

    res.json({
      message: user.isActive ? "Usuario activado exitosamente" : "Usuario desactivado exitosamente",
      user: sanitizeUserOutput(user)
    });
  } catch (error: any) {
    console.error("Error al cambiar estado del usuario:", error);
    res.status(500).json({ 
      error: "Error al cambiar estado",
      message: "Ha ocurrido un error interno. Por favor, intente más tarde."
    });
  }
};

// Get System Statistics (Admin only)
export const getSystemStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const totalUsers = await User.count();
    const activeUsers = await User.count({ where: { isActive: true } });
    const adminUsers = await User.count({ where: { role: UserRole.ADMIN } });
    const premiumUsers = await User.count({ where: { role: UserRole.PREMIUM } });
    const freeUsers = await User.count({ where: { role: UserRole.FREE } });
    
    const totalTasks = await Task.count();
    const pendingTasks = await Task.count({ where: { status: TaskStatus.PENDIENTE } });
    const inProgressTasks = await Task.count({ where: { status: TaskStatus.EN_PROGRESO } });
    const completedTasks = await Task.count({ where: { status: TaskStatus.COMPLETADA } });

    res.json({
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: totalUsers - activeUsers,
        byRole: {
          admin: adminUsers,
          premium: premiumUsers,
          free: freeUsers
        }
      },
      tasks: {
        total: totalTasks,
        byStatus: {
          pending: pendingTasks,
          inProgress: inProgressTasks,
          completed: completedTasks
        }
      }
    });
  } catch (error: any) {
    console.error("Error al obtener estadísticas:", error);
    res.status(500).json({ 
      error: "Error al obtener estadísticas",
      message: "Ha ocurrido un error interno. Por favor, intente más tarde."
    });
  }
};

