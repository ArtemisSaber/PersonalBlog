var mongoose = require('mongoose')
var comment = require('../../comments/models/comment')
var bcrypt = require('bcrypt-nodejs')

var articleSchema = mongoose.Schema({
    header: {
        isTemp: Boolean,
        articleId: String,
        authorName: String,
        derivedFrom: String,
        category: String,
        createTime: Date,
        lastEditTime: Date
    },
    body: {
        title: String,
        content: String,//Content stored in markdown string
    }
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

module.exports = mongoose.model('tempArticle', articleSchema)