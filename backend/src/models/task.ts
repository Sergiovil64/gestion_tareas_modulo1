import { DataTypes, Model } from "sequelize";
import {sequelize} from "./index";
import User from "./user";

export enum TaskStatus {
  PENDIENTE = 'PENDIENTE',
  EN_PROGRESO = 'EN PROGRESO',
  COMPLETADA = 'COMPLETADA'
}

class Task extends Model {
  public id!: string;
  public title!: string;
  public description!: string;
  public status!: TaskStatus;
  public dueDate!: Date;
  public userId!: string;
  public color!: string; // Premium feature
  public imageUrl!: string; // Premium feature
  public priority!: number;
}

Task.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      // Control de entrada: Validación de entradas en DB
      notEmpty: { msg: 'El título no puede estar vacío' },
      len: { args: [3, 200], msg: 'El título debe tener entre 3 y 200 caracteres' }
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      // Control de entrada: Validación de entradas en DB
      len: { args: [0, 1000], msg: 'La descripción no puede exceder 1000 caracteres' }
    }
  },
  status: {
    type: DataTypes.ENUM(...Object.values(TaskStatus)),
    defaultValue: TaskStatus.PENDIENTE,
    allowNull: false,
    validate: {
      // Control de entrada: Validación de entradas en DB
      isIn: {
        args: [Object.values(TaskStatus)],
        msg: 'Estado de tarea inválido'
      }
    }
  },
  dueDate: {
    type: DataTypes.DATE,
    // Control de entrada: Validación de entradas en DB
    allowNull: false
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    // Control de entrada: Validación de entradas en DB
    references: {
      model: 'Users',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  },
  color: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: '#FFFFFF',
    validate: {
      // Control de entrada: Validación de entradas en DB
      is: {
        args: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
        msg: 'El color debe ser un código hexadecimal válido (ej: #FFFFFF)'
      }
    }
  },
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      // Control de entrada: Validación de entradas en DB
      isUrl: { msg: 'Debe proporcionar una URL válida para la imagen' }
    }
  },
  priority: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      // Control de entrada: Validación de entradas en DB
      min: { args: [1], msg: 'La prioridad mínima es 1' },
      max: { args: [5], msg: 'La prioridad máxima es 5' }
    }
  }
}, {
  sequelize,
  modelName: 'Task',
  tableName: 'Tasks'
});

// Relaciones
Task.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(Task, { foreignKey: 'userId' });

export default Task;