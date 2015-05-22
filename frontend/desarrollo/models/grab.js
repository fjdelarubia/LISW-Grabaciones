module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Grab',
      { radio: {
            type: DataTypes.STRING,
            validate: {
                notEmpty: { msg: "El campo de nombre de radio no puede estar vacío" }
            }
        },
        inicio: {
            type: DataTypes.DATE,
            validate:{
                notEmpty: {msg: "La fecha de inicio no puede estar vacía"}
            }
        },
        estado: {
            type: DataTypes.INTEGER,
            validate:{
            max: 3,
            min: 0}
        },
        leido:{
            type: DataTypes.INTEGER,
            validate: {
            max: 1,
            min: 0}
        },
        email:{
            type: DataTypes.INTEGER,
            validate:{
            max: 1,
            min: 0}
        },
        userid: {
            type: DataTypes.INTEGER,
            validate:{
            notNull: true,
            notEmpty: true
            }
        },
        duracion: {
            type: DataTypes.INTEGER,
            validate:{
            notEmpty: {msg: "La duración de la grabación no puede estar vacía"},
            max: 60,
            min: 0}
        }
        });
}