import { Sequelize } from "sequelize"
import models from '../models/index.js'

const sequelize = new Sequelize({
    dialect: 'postgres',
    username: 'umid',
    host: 'localhost',
    port: 5432,
    database: 'look',
    logging: false
})

export default async function() {
    try {
        sequelize.authenticate()
        console.log('db connected...')

        // load models
        await models({ sequelize })
        console.log('models are loaded!')

        await sequelize.sync({ alter: true })
        console.log('models are syncronized!')

        return sequelize
    } catch (error) {
        console.log(error)
        console.log('db did not connect!') 
    }

}