import express from 'express'
import { Server } from "socket.io"
import { createServer } from "http"
import database from './utils/db.js'
import Router from './routes/index.js'
import fileUpload from 'express-fileupload'
import JWT from 'jsonwebtoken'
import { Op } from 'sequelize'

process.env.PORT = process.env.PORT || 5000

!async function () {
    const app = express()
    
    // binding socket
    const httpServer = createServer(app)
    const io = new Server(httpServer)
    
    // connect to database
    const db = await database()
    
    // add db to routers
    app.use((req, res, next) => {
        req.models = db.models
        req.sequelize = db
        next()
    })
    
    // middlewares
    app.use(express.json())
    app.use(express.urlencoded({extended: true}))
    app.use(fileUpload())
    
    // static
    app.use(express.static('public'))
    
    // routers
    app.use(Router)
    
    // io
    io.on('connection', (socket) => {
        socket.on('started', async({ token }) => {
            try {
                let userId = JWT.verify(token, 'password').user_id
                
                const user = await db.models.User.findOne({ where: { user_id: userId } })
                
                if (user) {
                    const updatedData = await db.models.User.update({ socket_id: socket.id, is_online: true }, {where: { user_id: userId }})
                    socket.emit('userInfo', { username: user.dataValues.username, userImg: user.dataValues.user_img, user_id: user.dataValues.user_id })
                    socket.broadcast.emit('friends')
                    
                    let users = await db.models.User.findAll()
                    let chateds = []
                    
                    users = users.filter(el => el.dataValues.user_id != user.dataValues.user_id)
                    
                    let messages = await db.models.Message.findAll({
                        where:{
                            [Op.or]:{
                                who: userId,
                                to_whom: userId
                            }
                        }
                    })
                    
                    for (let el of messages) {
                        if (el.dataValues.who != userId) {
                            chateds.push(users.find(user => user.user_id == el.dataValues.who))
                        } else chateds.push(users.find(user => user.user_id == el.dataValues.to_whom))
                    }
                    
                    chateds = chateds.map(el => el.dataValues)
                    chateds = [...new Set(chateds)]
                    
                    socket.emit('friends')
                    
                } else {
                    socket.emit('error', { error: 'invalid token' })
                }
                
            } catch (error) {
                socket.emit('error', { error: error.message })
            }
        })
        
        socket.on('textSended', async({ userId, friendId, text, time }) => {
            let newMessage = await db.models.Message.create({
                text,
                message_created_at: time,
                who: userId,
                to_whom: friendId
            })
            
            const friend = await db.models.User.findOne({ where: { user_id: friendId } })
            io.to(friend.dataValues.socket_id).emit('replaceFriends', newMessage.dataValues)
        })
        
        socket.on('imgSended', async({ userId, friendId, img, time }) => {
            let newMessage = await db.models.Message.create({
                img,
                message_created_at: time,
                who: userId,
                to_whom: friendId
            })
            
            const friend = await db.models.User.findOne({ where: { user_id: friendId } })
            io.to(friend.dataValues.socket_id).emit('replaceFriends', newMessage.dataValues)
        })
        
        socket.on('disconnect', async() => {
            const updatedData = await db.models.User.update({ is_online: false, }, { where: { socket_id: socket.id } })
            
            socket.broadcast.emit('friends')
        })
        
        socket.on('deleteChat', async({ friendId, userId }) => {
            let messages = await db.models.Message.destroy({
                where:{
                    [Op.or]: [{ [Op.and]: [{ who: userId }, { to_whom: friendId }] }, { [Op.and]: [{ who: friendId }, { to_whom: userId }] }]
                }
            })
            
            const friend = await db.models.User.findOne({ where: { user_id: friendId } })
            socket.emit('chatCleared', { friendId })
            io.to(friend.dataValues.socket_id).emit('chatCleared', { friendId: userId })
            
            
            
        })
        
        socket.on('deleteUser', async({ userId }) => {
            let user = await db.models.User.destroy({
                where: { user_id: userId }
            })
            let messages = await db.models.Message.destroy({
                where:{
                    [Op.or]: [{ who: userId }, { to_whom: userId }]
                }
            })
            
            io.emit('userCleared', { userId })
            
        })
    })
    
    // listening
    httpServer.listen(process.env.PORT, () => console.log('http://192.168.1.84:' + process.env.PORT))
}()