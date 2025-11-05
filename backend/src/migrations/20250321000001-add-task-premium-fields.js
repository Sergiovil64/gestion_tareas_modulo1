'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add color field (Premium feature)
    await queryInterface.addColumn('Tasks', 'color', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: '#FFFFFF'
    });

    // Add imageUrl field (Premium feature)
    await queryInterface.addColumn('Tasks', 'imageUrl', {
      type: Sequelize.STRING,
      allowNull: true
    });

    // Add priority field
    await queryInterface.addColumn('Tasks', 'priority', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Tasks', 'color');
    await queryInterface.removeColumn('Tasks', 'imageUrl');
    await queryInterface.removeColumn('Tasks', 'priority');
  }
};

