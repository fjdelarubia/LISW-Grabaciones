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
var crypto = require('crypto');
var dotenv = require('dotenv');

dotenv.load();

var routes = require('./routes/index');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(connect.methodOverride());
app.use(cookieParser(process.env.sk || 'lisw20152016'));
app.use(session());
app.use(express.static(path.join(__dirname, 'public')));

app.use(partials());
app.use(flash());


app.use(function(req, res, next) {

   // Hacer visible req.session en las vistas
   res.locals.session = req.session;
   res.locals.referer = req.url;
   next();
});

app.use('/', routes);

app.locals.url_records = process.env.RECORDS_URL || 'http://localhost:8093';
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
};

app.locals.getLeida = function(leida){
 l = ['No','Sí'];
 return l[leida];
}; 
app.locals.getMD5 = function(st){
   return crypto.createHash('md5').update(st).digest('hex');
};


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

module.exports = app;
