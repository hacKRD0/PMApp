'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Brokerage extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Brokerage.hasMany(models.StockMapper, { onDelete: 'CASCADE' });
      Brokerage.hasMany(models.User, {
        foreignKey: 'defaultBrokerageId',
        as: 'users',
      });
    }
  }
  Brokerage.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      code: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'Brokerage',
    }
  );
  return Brokerage;
};
