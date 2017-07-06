var mongoose = require('mongoose')
var comment = require('../../comments/models/comment')
var articleSchema = mongoose.Schema({    
    header:{
        articleId:String,
        ownerName:String,
        category:String,
        createTime:Date
    },
    body:{
        title:String,
        content:String,//Content stored in markdown string
    },
    comments:[comment]
})

module.exports = mongoose.model('article',articleSchema)