import path from 'path'
import JWT from 'jsonwebtoken'
import { Op } from 'sequelize'
import md5 from 'md5'

const reg = async (req, res, next) => {
    try {
        const { username, password } = req.body, { image } = req.files
        
        image.mv(path.join(process.cwd(), 'public', 'images', image.name))

        let newUser = await req.models.User.create({
            username,
            user_password: md5(password),
            user_img: image.name,
            is_online: true,
        })
        
        return res.json({
            status: 200,
            message: 'The user added!',
            token: JWT.sign({user_id: newUser.user_id}, 'password')
        })
        
    } catch (error) {
        if (error.message == 'Validation error') res.json({status: 400, message: 'This username is taken'})
        next(error.message)
    }
}

const log = async (req, res, next) => {
    try {
        const { username, password } = req.body
        
        const user = await req.models.User.findOne({ where: { username, user_password: md5(password) } })

        if (user) {
            const updatedData = await req.models.User.update({ is_online: true }, {where: { username, user_password: password }})
            
            return res.json({
                status: 200,
                message: 'The user added!',
                token: JWT.sign({user_id: user.dataValues.user_id}, 'password')
            })
        } else {
            return res.json({
                status: 400,
                message: 'The user not found'
            })
        }
        
        
    } catch (error) {
        if (error.message == 'Validation error') res.json({status: 400, message: 'This username is taken'})
        next(error.message)
    }
}

const friends = async (req, res, next) => {
    try {
        const { userId, value } = req.body
        
        let users = await req.models.User.findAll()
        let chateds = []
        
        users = users.filter(el => el.dataValues.user_id != userId)

        let messages = await req.models.Message.findAll({ where:{ [Op.or]:{ who: userId, to_whom: userId } } })

        for (let el of messages) {
            if (el.dataValues.who != userId) {
                chateds.push(users.find(user => user.user_id == el.dataValues.who && user.username.toLowerCase().includes(value.toLowerCase())))
            } else chateds.push(users.find(user => user.user_id == el.dataValues.to_whom && user.username.toLowerCase().includes(value.toLowerCase())))
        }

        chateds = chateds.map(el => el?.dataValues)

        chateds = [...new Set(chateds)]
        
        return res.json({
            status: 200,
            message: 'The user added!',
            friends: chateds
        })
        
    } catch (error) {
        next(error.message)
    }
}

const messages = async (req, res, next) => {
    try {
        const { userId, friendId } = req.body
        
        let messages = await req.models.Message.findAll({
            where:{
                [Op.or]: [{ [Op.and]: [{ who: userId }, { to_whom: friendId }] }, { [Op.and]: [{ who: friendId }, { to_whom: userId }] }]
            },
            order: [
                ['message_created_at', 'ASC']
            ],
        })

        messages = messages.map(el => el?.dataValues)
        
        return res.json({
            status: 200,
            messages,
        })

    } catch (error) {
        next(error.message)
    }
}

const upload = async (req, res, next) => {
    try {
        const { image } = req.files
        
        image.mv(path.join(process.cwd(), 'public', 'images', image.name))
        
        return res.json({
            status: 200,
            name: image.name
        })
        
    } catch (error) {
        next(error.message)
    }
}

export default {
    reg,
    log,
    friends,
    messages,
    upload
}