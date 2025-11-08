'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('⚠️  ADVERTENCIA: Esta migración eliminará todos los datos existentes');
      console.log('Recreando tablas con UUIDs...\n');

      // 1. Eliminar tablas en orden (respetando foreign keys)
      await queryInterface.dropTable('Tasks', { transaction });
      await queryInterface.dropTable('PasswordHistories', { transaction });
      await queryInterface.dropTable('Users', { transaction });
      
      console.log('✓ Tablas antiguas eliminadas');

      // 2. Recrear tabla Users con UUID
      await queryInterface.createTable('Users', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
          allowNull: false
        },
        name: {
          type: Sequelize.STRING,
          allowNull: false
        },
        email: {
          type: Sequelize.STRING,
          allowNull: false,
          unique: true
        },
        password: {
          type: Sequelize.STRING,
          allowNull: false
        },
        role: {
          type: Sequelize.ENUM('ADMIN', 'PREMIUM', 'FREE'),
          defaultValue: 'FREE',
          allowNull: false
        },
        isActive: {
          type: Sequelize.BOOLEAN,
          defaultValue: true,
          allowNull: false
        },
        loginAttempts: {
          type: Sequelize.INTEGER,
          defaultValue: 0,
          allowNull: false
        },
        lastLoginAttempt: {
          type: Sequelize.DATE,
          allowNull: true
        },
        mfaEnabled: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          allowNull: false
        },
        mfaSecret: {
          type: Sequelize.STRING,
          allowNull: true
        },
        mfaBackupCodes: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        passwordChangedAt: {
          type: Sequelize.DATE,
          allowNull: true
        },
        passwordExpiresAt: {
          type: Sequelize.DATE,
          allowNull: true
        },
        mustChangePassword: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          allowNull: false
        },
        lastPasswordChangeRequired: {
          type: Sequelize.DATE,
          allowNull: true
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false
        }
      }, { transaction });
      
      console.log('✓ Tabla Users recreada con UUID');

      // 3. Recrear tabla Tasks con UUID
      await queryInterface.createTable('Tasks', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
          allowNull: false
        },
        title: {
          type: Sequelize.STRING,
          allowNull: false
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        status: {
          type: Sequelize.ENUM('PENDIENTE', 'EN PROGRESO', 'COMPLETADA'),
          defaultValue: 'PENDIENTE',
          allowNull: false
        },
        dueDate: {
          type: Sequelize.DATE,
          allowNull: false
        },
        userId: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'Users',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        color: {
          type: Sequelize.STRING,
          allowNull: true,
          defaultValue: '#FFFFFF'
        },
        imageUrl: {
          type: Sequelize.STRING,
          allowNull: true
        },
        priority: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 1
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false
        }
      }, { transaction });
      
      console.log('✓ Tabla Tasks recreada con UUID');

      // 4. Recrear tabla PasswordHistories con UUID
      await queryInterface.createTable('PasswordHistories', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
          allowNull: false
        },
        userId: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'Users',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        passwordHash: {
          type: Sequelize.STRING,
          allowNull: false
        },
        changedAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false
        }
      }, { transaction });
      
      console.log('✓ Tabla PasswordHistories recreada con UUID');
      
      await transaction.commit();
      console.log('\n✅ Migración completada exitosamente');
      console.log('📝 Ahora puede crear el usuario administrador con: npm run create-admin\n');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error en la migración:', error.message);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('Revirtiendo migración UUID...\n');
      
      // Eliminar tablas con UUID
      await queryInterface.dropTable('Tasks', { transaction });
      await queryInterface.dropTable('PasswordHistories', { transaction });
      await queryInterface.dropTable('Users', { transaction });
      
      console.log('✓ Tablas UUID eliminadas');

      // Recrear tablas con INTEGER autoincremental
      await queryInterface.createTable('Users', {
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true,
          allowNull: false
        },
        name: {
          type: Sequelize.STRING,
          allowNull: false
        },
        email: {
          type: Sequelize.STRING,
          allowNull: false,
          unique: true
        },
        password: {
          type: Sequelize.STRING,
          allowNull: false
        },
        role: {
          type: Sequelize.ENUM('ADMIN', 'PREMIUM', 'FREE'),
          defaultValue: 'FREE',
          allowNull: false
        },
        isActive: {
          type: Sequelize.BOOLEAN,
          defaultValue: true,
          allowNull: false
        },
        loginAttempts: {
          type: Sequelize.INTEGER,
          defaultValue: 0,
          allowNull: false
        },
        lastLoginAttempt: {
          type: Sequelize.DATE,
          allowNull: true
        },
        mfaEnabled: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          allowNull: false
        },
        mfaSecret: {
          type: Sequelize.STRING,
          allowNull: true
        },
        mfaBackupCodes: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        passwordChangedAt: {
          type: Sequelize.DATE,
          allowNull: true
        },
        passwordExpiresAt: {
          type: Sequelize.DATE,
          allowNull: true
        },
        mustChangePassword: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          allowNull: false
        },
        lastPasswordChangeRequired: {
          type: Sequelize.DATE,
          allowNull: true
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false
        }
      }, { transaction });

      await queryInterface.createTable('Tasks', {
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true,
          allowNull: false
        },
        title: {
          type: Sequelize.STRING,
          allowNull: false
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        status: {
          type: Sequelize.ENUM('PENDIENTE', 'EN PROGRESO', 'COMPLETADA'),
          defaultValue: 'PENDIENTE',
          allowNull: false
        },
        dueDate: {
          type: Sequelize.DATE,
          allowNull: false
        },
        userId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'Users',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        color: {
          type: Sequelize.STRING,
          allowNull: true,
          defaultValue: '#FFFFFF'
        },
        imageUrl: {
          type: Sequelize.STRING,
          allowNull: true
        },
        priority: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 1
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false
        }
      }, { transaction });

      await queryInterface.createTable('PasswordHistories', {
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true,
          allowNull: false
        },
        userId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'Users',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        passwordHash: {
          type: Sequelize.STRING,
          allowNull: false
        },
        changedAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false
        }
      }, { transaction });
      
      console.log('✓ Tablas INTEGER recreadas');
      
      await transaction.commit();
      console.log('\n✅ Reversión completada exitosamente\n');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error en la reversión:', error.message);
      throw error;
    }
  }
};

