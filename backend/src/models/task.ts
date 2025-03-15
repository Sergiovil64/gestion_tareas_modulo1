import { DataTypes, Model } from "sequelize";
import {sequelize} from "./index";


class Task extends Model {
  public id!: number; 
  public title!: string;
  public description!: string;
  public state!: string;
  public limit_date!: Date;
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
  state: {
    type: DataTypes.STRING,
    values: ['PENDIENTE', 'EN PROGRESO', 'COMPLETADA'],
    defaultValue: 'PENDIENTE'
  },
  limit_date: {
    type: DataTypes.DATE,
    allowNull: false
  }
}, {
  sequelize,
  modelName: 'Task',
});

export default Task;