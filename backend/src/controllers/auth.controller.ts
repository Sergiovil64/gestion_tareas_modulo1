import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import User, { UserRole } from "../models/user";
import { AuthRequest, generateToken } from "../middleware/auth.middleware";
import { handleValidationErrors } from "../validators/validators";

// Sanitización de salida para las rutas API de registro
const sanitizeUserOutput = (user: User) => {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive
  };
};

// Registro de usuario
export const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    if (handleValidationErrors(req, res)) return;

    const { name, email, password } = req.body;

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      // Control de salida: Manejo de errores
      res.status(400).json({ 
        error: "Usuario ya existe", 
        message: "El email proporcionado ya está registrado" 
      });
      return;
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(password, 12);

    // Crear nuevo usuario con rol FREE por defecto
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: UserRole.FREE,
      isActive: true,
      loginAttempts: 0
    });

    // Generar token
    const token = generateToken({ id: newUser.id, role: newUser.role });

    // Control de salida: Manejo de errores
    res.status(201).json({
      message: "Usuario registrado exitosamente",
      user: sanitizeUserOutput(newUser),
      token
    });
  } catch (error: any) {
    // Control de salida: Manejo de errores
    console.error("Error en registro:", error);
    res.status(500).json({ 
      error: "Error al registrar usuario",
      message: "Ha ocurrido un error interno. Por favor, intente más tarde."
    });
  }
};

// Inicio de sesión
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    if (handleValidationErrors(req, res)) return;

    const { email, password } = req.body;

    // Buscar usuario
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      // Control de salida: Manejo de errores
      res.status(401).json({ 
        error: "Credenciales inválidas",
        message: "Email o contraseña incorrectos" 
      });
      return;
    }

    // Verificar si la cuenta está activa
    if (!user.isActive) {
      // Control de salida: Manejo de errores
      res.status(403).json({ 
        error: "Cuenta desactivada",
        message: "Su cuenta ha sido desactivada. Contacte al administrador." 
      });
      return;
    }

    // Control de rate limit en inicio de sesión
    // Verificar si la cuenta está bloqueada (después de 5 intentos fallidos)
    if (user.loginAttempts >= 5) {
      const lockoutTime = 15 * 60 * 1000; // 15 minutes
      const timeSinceLastAttempt = user.lastLoginAttempt 
        ? Date.now() - new Date(user.lastLoginAttempt).getTime()
        : lockoutTime;

      if (timeSinceLastAttempt < lockoutTime) {
        res.status(429).json({ 
          error: "Cuenta bloqueada temporalmente",
          message: "Demasiados intentos fallidos. Intente nuevamente en 15 minutos.",
          retryAfter: Math.ceil((lockoutTime - timeSinceLastAttempt) / 60000) + " minutos"
        });
        return;
      } else {
        // Reset login attempts after lockout period
        await user.update({ loginAttempts: 0, lastLoginAttempt: null });
      }
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      // Control de rate limit
      // Incrementar intentos de inicio de sesión
      await user.update({
        loginAttempts: user.loginAttempts + 1,
        lastLoginAttempt: new Date()
      });

      // Control de salida: Manejo de errores
      res.status(401).json({ 
        error: "Credenciales inválidas",
        message: "Email o contraseña incorrectos",
        remainingAttempts: Math.max(0, 5 - (user.loginAttempts + 1))
      });
      return;
    }

    // Inicio de sesión exitoso - reiniciar intentos
    await user.update({ loginAttempts: 0, lastLoginAttempt: null });

    // Generar token
    const token = generateToken({ id: user.id, role: user.role });

    res.json({
      message: "Inicio de sesión exitoso",
      user: sanitizeUserOutput(user),
      token
    });
  } catch (error: any) {
    // Control de salida: Manejo de errores
    console.error("Error en inicio de sesión:", error);
    res.status(500).json({ 
      error: "Error al iniciar sesión",
      message: "Ha ocurrido un error interno. Por favor, intente más tarde."
    });
  }
};

// Obtener usuario autenticado
export const me = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findByPk(req.userId);
    
    if (!user) {
      // Control de salida: Manejo de errores
      res.status(404).json({ 
        error: "Usuario no encontrado",
        message: "El usuario no existe o ha sido eliminado" 
      });
      return;
    }

    // Control de salida: Manejo de errores
    res.json({
      user: sanitizeUserOutput(user)
    });
  } catch (error: any) {
    // Control de salida: Manejo de errores
    console.error("Error al obtener usuario:", error);
    res.status(500).json({ 
      error: "Error al obtener información del usuario",
      message: "Ha ocurrido un error interno. Por favor, intente más tarde."
    });
  }
};

// Upgrade to Premium (Demo)
export const upgradeToPremium = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findByPk(req.userId);
    
    if (!user) {
      res.status(404).json({ 
        error: "Usuario no encontrado" 
      });
      return;
    }

    // Control basado en roles: Solo usuarios Premium y Admin pueden actualizar a Premium
    if (user.role === UserRole.PREMIUM || user.role === UserRole.ADMIN) {
      res.status(400).json({ 
        error: "Ya tiene acceso Premium",
        message: "Su cuenta ya tiene acceso a características Premium" 
      });
      return;
    }

    // Actualizar usuario a Premium
    await user.update({ role: UserRole.PREMIUM });

    // Generar nuevo token con rol actualizado
    const token = generateToken({ id: user.id, role: UserRole.PREMIUM });

    res.json({
      message: "Cuenta actualizada a Premium exitosamente",
      user: sanitizeUserOutput(user),
      token
    });
  } catch (error: any) {
    console.error("Error al actualizar a Premium:", error);
    res.status(500).json({ 
      error: "Error al actualizar cuenta",
      message: "Ha ocurrido un error interno. Por favor, intente más tarde."
    });
  }
};