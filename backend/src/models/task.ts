import { DataTypes, Model } from "sequelize";
import {sequelize} from "./index";
import User from "./user";


class Task extends Model {
  public id!: number; 
  public title!: string;
  public description!: string;
  public status!: string;
  public dueDate!: Date;
}

Task.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM("PENDIENTE", "COMPLETADA", "EN PROGRESO"),
    defaultValue: 'PENDIENTE',
    allowNull: false
  },
  dueDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "Users",
      key: "id",
    },
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
  }
}, {
  sequelize,
  modelName: 'Task',
});

Task.belongsTo(User, { foreignKey: "userId" });
User.hasMany(Task, { foreignKey: "userId" });

export default Task;