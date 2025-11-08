import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import User, { UserRole } from "../models/user";

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: UserRole;
}

// Generación de token JWT
export const generateToken = (userData: { id: string, role: UserRole }): string => {
  const secretKey: string = process.env.SECRET_KEY || "secret_key";
  const expiresIn: number = parseInt(process.env.EXPIRES_IN || "3600", 10);
  return jwt.sign(userData, secretKey, { expiresIn });
};

// Verificación de token JWT
export const verifyToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.header("Authorization");
    // Control de entrada: Validación de entradas en DB
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      // Control de salida: Manejo de errores
      res.status(401).json({ 
        error: "Acceso denegado", 
        message: "Token no proporcionado o formato inválido" 
      });
      return;
    }

    const token = authHeader.split(" ")[1];
    
    if (!token) {
      // Control de salida: Manejo de errores
      res.status(401).json({ 
        error: "Acceso denegado", 
        message: "Token no encontrado" 
      });
      return;
    }

    const decoded = jwt.verify(
      token, 
      // Control de entrada: Validación de entradas en DB
      process.env.SECRET_KEY as string || 'secret_key'
    ) as { id: string, role: UserRole };
    
    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    // Control de salida: Manejo de errores
    res.status(401).json({ 
      error: "Token inválido", 
      message: "El token proporcionado es inválido o ha expirado" 
    });
  }
};

// Control de acceso: Autorización basada en roles
export const requireRole = (...allowedRoles: UserRole[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.userId || !req.userRole) {
        // Control de salida: Manejo de errores
        res.status(401).json({ 
          error: "No autenticado", 
          message: "Debe iniciar sesión para acceder a este recurso" 
        });
        return;
      }

      // Verificar si el usuario está activo
      const user = await User.findByPk(req.userId);
      if (!user || !user.isActive) {
        res.status(403).json({ 
          error: "Cuenta desactivada", 
          message: "Su cuenta ha sido desactivada. Contacte al administrador." 
        });
        return;
      }

      if (!allowedRoles.includes(req.userRole)) {
        // Control de salida: Manejo de errores
        res.status(403).json({ 
          error: "Acceso denegado", 
          message: "No tiene permisos suficientes para realizar esta acción",
          requiredRole: allowedRoles,
          currentRole: req.userRole
        });
        return;
      }

      next();
    } catch (error) {
      // Control de salida: Manejo de errores
      res.status(500).json({ 
        error: "Error de autorización", 
        message: "Error al verificar permisos" 
      });
    }
  };
};

// Control de acceso: Características Premium 
export const requirePremiumFeature = async (
  req: AuthRequest, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.userRole) {
      // Control de salida: Manejo de errores
      res.status(401).json({ 
        error: "No autenticado" 
      });
      return;
    }

    // Administradores y usuarios Premium pueden acceder a características premium
    if (req.userRole === UserRole.ADMIN || req.userRole === UserRole.PREMIUM) {
      next();
      return;
    }

    // Verificar si el usuario está intentando usar características premium
    const { color, imageUrl } = req.body;
    
    if (color && color !== '#FFFFFF') {
      // Control de salida: Manejo de errores
      res.status(403).json({ 
        error: "Función Premium", 
        message: "La personalización de colores está disponible solo para usuarios Premium",
        upgradeUrl: "/api/auth/upgrade-to-premium"
      });
      return;
    }

    if (imageUrl) {
      // Control de salida: Manejo de errores
      res.status(403).json({ 
        error: "Función Premium", 
        message: "Agregar imágenes está disponible solo para usuarios Premium",
        upgradeUrl: "/api/auth/upgrade-to-premium"
      });
      return;
    }

    next();
  } catch (error) {
    // Control de salida: Manejo de errores
    res.status(500).json({ 
      error: "Error al verificar características premium" 
    });
  }
};

// RATE LIMITING

// Limiter general de API
// Utilizando libreria para limitar el numero de solicitudes por IP
// Limitador para todas las rutas (default)
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 2000,
  message: {
    error: "Demasiadas solicitudes",
    message: "Ha excedido el límite de solicitudes. Por favor, intente más tarde.",
    retryAfter: "15 minutos"
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

// Limiter de inicio de sesión
// Utilizando libreria para limitar el numero de solicitudes de inicio de sesión por IP
// Limitador para la ruta /api/auth/login
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limitar cada IP a 10 intentos fallidos de inicio de sesión por windowMs (aumentado para testing)
  message: {
    error: "Demasiados intentos de inicio de sesión",
    message: "Ha excedido el límite de intentos de inicio de sesión. Por favor, intente más tarde.",
    retryAfter: "15 minutos"
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins
});

// Limiter de registro
// Utilizando libreria para limitar el numero de solicitudes de registro por IP
// Limitador para la ruta /api/auth/register
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10, // Limitar cada IP a 10 solicitudes de registro por hora (aumentado para testing)
  message: {
    error: "Demasiadas solicitudes de registro",
    message: "Ha excedido el límite de registros. Por favor, intente más tarde.",
    retryAfter: "1 hora"
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Limiter de creación de tareas
// Utilizando libreria para limitar el numero de solicitudes de creación de tareas por IP
// Limitador para la ruta /api/tasks
export const taskCreationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 30, // Limitar cada IP a 30 solicitudes de creación de tareas por minuto (aumentado para testing y uso normal)
  message: {
    error: "Demasiadas solicitudes de creación de tareas",
    message: "Ha excedido el límite de solicitudes de creación de tareas. Por favor, intente más tarde.",
    retryAfter: "1 minuto"
  },
  standardHeaders: true,
  legacyHeaders: false,
});