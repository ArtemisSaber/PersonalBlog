var express = require('express')
var app = express()
var port = process.env.PORT || 8082
var mongoose = require('mongoose')
var passport = require('passport')
var flash = require('connect-flash')
var fs = require('fs')
var path = require('path')
var winston = require('winston')
var less = require('less')

var bodyParser = require('body-parser')
var cookieParser = require('cookie-parser')

var session = require('express-session')

var db = require('./config/db')
var autoincrement = require('mongoose-auto-increment')

mongoose.connect(db.url);

autoincrement.initialize(mongoose.connection)

require('./auth/config/auth')(passport)

app.use(cookieParser())
app.use(bodyParser.urlencoded({
    extended: true
}))
app.use(bodyParser.json())
// app.use(bodyParser())

app.set('view engine', 'pug')

app.use(session(
    {
        secret: 'EnTaroTassadar',
        resave: true,
        saveUninitialized: true
    }
))
app.use(passport.initialize())
app.use(passport.session())
app.use(flash())

app.use('/css', express.static(path.join(__dirname, 'public', 'css')))
app.use('/scripts', express.static(path.join(__dirname, 'public', 'scripts')))
app.use('/images', express.static(path.join(__dirname, 'public', 'image')))

require('./routers/routes')(app, passport)
require('./routers/editor')(app)
require('./routers/content')(app)

fs.readdir('./public/less', (err, files) => {
    if (err) {
        console.log(err)
    }
    files.forEach((file, index) => {
        var curfile = path.join('./public/less', file)
        fs.readFile(curfile, 'utf-8',(err, data) => {
            less.render(data,(err,cssdata)=>{
                var targetPath = path.join('./public/css',file.split('.')[0]+".css")
                fs.writeFile(targetPath,cssdata.css,err=>{
                    if(err){
                        console.log(err)
                    }
                })
            })
        })
    })
})

app.listen(port)


var now = new Date()
winston.log('start-up', now.toString() + ": Listening at" + port)
