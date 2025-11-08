import { DataTypes, Model } from "sequelize";
import {sequelize} from "./index";

// Control de Acceso: Definición de roles de usuario
export enum UserRole {
  ADMIN = 'ADMIN',
  PREMIUM = 'PREMIUM',
  FREE = 'FREE'
}

class User extends Model {
  public id!: string;
  public name!: string;
  public email!: string;
  public password!: string;
  public role!: UserRole;
  public isActive!: boolean;
  public loginAttempts!: number;
  public lastLoginAttempt!: Date;
  
  // MFA fields
  public mfaEnabled!: boolean;
  public mfaSecret!: string | null;
  public mfaBackupCodes!: string | null;
  
  // Password management fields
  public passwordChangedAt!: Date | null;
  public passwordExpiresAt!: Date | null;
  public mustChangePassword!: boolean;
  public lastPasswordChangeRequired!: Date | null;
}

User.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      // Control de entrada: Validación de entradas en DB
      notEmpty: { msg: 'El nombre no puede estar vacío' },
      len: { args: [2, 100], msg: 'El nombre debe tener entre 2 y 100 caracteres' }
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      // Control de entrada: Validación de entradas en DB
      isEmail: { msg: 'Debe proporcionar un email válido' }
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      // Control de entrada: Validación de entradas en DB
      len: { args: [6, 255], msg: 'La contraseña debe tener al menos 6 caracteres' }
    }
  },
  role: {
    type: DataTypes.ENUM(...Object.values(UserRole)),
    defaultValue: UserRole.FREE,
    allowNull: false,
    validate: {
      // Control de entrada: Validación de entradas en DB
      isIn: {
        args: [Object.values(UserRole)],
        msg: 'Rol de usuario inválido'
      }
    }
  },
  // Gestión de sesiones: Control de estado de la cuenta
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  },
  // Gestión de sesiones: Control de intentos de login
  loginAttempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  // Gestión de sesiones: Control de último intento de login
  lastLoginAttempt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  // MFA: Multi-Factor Authentication
  mfaEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  mfaSecret: {
    type: DataTypes.STRING,
    allowNull: true
  },
  mfaBackupCodes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // Gestión de contraseñas: Expiración y cambio forzado
  passwordChangedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  passwordExpiresAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  mustChangePassword: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  lastPasswordChangeRequired: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'User',
  tableName: 'Users'
});

export default User;