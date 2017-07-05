var express = require('express')
var app = express()
var port = process.env.PORT || 80
var mongoose = require('mongoose')
var passport = require('passport')
var flash = require('connect-flash')

var bodyParser = require('body-parser')
var cookieParser = require('cookie-parser')

var session = require('express-session')

var db = require('./config/db')

mongoose.connect(db.url);
require('./config/auth')(passport)

app.use(cookieParser())
app.use(bodyParser.urlencoded({
    extended:true
}))
app.use(bodyParser.json())
// app.use(bodyParser())

app.set('view engine','pug')

app.use(session(
    {
        secret:'EnTaroTassadar',
        resave:true,
        saveUninitialized:true
    }
    ))
app.use(passport.initialize())
app.use(passport.session())
app.use(flash())

require('./app/router')(app,passport)

app.listen(port)

console.log('Listening at port '+ port)
