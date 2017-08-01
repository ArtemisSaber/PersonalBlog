var mongoose = require('mongoose')
var comment = require('../../comments/models/comment')
var bcrypt = require('bcrypt-nodejs')

var articleSchema = mongoose.Schema({
    header: {
        articleId: String,
        authorName: String,
        category: String,
        createTime: Date,
        lastEditTime: Date,
        isPrivate:Boolean
    },
    body: {
        title: String,
        content: String,//Content stored in markdown string
    },
    comments: [{
        time: String,
        author: String,
        content: String
    }]
})

articleSchema.methods.generateHash = function (author, title, content, callback) {
    var hash = 0;
    var str = title + author + content
    if (str.length == 0) {
        callback(hash)
    }
    else {
        for (i = 0; i < str.length; i++) {
            char = str.charCodeAt(i)
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash
        }
        callback(hash)
    }
}

module.exports = mongoose.model('article', articleSchema)