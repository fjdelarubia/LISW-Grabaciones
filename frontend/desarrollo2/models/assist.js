module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Assist',
    { userid: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        asunto: {
            type: DataTypes.STRING,
            allowNull: false
        },
        contenido:{
            type: DataTypes.STRING,
            allowNull: false
        }
    }
    );
}