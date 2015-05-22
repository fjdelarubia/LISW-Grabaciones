
var path = require('path');

var Sequelize = require('sequelize');

// Configurar Sequelize para usar SQLite. Uso una expresion regular para extraer 
// los valores de acceso a la base de datos
var vals = process.env.DATABASE_URL.match(/(.*)\:\/\/(.*?)\:(.*)@(.*)\:(.*)\/(.*)/);

var DATABASE_PROTOCOL = vals[1];
var DATABASE_DIALECT = vals[1];
var DATABASE_USER = vals[2];
var DATABASE_PASSWORD = vals[3];
var DATABASE_HOST = vals[4];
var DATABASE_PORT = vals[5];
var DATABASE_NAME = vals[6];

var sequelize = new Sequelize(DATABASE_NAME, DATABASE_USER, DATABASE_PASSWORD, 
            { dialect:  DATABASE_DIALECT, 
              protocol: DATABASE_PROTOCOL, 
              port:     DATABASE_PORT,
              host:     DATABASE_HOST,
              storage:  'lisw.sqlite',   // solo local en .env
              omitNull: true                            // para postgres
            });



// Importar la definicion de las clases.
// La clase Xxxx se importa desde el fichero xxxx.js.
var User = sequelize.import(path.join(__dirname,'user'));
var Grab = sequelize.import(path.join(__dirname,'grab'));

exports.User = User;
exports.Grab = Grab;

sequelize.sync();


// Crear las tablas en la base de datos que no se hayan creado aun.
// En un futuro lo haremos con migraciones.
