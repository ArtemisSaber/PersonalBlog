var mongoose = require('mongoose')

var commentSchema = mongoose.Schema({
    time:String,
    author:String,
    content:String
})

module.exports = mongoose.model('comment',commentSchema)