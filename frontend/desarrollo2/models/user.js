
// Definicion de la clase User:

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('User',
      { login: {
            type: DataTypes.STRING,
            validate: {
                notEmpty: { msg: "El campo login no puede estar vacío" }
            }
        },
        role: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                max: 1,
                min: 0
            }
        },
        name: {
            type: DataTypes.STRING,
            validate: {
                notEmpty: { msg: "El campo nombre no puede estar vacío" }
            }
        },
        email: {
            type: DataTypes.TEXT,
            validate: {
                notEmpty: { msg: "El campo email no puede estar vacío" }
            }
        },
        hashed_password: {
            type: DataTypes.STRING
        },
        ultimaConexion:{
            type: DataTypes.STRING,
            allowNull: true
        },
        ultimaDesconexion:{
            type: DataTypes.STRING,
            allowNull: true
        },
        salt: {
            type: DataTypes.STRING
        },
        confirmado:{
          type: DataTypes.INTEGER,
          validate: {
             max: 1,
             min: 0
            }
        },
        grabaciones:{
          type: DataTypes.INTEGER,
          validate:{
            max:20,
            min:0
          }
           
        }
    }
        
    );
}
