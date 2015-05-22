var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var partials = require('express-partials');
var connect = require('connect');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var flash = require('express-flash');
var fs = require('fs');
var mime = require('mime');
var md5 = require('MD5');
var crypto = require('crypto');
var dotenv = require('dotenv');
dotenv.load();

var routes = require('./routes/index');
var ws = require('./ws/index');

var app = express();

//websocket
var server = require('http').Server(app);
var io = require('socket.io')(server);

server.listen(3000);
io.set('authorization', ws.authorize);
io.on('connection', ws.connection);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(favicon());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(connect.methodOverride());
app.use(cookieParser(process.env.sk || 'hemmi2000'));
app.use(session({secret: process.env.sk || 'hemmi2000'}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(logger('dev'));

app.use(partials());
app.use(flash());

app.use(function(req, res, next) {

   // Hacer visible req.session en las vistas
   res.locals.session = req.session;
   res.locals.referer = req.url;
   next();
});

app.use('/', routes);

app.locals.url_frontend = process.env.FRONTEND_URL || 'http://localhost:8093';
app.locals.url_java = process.env.JAVASERVER_URL || 'http://localhost:8093';
app.locals.url_almacenamiento = process.env.STORAGE_URL || 'http://localhost:8099';

app.locals.escapeText =  function(text) {
   return String(text)
          .replace(/&(?!\w+;)/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/\n/g, '<br>');
};

app.locals.getEstado = function(estado){
  e = ['<span class="btn btn-primary" title="En espera"><i class="glyphicon glyphicon-time"></i></span>', '<span id="grabando" class="btn" title="En curso"><i class="glyphicon glyphicon-facetime-video"></i></span>', '<span class="btn btn-success" title="Terminada"><i class="glyphicon glyphicon-ok"></i></span>', '<span class="btn btn-danger" title="Error"><i class="glyphicon glyphicon-remove"></i></span>'];
  return e[estado];
}

app.locals.getLeida = function(leida){
 l = ['No','Sí'];
 return l[leida];
} 
app.locals.getRole = function(rol){
  r = ['User','Admin'];
  return r[rol];
}
app.locals.getString = function(s){
  return s.slice(0,25)+"...";
}
app.locals.getMD5 = function(convert){
return crypto.createHash('md5').update("" + convert).digest('hex');
}


/// catch 404 and forwarding to error handler
 app.use(function(req, res, next) {
     //res.status(404);
  res.render('errors/404');
 });

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('errors/500', {
            message: err.message || 'ni guarra idea de lo que ha pasado',
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  console.log('ejecucion segundo 500');
    res.status(err.status || 500);
    res.render('errors/500', {
        message: err.message,
        error: {}
    });
});

//de momento se comenta luego, en producción la pongo
/*
process.on('SIGINT', function(){
  console.log('No me vas a hacer caer');
});
process.on('SIGHUP', function(){
  console.log('De esta manera, tampoco');
});
*/
module.exports = app;
