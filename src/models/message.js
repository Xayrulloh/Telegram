import { Model, DataTypes } from 'sequelize'

export default async function ({ sequelize }) {
    class Message extends Model {}

    Message.init({

        message_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },

        text: {
            type: DataTypes.TEXT
        },

        img: {
            type: DataTypes.TEXT
        },

        message_updated_at: {
            type: DataTypes.DATE,
            allowNull: true
        },

        message_created_at: {
            type: DataTypes.STRING
        }
    }, {
        tableName: 'messages',
        modelName: 'Message',
        underscored: true,
        updatedAt: 'message_updated_at',
        createdAt: 'message_created_at',
        sequelize
    })
}