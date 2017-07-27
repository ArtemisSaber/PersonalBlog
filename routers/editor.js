const Article = require('../editor/models/article')
const tempArticle = require('../editor/models/tempArticle')

var formidable = require('formidable')
var path = require('path')
var fs = require('fs')

function storeArticle(article = new Article(), user, title, content, callback) {
    var now = new Date()
    var isNew = true
    if (!article.isNew) {
        var isNew = false
    }
    var createTime = now.toUTCString()
    if (isNew) {
        article.header.createTime = createTime
    } else {
        article.header.lastEditTime = createTime
    }
    var authorName = user.local.userName
    article.header.authorName = authorName
    article.body.title = title
    article.body.content = content
    if (isNew) {
        article.generateHash(authorName, title, content, res => {
            article.header.articleId = res
            article.save(err => {
                if (err) {
                    throw err
                }
                callback(article)
            })
        })
    } else {
        article.save(err => {
            if (err) {
                throw err

            }
            callback(article)
        })
    }
}

function storeTempArticle(tempArticles = new tempArticle(), derivedFrom = null, user, title, content, callback) {
    var now = new Date()
    var nowTime = now.toUTCString()
    if (tempArticles.isNew) {
        tempArticles.header.createTime = nowTime
    } else {
        tempArticles.header.lastEditTime = nowTime
    }
    var authorName = user.local.userName
    tempArticles.header.authorName = authorName
    tempArticles.header.isTemp = true
    tempArticles.body.title = title
    tempArticles.body.content = content
    tempArticles.header.derivedFrom = derivedFrom
    tempArticles.generateHash(authorName, title, content, res => {
        tempArticles.header.articleId = res
        tempArticles.save(err => {
            if (err) {
                throw err
            }
            callback(tempArticles)
        })

    })


}

var isLoggedIn = function (req, res, next) {
    if (req.isAuthenticated()) {
        return next()
    }
    res.redirect('/auth/login')
}

function frequentMessage(res) {
    res.writeHead(403)
    res.write("Too frequent operations")
    res.end()
}

var message = {
    userName: String,
    authorName: String,
    postId: Number,
    hasTemp: Boolean
}

var userOpTime = new Map()
var userWriteTime = new Map()
var userAutoTime = new Map()


