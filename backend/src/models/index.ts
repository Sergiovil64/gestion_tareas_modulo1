'use strict';

import fs from 'fs';
import path from 'path';
import { Sequelize, Options, DataTypes } from 'sequelize';
import process from 'process';
import config from '../config/config.json';

interface DBConfig {
  development: Options;
  production: Options;
}

const basename = path.basename(__filename);

const env: string = process.env.NODE_ENV || 'development';
const db: {[key: string]: any} = {};

const envConfig = env === 'development' ? (config as DBConfig).development : (config as DBConfig).production;

const sequelize = new Sequelize(envConfig.database || '', envConfig.username || '', envConfig.password, envConfig);

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1
    );
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

export {sequelize, db};
