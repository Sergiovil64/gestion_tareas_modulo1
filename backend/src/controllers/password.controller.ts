import { Response } from "express";
import bcrypt from "bcryptjs";
import User from "../models/user";
import PasswordHistory from "../models/passwordHistory";
import { AuthRequest, generateToken } from "../middleware/auth.middleware";
import { Op } from "sequelize";

// Configuración de políticas de contraseñas
const PASSWORD_CONFIG = {
  EXPIRATION_DAYS: 90, // Contraseñas expiran en 90 días
  HISTORY_CHECK: 5, // No permitir reutilizar las últimas 5 contraseñas
  MIN_LENGTH: 12,
  MAX_LENGTH: 128
};

// Calcular fecha de expiración
const calculatePasswordExpiration = (): Date => {
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + PASSWORD_CONFIG.EXPIRATION_DAYS);
  return expirationDate;
};

// Verificar si la contraseña ha sido usada recientemente
const checkPasswordHistory = async (userId: number, newPassword: string): Promise<boolean> => {
  try {
    // Obtener las últimas N contraseñas del historial
    const passwordHistories = await PasswordHistory.findAll({
      where: { userId },
      order: [['changedAt', 'DESC']],
      limit: PASSWORD_CONFIG.HISTORY_CHECK
    });

    // Verificar si la nueva contraseña coincide con alguna del historial
    for (const history of passwordHistories) {
      const isMatch = await bcrypt.compare(newPassword, history.passwordHash);
      if (isMatch) {
        return true; // Contraseña ya fue usada
      }
    }

    return false; // Contraseña no está en el historial
  } catch (error) {
    console.error("Error al verificar historial de contraseñas:", error);
    return false;
  }
};

// Guardar contraseña en el historial
const savePasswordHistory = async (userId: number, passwordHash: string): Promise<void> => {
  try {
    await PasswordHistory.create({
      userId,
      passwordHash,
      changedAt: new Date()
    });

    // Limpiar historial antiguo (mantener solo las últimas 10)
    const allPasswords = await PasswordHistory.findAll({
      where: { userId },
      order: [['changedAt', 'DESC']]
    });

    if (allPasswords.length > 10) {
      const toDelete = allPasswords.slice(10);
      await PasswordHistory.destroy({
        where: {
          id: toDelete.map(p => p.id)
        }
      });
    }
  } catch (error) {
    console.error("Error al guardar contraseña en historial:", error);
  }
};

// Cambiar contraseña
export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validaciones básicas
    if (!currentPassword || !newPassword || !confirmPassword) {
      res.status(400).json({ 
        error: "Datos incompletos",
        message: "Debe proporcionar la contraseña actual y la nueva contraseña" 
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      res.status(400).json({ 
        error: "Las contraseñas no coinciden",
        message: "La nueva contraseña y la confirmación deben ser iguales" 
      });
      return;
    }

    // Validar longitud
    if (newPassword.length < PASSWORD_CONFIG.MIN_LENGTH || newPassword.length > PASSWORD_CONFIG.MAX_LENGTH) {
      res.status(400).json({ 
        error: "Contraseña inválida",
        message: `La contraseña debe tener entre ${PASSWORD_CONFIG.MIN_LENGTH} y ${PASSWORD_CONFIG.MAX_LENGTH} caracteres` 
      });
      return;
    }

    // Validar complejidad
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/;
    if (!passwordRegex.test(newPassword)) {
      res.status(400).json({ 
        error: "Contraseña inválida",
        message: "La contraseña debe contener al menos una mayúscula, una minúscula, un número y un carácter especial (@$!%*?&)" 
      });
      return;
    }

    const user = await User.findByPk(req.userId);
    
    if (!user) {
      res.status(404).json({ 
        error: "Usuario no encontrado" 
      });
      return;
    }

    // Verificar contraseña actual
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    
    if (!isPasswordValid) {
      res.status(401).json({ 
        error: "Contraseña incorrecta",
        message: "La contraseña actual no es correcta" 
      });
      return;
    }

    // Verificar que no sea la misma contraseña
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      res.status(400).json({ 
        error: "Contraseña inválida",
        message: "La nueva contraseña debe ser diferente a la actual" 
      });
      return;
    }

    // Verificar historial de contraseñas
    const isPasswordReused = await checkPasswordHistory(user.id, newPassword);
    if (isPasswordReused) {
      res.status(400).json({ 
        error: "Contraseña no permitida",
        message: `No puede reutilizar ninguna de sus últimas ${PASSWORD_CONFIG.HISTORY_CHECK} contraseñas` 
      });
      return;
    }

    // Guardar contraseña actual en el historial
    await savePasswordHistory(user.id, user.password);

    // Hashear nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Actualizar contraseña y fecha de expiración
    await user.update({
      password: hashedPassword,
      passwordChangedAt: new Date(),
      passwordExpiresAt: calculatePasswordExpiration(),
      mustChangePassword: false,
      lastPasswordChangeRequired: null
    });

    // Generar nuevo token
    const token = generateToken({ id: user.id, role: user.role });

    res.json({
      message: "Contraseña actualizada exitosamente",
      passwordExpiresAt: user.passwordExpiresAt,
      token
    });
  } catch (error: any) {
    console.error("Error al cambiar contraseña:", error);
    res.status(500).json({ 
      error: "Error al cambiar contraseña",
      message: "Ha ocurrido un error interno. Por favor, intente más tarde."
    });
  }
};

