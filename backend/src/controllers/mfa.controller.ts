import { Response } from "express";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import User from "../models/user";
import { AuthRequest } from "../middleware/auth.middleware";
import bcrypt from "bcryptjs";

// Generar códigos de respaldo
const generateBackupCodes = (): string[] => {
  const codes: string[] = [];
  for (let i = 0; i < 10; i++) {
    // Generar código de 8 caracteres alfanuméricos
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

// Habilitar MFA para el usuario
export const enableMFA = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findByPk(req.userId);
    
    if (!user) {
      res.status(404).json({ 
        error: "Usuario no encontrado" 
      });
      return;
    }

    if (user.mfaEnabled) {
      res.status(400).json({ 
        error: "MFA ya está habilitado",
        message: "La autenticación de dos factores ya está activa en su cuenta" 
      });
      return;
    }

    // Generar secreto para TOTP
    const secret = speakeasy.generateSecret({
      name: `Gestión de Tareas (${user.email})`,
      issuer: 'Gestión de Tareas',
      length: 32
    });

    // Generar códigos de respaldo
    const backupCodes = generateBackupCodes();
    const hashedBackupCodes = await hashBackupCodes(backupCodes);

    // Guardar secreto temporalmente (no activar MFA todavía)
    await user.update({
      mfaSecret: secret.base32,
      mfaBackupCodes: JSON.stringify(hashedBackupCodes)
    });

    // Generar código QR
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

    res.json({
      message: "MFA configurado. Escanee el código QR con su aplicación de autenticación",
      secret: secret.base32,
      qrCode: qrCodeUrl,
      backupCodes: backupCodes, // Mostrar solo una vez
      instructions: {
        step1: "Descargue una aplicación de autenticación (Google Authenticator, Authy, etc.)",
        step2: "Escanee el código QR con la aplicación",
        step3: "Guarde los códigos de respaldo en un lugar seguro",
        step4: "Verifique el código generado en el endpoint /verify-mfa"
      }
    });
  } catch (error: any) {
    console.error("Error al habilitar MFA:", error);
    res.status(500).json({ 
      error: "Error al configurar MFA",
      message: "Ha ocurrido un error interno. Por favor, intente más tarde."
    });
  }
};

// Verificar y activar MFA
export const verifyAndEnableMFA = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({ 
        error: "Token requerido",
        message: "Debe proporcionar el código de 6 dígitos de su aplicación de autenticación" 
      });
      return;
    }

    const user = await User.findByPk(req.userId);
    
    if (!user || !user.mfaSecret) {
      res.status(400).json({ 
        error: "MFA no configurado",
        message: "Primero debe configurar MFA usando el endpoint /enable-mfa" 
      });
      return;
    }

    if (user.mfaEnabled) {
      res.status(400).json({ 
        error: "MFA ya está activo" 
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

    res.json({
      message: "MFA activado exitosamente",
      mfaEnabled: true
    });
  } catch (error: any) {
    console.error("Error al verificar MFA:", error);
    res.status(500).json({ 
      error: "Error al verificar MFA",
      message: "Ha ocurrido un error interno. Por favor, intente más tarde."
    });
  }
};

// Verificar código MFA durante login
export const verifyMFALogin = async (userId: number, token: string): Promise<boolean> => {
  try {
    const user = await User.findByPk(userId);
    
    if (!user || !user.mfaEnabled || !user.mfaSecret) {
      return false;
    }

    // Verificar el token TOTP
    const verified = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token: token,
      window: 2
    });

    if (verified) {
      return true;
    }

    // Si el token TOTP falla, verificar códigos de respaldo
    if (user.mfaBackupCodes) {
      const backupCodes = JSON.parse(user.mfaBackupCodes);
      
      for (let i = 0; i < backupCodes.length; i++) {
        const isValid = await bcrypt.compare(token, backupCodes[i]);
        
        if (isValid) {
          // Remover el código de respaldo usado
          backupCodes.splice(i, 1);
          await user.update({ mfaBackupCodes: JSON.stringify(backupCodes) });
          return true;
        }
      }
    }

    return false;
  } catch (error) {
    console.error("Error al verificar MFA:", error);
    return false;
  }
};

// Deshabilitar MFA
export const disableMFA = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { password } = req.body;

    if (!password) {
      res.status(400).json({ 
        error: "Contraseña requerida",
        message: "Debe proporcionar su contraseña para deshabilitar MFA" 
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

    if (!user.mfaEnabled) {
      res.status(400).json({ 
        error: "MFA no está habilitado" 
      });
      return;
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      res.status(401).json({ 
        error: "Contraseña incorrecta" 
      });
      return;
    }

    // Deshabilitar MFA
    await user.update({
      mfaEnabled: false,
      mfaSecret: null,
      mfaBackupCodes: null
    });

    res.json({
      message: "MFA deshabilitado exitosamente",
      mfaEnabled: false
    });
  } catch (error: any) {
    console.error("Error al deshabilitar MFA:", error);
    res.status(500).json({ 
      error: "Error al deshabilitar MFA",
      message: "Ha ocurrido un error interno. Por favor, intente más tarde."
    });
  }
};

// Obtener estado de MFA
export const getMFAStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findByPk(req.userId);
    
    if (!user) {
      res.status(404).json({ 
        error: "Usuario no encontrado" 
      });
      return;
    }

    const backupCodesCount = user.mfaBackupCodes 
      ? JSON.parse(user.mfaBackupCodes).length 
      : 0;

    res.json({
      mfaEnabled: user.mfaEnabled,
      backupCodesRemaining: backupCodesCount
    });
  } catch (error: any) {
    console.error("Error al obtener estado de MFA:", error);
    res.status(500).json({ 
      error: "Error al obtener estado de MFA",
      message: "Ha ocurrido un error interno. Por favor, intente más tarde."
    });
  }
};

// Regenerar códigos de respaldo
export const regenerateBackupCodes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { password } = req.body;

    if (!password) {
      res.status(400).json({ 
        error: "Contraseña requerida",
        message: "Debe proporcionar su contraseña para regenerar los códigos de respaldo" 
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

    if (!user.mfaEnabled) {
      res.status(400).json({ 
        error: "MFA no está habilitado",
        message: "Debe tener MFA habilitado para generar códigos de respaldo" 
      });
      return;
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      res.status(401).json({ 
        error: "Contraseña incorrecta" 
      });
      return;
    }

    // Generar nuevos códigos de respaldo
    const backupCodes = generateBackupCodes();
    const hashedBackupCodes = await hashBackupCodes(backupCodes);

    await user.update({
      mfaBackupCodes: JSON.stringify(hashedBackupCodes)
    });

    res.json({
      message: "Códigos de respaldo regenerados exitosamente",
      backupCodes: backupCodes,
      warning: "Estos códigos solo se mostrarán una vez. Guárdelos en un lugar seguro."
    });
  } catch (error: any) {
    console.error("Error al regenerar códigos de respaldo:", error);
    res.status(500).json({ 
      error: "Error al regenerar códigos de respaldo",
      message: "Ha ocurrido un error interno. Por favor, intente más tarde."
    });
  }
};

