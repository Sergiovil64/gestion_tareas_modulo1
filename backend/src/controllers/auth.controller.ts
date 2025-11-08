import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import User, { UserRole } from "../models/user";
import { AuthRequest, generateToken } from "../middleware/auth.middleware";
import { handleValidationErrors } from "../validators/validators";
import { verifyMFALogin } from "./mfa.controller";
import { checkPasswordExpiration } from "./password.controller";
import PasswordHistory from "../models/passwordHistory";

const generateBackupCodes = (): string[] => {
  const codes: string[] = [];
  for (let i = 0; i < 10; i++) {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    codes.push(code);
  }
  return codes;
};

// Hashear códigos de respaldo para almacenamiento seguro
const hashBackupCodes = async (codes: string[]): Promise<string[]> => {
  const hashedCodes = await Promise.all(
    codes.map(code => bcrypt.hash(code, 10))
  );
  return hashedCodes;
};

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

    // Hashear contraseña con bcrypt (factor de trabajo: 12 = 2^12 iteraciones)
    const hashedPassword = await bcrypt.hash(password, 12);

    // Calcular fecha de expiración de contraseña (90 días)
    const passwordExpiresAt = new Date();
    passwordExpiresAt.setDate(passwordExpiresAt.getDate() + 90);

    // Generar secreto para MFA (obligatorio)
    const mfaSecret = speakeasy.generateSecret({
      name: `Gestión de Tareas (${email})`,
      issuer: 'Gestión de Tareas',
      length: 32
    });

    // Generar códigos de respaldo
    const backupCodes = generateBackupCodes();
    const hashedBackupCodes = await hashBackupCodes(backupCodes);

    // Crear nuevo usuario con rol FREE por defecto y MFA preconfigurado
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: UserRole.FREE,
      isActive: true,
      loginAttempts: 0,
      passwordChangedAt: new Date(),
      passwordExpiresAt: passwordExpiresAt,
      mustChangePassword: false,
      mfaEnabled: false, // Se activará al verificar el código
      mfaSecret: mfaSecret.base32,
      mfaBackupCodes: JSON.stringify(hashedBackupCodes)
    });

    // Guardar contraseña en historial
    await PasswordHistory.create({
      userId: newUser.id,
      passwordHash: hashedPassword,
      changedAt: new Date()
    });

    // Generar código QR
    const qrCodeUrl = await QRCode.toDataURL(mfaSecret.otpauth_url!);

    // Control de salida: Manejo de errores
    res.status(201).json({
      message: "Usuario registrado exitosamente. MFA es obligatorio - Configure su autenticación de dos factores",
      user: sanitizeUserOutput(newUser),
      mfaRequired: true,
      mfaSetup: {
        secret: mfaSecret.base32,
        qrCode: qrCodeUrl,
        backupCodes: backupCodes, // Mostrar solo una vez
        instructions: {
          step1: "Descargue una aplicación de autenticación (Google Authenticator, Authy, Microsoft Authenticator, etc.)",
          step2: "Escanee el código QR con la aplicación o ingrese el código secreto manualmente",
          step3: "Guarde los códigos de respaldo en un lugar seguro (se muestran solo una vez)",
          step4: "Verifique el código generado en el endpoint POST /api/auth/verify-mfa-setup con el token de 6 dígitos",
          step5: "Una vez verificado, podrá iniciar sesión normalmente usando su email, contraseña y código MFA"
        }
      },
      note: "Debe completar la configuración de MFA antes de poder iniciar sesión"
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

// Verificar MFA durante la configuración inicial (después del registro)
export const verifyMFASetup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, token } = req.body;

    if (!email || !token) {
      res.status(400).json({ 
        error: "Email y token requeridos",
        message: "Debe proporcionar su email y el código de 6 dígitos de su aplicación de autenticación" 
      });
      return;
    }

    const user = await User.findOne({ where: { email } });
    
    if (!user || !user.mfaSecret) {
      res.status(400).json({ 
        error: "Usuario no encontrado o MFA no configurado",
        message: "Verifique que se haya registrado correctamente" 
      });
      return;
    }

    if (user.mfaEnabled) {
      res.status(400).json({ 
        error: "MFA ya está activo",
        message: "Su cuenta ya tiene MFA activado. Puede iniciar sesión normalmente."
      });
      return;
    }

    // Verificar el token TOTP
    const verified = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token: token,
      window: 2 // Permitir 2 ventanas de tiempo (60 segundos antes/después)
    });

    if (!verified) {
      res.status(400).json({ 
        error: "Código inválido",
        message: "El código proporcionado no es válido. Por favor, intente nuevamente." 
      });
      return;
    }

    // Activar MFA
    await user.update({ mfaEnabled: true });

    // Generar token
    const authToken = generateToken({ id: user.id, role: user.role });

    res.json({
      message: "MFA activado exitosamente. Ya puede iniciar sesión con su email, contraseña y código MFA.",
      mfaEnabled: true,
      user: sanitizeUserOutput(user),
      token: authToken
    });
  } catch (error: any) {
    console.error("Error al verificar MFA setup:", error);
    res.status(500).json({ 
      error: "Error al verificar MFA",
      message: "Ha ocurrido un error interno. Por favor, intente más tarde."
    });
  }
};

// Inicio de sesión
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    if (handleValidationErrors(req, res)) return;

    const { email, password, mfaToken } = req.body;

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

    // MFA es obligatorio - verificar si el usuario ha completado la configuración
    if (!user.mfaEnabled) {
      res.status(403).json({
        error: "MFA no configurado",
        message: "Debe completar la configuración de MFA antes de iniciar sesión. Use el endpoint POST /api/auth/verify-mfa-setup con su email y el código de verificación.",
        requiresMFASetup: true
      });
      return;
    }

    // Verificar si el usuario tiene MFA habilitado (ahora es obligatorio)
    if (user.mfaEnabled) {
      // Si no se proporcionó token MFA, solicitar
      if (!mfaToken) {
        res.status(200).json({
          message: "MFA requerido",
          requiresMFA: true,
          userId: user.id
        });
        return;
      }

      // Verificar token MFA
      const mfaValid = await verifyMFALogin(user.id, mfaToken);
      if (!mfaValid) {
        res.status(401).json({
          error: "Código MFA inválido",
          message: "El código de autenticación proporcionado no es válido"
        });
        return;
      }
    }

    // Verificar si la contraseña ha expirado o debe cambiarla
    const passwordStatus = await checkPasswordExpiration(user.id);
    
    // Generar token
    const token = generateToken({ id: user.id, role: user.role });

    // Si debe cambiar contraseña, informar al usuario
    if (passwordStatus.mustChange) {
      res.json({
        message: "Inicio de sesión exitoso",
        user: sanitizeUserOutput(user),
        token,
        mustChangePassword: true,
        passwordExpired: passwordStatus.expired,
        warning: passwordStatus.expired 
          ? "Su contraseña ha expirado. Debe cambiarla para continuar usando el sistema."
          : "Se requiere que cambie su contraseña."
      });
      return;
    }

    // Advertir si la contraseña está por expirar (menos de 7 días)
    const daysUntilExpiration = user.passwordExpiresAt 
      ? Math.ceil((user.passwordExpiresAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      : null;

    const response: any = {
      message: "Inicio de sesión exitoso",
      user: sanitizeUserOutput(user),
      token
    };

    if (daysUntilExpiration && daysUntilExpiration <= 7) {
      response.warning = `Su contraseña expirará en ${daysUntilExpiration} días. Se recomienda cambiarla pronto.`;
      response.passwordExpiresInDays = daysUntilExpiration;
    }

    res.json(response);
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