
// Definicion de la clase User:

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('User',
      { login: {
            type: DataTypes.STRING,
            validate: {
                notEmpty: { msg: "El campo login no puede estar vacío" }
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
                isEmail: { msg: "El formato del email introducido no es correcto" },
                notEmpty: { msg: "El campo email no puede estar vacío" }
            }
        },
        hashed_password: {
            type: DataTypes.STRING
        },
        ultimaConexion:{
            type: DataTypes.STRING
        },
        ultimaDesconexion:{
            type: DataTypes.STRING
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
