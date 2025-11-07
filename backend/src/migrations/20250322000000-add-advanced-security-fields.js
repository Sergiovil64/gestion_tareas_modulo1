'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Agregar campos para MFA (Multi-Factor Authentication)
    await queryInterface.addColumn('Users', 'mfaEnabled', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false
    });

    await queryInterface.addColumn('Users', 'mfaSecret', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('Users', 'mfaBackupCodes', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Códigos de respaldo almacenados como JSON'
    });

    // Agregar campos para gestión de contraseñas
    await queryInterface.addColumn('Users', 'passwordChangedAt', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await queryInterface.addColumn('Users', 'passwordExpiresAt', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await queryInterface.addColumn('Users', 'mustChangePassword', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: 'Forzar cambio de contraseña en el próximo login'
    });

    await queryInterface.addColumn('Users', 'lastPasswordChangeRequired', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Última vez que se solicitó cambio de contraseña'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Users', 'mfaEnabled');
    await queryInterface.removeColumn('Users', 'mfaSecret');
    await queryInterface.removeColumn('Users', 'mfaBackupCodes');
    await queryInterface.removeColumn('Users', 'passwordChangedAt');
    await queryInterface.removeColumn('Users', 'passwordExpiresAt');
    await queryInterface.removeColumn('Users', 'mustChangePassword');
    await queryInterface.removeColumn('Users', 'lastPasswordChangeRequired');
  }
};