module.exports = function (app) {
    //editor page
    //new post
    app.get('/editor/new', isLoggedIn, (req, res) => {
        var nowTime = new Date()
        var user = req.user
        var authorized = false
        message.userName = req.user.local.userName
        if (userOpTime.get(message.userName)) {
            var lastOpTime = userOpTime.get(message.userName)
            if (nowTime - lastOpTime >= 15000) {
                authorized = true
                userOpTime.set(message.userName, nowTime)
            } else {
                res.writeHead(403)
                res.write("Too frequent operations")
                res.end()
            }
        } else {
            userOpTime.set(message.userName, nowTime)
            authorized = true
        }
        if (authorized) {
            tempArticle.findOne({ 'header.authorName': user.local.userName, 'header.derivedFrom': null }, (err, tempArticles) => {
                if (tempArticles) {
                    message.hasTemp = true
                    res.render('../views/editor.pug', { user: user, message: message, article: tempArticles })
                } else {
                    message.hasTemp = false
                    res.render('../views/editor.pug', { user: user, message: message, article: null })
                }
            })
        }
    })
    //save new post
    app.post('/editor/new', isLoggedIn, (req, res) => {
        var nowTime = new Date()
        var user = req.user
        var title = req.body.title
        var content = req.body.content
        var authorized = false
        if (userWriteTime.get(user.local.userName)) {
            var lastWriteTime = userWriteTime.get(user.local.userName)
            if (nowTime - lastWriteTime >= 15000) {
                authorized = true
                userOpTime.set(user.local.userName, nowTime)
            } else {
                res.writeHead(403)
                res.write("Too frequent operations")
                res.end()

            }

        } else {
            userOpTime.set(user.local.userName, nowTime)
            authorized = true
        }
        if (authorized) {
            storeArticle(undefined, user, title, content, article => {
                var id = article.header.articleId
                res.redirect('/content/' + id)
                //delete tempdata after submit
                tempArticle.deleteOne({ 'header.authorName': user.local.userName, 'header.derivedFrom': null }, (err, res) => {
                    if (err) {
                        throw err
                    }
                })
            })
        }
    })
    //auto save
    app.post('/editor/autoSave', isLoggedIn, (req, res) => {
        var nowTime = new Date()
        var authorized = false
        var user = req.user
        var title = req.body.title
        var content = req.body.content
        var derivedFrom = req.query.derive
        var autoKey = user.local.userName + "/" + derivedFrom
        if (derivedFrom === 'new') {
            derivedFrom = undefined
        }
        if (userAutoTime.get(autoKey)) {
            var lastAutoTime = userAutoTime.get(autoKey)
            if (nowTime - lastAutoTime >= 50000) {
                authorized = true
                userAutoTime.set(autoKey, nowTime)
            } else {
                frequentMessage(res)
            }
        } else {
            userAutoTime.set(autoKey, nowTime)
            authorized = true
        }
        if (authorized) {
            if (derivedFrom) {
                tempArticle.findOne({ 'header.derivedFrom': derivedFrom }, (err, tempArticles) => {
                    if (tempArticles) {
                        storeTempArticle(tempArticles, derivedFrom, user, title, content, (tempArti) => {
                            res.writeHead(200)
                            res.end()
                        })
                    } else {
                        storeTempArticle(undefined, derivedFrom, user, title, content, (tempArti) => {
                            res.writeHead(200)
                            res.end()
                        })
                    }
                })
            } else {
                tempArticle.findOne({ 'header.authorName': user.local.userName }, (err, tempArticles) => {
                    if (tempArticles) {
                        storeTempArticle(tempArticles, undefined, user, title, content, (tempArti) => {
                            res.writeHead(200)
                            res.end()
                        })
                    } else {
                        storeTempArticle(undefined, undefined, user, title, content, (tempArti) => {
                            res.writeHead(200)
                            res.end()
                        })
                    }
                })

            }
        }
    })
    //edit post
    app.get('/editor/:articleId', isLoggedIn, (req, res) => {
        var articleIdParam = req.params.articleId
        var user = req.user
        tempArticle.findOne({ 'header.derivedFrom': articleIdParam, 'header.authorName': user.local.userName }, (err, tempArticles) => {
            if (err) {
                throw err
            }
            if (tempArticles) {
                message.authorName = tempArticles.header.authorName
                message.postId = tempArticles.header.derivedFrom
                res.render('../views/editor.pug', { user: user, message: message, article: tempArticles })
            } else {
                Article.findOne({ 'header.articleId': articleIdParam }, (err, article) => {
                    if (err) {
                        throw err
                    }
                    if (article) {
                        if (user.local.userName === article.header.authorName) {
                            message.authorName = article.header.authorName
                            message.postId = article.header.articleId
                            res.render('../views/editor.pug', { user: user, message: message, article: article })
                        } else {
                            res.writeHead(403)
                            res.write("Unauthorized access")
                            res.end()
                        }
                    } else {
                        res.render('../views/404.pug')
                    }
                })

            }
        })
    })
    //save edit
    app.post('/editor/:articleId', isLoggedIn, (req, res) => {
        var nowTime = new Date()
        var articleIdParam = req.params.articleId
        var user = req.user
        var title = req.body.title
        var content = req.body.content
        var authorized = false
        if (userWriteTime.get(user.local.userName)) {
            var lastWriteTime = userWriteTime.get(user.local.userName)
            if (nowTime - lastWriteTime >= 150000) {
                authorized = true
                userWriteTime.set(user.local.userName, nowTime)
            } else {
                res.writeHead(403)
                res.write("Too frequent operations")
                res.end()
            }
        } else {
            authorized = true
            userWriteTime.set(user.local.userName, nowTime)
        }
        if (authorized) {
            Article.findOne({ 'header.articleId': articleIdParam }, (err, article) => {
                if (err) {
                    throw err
                }
                if (article) {
                    if (user.local.userName === article.header.authorName) {
                        storeArticle(article, user, title, content, article => {
                            var id = article.header.articleId
                            res.redirect('/content/' + id)
                            tempArticle.deleteOne({ 'header.authorName': user.local.userName, 'header.derivedFrom': id }, (err, res) => {
                                if (err) {
                                    throw err
                                }
                            })
                        })
                    } else {
                        res.redirect('/')
                    }
                } else {
                    res.redirect('/')
                }
            })
        }
    })

    app.post('/editor/imageUpload', isLoggedIn, (req, res) => {
        var form = new formidable.IncomingForm()
        form.parse(req, (err, fields, files) => {
            var originPath = files.image.path
            var publicPath = path.join(__dirname, "public", "image", files.image.name)
            fs.rename(originPath, publicPath, err => {
                if (err) {
                    throw err;
                }
                res.writeHead(200, { 'Content-Type': 'application/json' })
                res.write('{filePath:/image,fileName:' + files.image.name + '}')
                res.end()
            })
        })
    })
}