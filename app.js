require('dotenv').config()

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const mongoose = require('mongoose')
const {check, validationResult} = require('express-validator')
const bcrypt = require('bcrypt')
const session = require('express-session')
const hbs = require('hbs');
const multer = require('multer');



// connected to database
mongoose.connect(process.env.MONGO_URL)
.then(()=>console.log('connected to database ......'))
.catch(err => console.error('Error connected to database', err))


hbs.registerHelper('formatDate', function(date) {
    const createDate = new Date(date);

    return (
        createDate.getDate() + "-" +
        (createDate.getMonth() + 1) + "-" +
        createDate.getFullYear()
    );
});

hbs.registerHelper('ifEquals', function(arg1, arg2, options) {
    if (String(arg1) === String(arg2)) {
        return options.fn(this);
    }
    return options.inverse(this);
});
//  تسلسل الارقام في جداول التقارير من 1 ل 10 ع حسب ال  limit ال انا عملاه
hbs.registerHelper('inc', function(value){
    return value + 1;
})

//  تسلسل يخلي الصفحه التانية تعد من 11 وليس 1 لو ال  limit  كان 10
hbs.registerHelper('serialNumber', function(index, currentPage, limit) {

    return ((currentPage - 1) * limit) + index + 1;

});

//  بيخلي الصفحه التانية من التقارير تكمل عد ومتبدأش من رقم 1 تاني 

hbs.registerHelper('add', function(index, start) {
    return index + start + 1;
});


var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var reportsRouter = require('./routes/reports')
var inquiriesRouter = require('./routes/inquiries')
var technicalNotesRouter = require('./routes/technicalNotes')

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
// session

app.use(session({
  secret : process.env.SESSION_SECRET,
  saveUninitialized : false,
  resave : false
}))
app.use(express.static(path.join(__dirname, 'public')));


// isAdmin = true / isAdmin = false
app.use((req, res, next) => {

    res.locals.isLoggedIn = req.session.isLoggedIn;

    res.locals.user = req.session.user;

    res.locals.isAdmin = false;

    if (
        req.session.user &&
        req.session.user.role &&
        req.session.user.role.roleName === 'Admin'
    ) {
        res.locals.isAdmin = true;
    }

    next();

});

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/reports', reportsRouter )
app.use('/inquiries', inquiriesRouter )
app.use('/technicalNotes', technicalNotesRouter)

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

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
