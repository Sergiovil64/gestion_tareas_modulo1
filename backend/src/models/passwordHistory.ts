import { DataTypes, Model } from "sequelize";
import { sequelize } from "./index";

class PasswordHistory extends Model {
  public id!: number;
  public userId!: number;
  public passwordHash!: string;
  public changedAt!: Date;
}

PasswordHistory.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  passwordHash: {
    type: DataTypes.STRING,
    allowNull: false
  },
  changedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  sequelize,
  modelName: 'PasswordHistory',
  tableName: 'PasswordHistories'
});

export default PasswordHistory;