// Forzar cambio de contraseña (Admin)
export const forcePasswordChange = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    if (!userId || isNaN(parseInt(userId))) {
      res.status(400).json({ 
        error: "ID de usuario inválido" 
      });
      return;
    }

    const user = await User.findByPk(parseInt(userId));
    
    if (!user) {
      res.status(404).json({ 
        error: "Usuario no encontrado" 
      });
      return;
    }

    await user.update({
      mustChangePassword: true,
      lastPasswordChangeRequired: new Date()
    });

    res.json({
      message: "Se ha solicitado cambio de contraseña al usuario",
      user: {
        id: user.id,
        email: user.email,
        mustChangePassword: true
      }
    });
  } catch (error: any) {
    console.error("Error al forzar cambio de contraseña:", error);
    res.status(500).json({ 
      error: "Error al forzar cambio de contraseña",
      message: "Ha ocurrido un error interno. Por favor, intente más tarde."
    });
  }
};

// Obtener estado de la contraseña
export const getPasswordStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findByPk(req.userId);
    
    if (!user) {
      res.status(404).json({ 
        error: "Usuario no encontrado" 
      });
      return;
    }

    const now = new Date();
    const daysUntilExpiration = user.passwordExpiresAt 
      ? Math.ceil((user.passwordExpiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    const isExpired = user.passwordExpiresAt ? user.passwordExpiresAt < now : false;

    res.json({
      passwordChangedAt: user.passwordChangedAt,
      passwordExpiresAt: user.passwordExpiresAt,
      daysUntilExpiration,
      isExpired,
      mustChangePassword: user.mustChangePassword,
      expirationPolicy: `${PASSWORD_CONFIG.EXPIRATION_DAYS} días`
    });
  } catch (error: any) {
    console.error("Error al obtener estado de contraseña:", error);
    res.status(500).json({ 
      error: "Error al obtener estado de contraseña",
      message: "Ha ocurrido un error interno. Por favor, intente más tarde."
    });
  }
};

// Verificar si la contraseña ha expirado (middleware)
export const checkPasswordExpiration = async (userId: number): Promise<{ expired: boolean; mustChange: boolean }> => {
  try {
    const user = await User.findByPk(userId);
    
    if (!user) {
      return { expired: false, mustChange: false };
    }

    const now = new Date();
    const expired = user.passwordExpiresAt ? user.passwordExpiresAt < now : false;

    return { 
      expired, 
      mustChange: user.mustChangePassword || expired 
    };
  } catch (error) {
    console.error("Error al verificar expiración de contraseña:", error);
    return { expired: false, mustChange: false };
  }
};

// Middleware para requerir cambio de contraseña
export const requirePasswordChange = async (
  req: AuthRequest, 
  res: Response, 
  next: Function
): Promise<void> => {
  try {
    if (!req.userId) {
      next();
      return;
    }

    const passwordStatus = await checkPasswordExpiration(req.userId);

    if (passwordStatus.mustChange) {
      res.status(403).json({
        error: "Cambio de contraseña requerido",
        message: passwordStatus.expired 
          ? "Su contraseña ha expirado. Debe cambiarla para continuar."
          : "Se requiere que cambie su contraseña antes de continuar.",
        mustChangePassword: true,
        changePasswordUrl: "/api/auth/change-password"
      });
      return;
    }

    next();
  } catch (error) {
    console.error("Error al verificar requerimiento de cambio de contraseña:", error);
    next();
  }
};

