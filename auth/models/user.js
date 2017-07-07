var mongoose = require('mongoose')
var bcrypt = require('bcrypt-nodejs')
var autoincrement = require('mongoose-auto-increment')

var userSchema = mongoose.Schema({
    local: {
        userName: String,
        pwd: String,
        privilege: Number
    },
    google: {
        id: String,
        token: String,
        email: String,
        name: String
    },
    github: {
        id:String,
        token:String,
        nickName:String,
        email:String
    }
})

userSchema.methods.generateHash = function (pwd,callback) {
    //return bcrypt.hashSync(pwd,bcrypt.genSaltSync(8))
    bcrypt.genSalt(8,(err,res)=>{
        if(err){
            throw err
        }
        bcrypt.hash(pwd,res,null,(err,res)=>{
            if(err){
                throw err
            }
            callback(res)
        })
    })
}

userSchema.methods.verifyPassword = function (password,callback) {
    bcrypt.compare(password, this.local.pwd,(err,res)=>{
        if(err){
            throw err
        }
        callback(res)
    })
    
}

module.exports = mongoose.model('User',userSchema)
