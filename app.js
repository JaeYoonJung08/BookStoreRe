var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
const util = require('util');


var indexRouter = require('./routes/index');
// var usersRouter = require('./routes/users');

var app = express();


var mysql = require('mysql');

var db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '1234',
  database: 'bookstoreRe',
  port: 3306
})

db.connect(function(err) {
  if (err) {
    console.error('Database connection failed: ' + err.stack);
    return;
  }
  console.log('Connected to database.');
});

// Promisify the query function
db.query = util.promisify(db.query);

// 세션 미들웨어 설정
app.use(session({
  secret: '1234', // 비밀 키 설정
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: false,
    expires: new Date(Date.now() + (1000 * 60 * 60 * 24 * 7)) // 7일 동안 유효한 쿠키 설정
   } // HTTPS 사용 시 secure: true
}));

// MySQL 연결을 모든 라우터에서 사용할 수 있도록 설정
app.use((req, res, next) => {
  req.db = db;
  next();
});


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
// app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});


app.use(express.urlencoded({ extended: true }));



// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
