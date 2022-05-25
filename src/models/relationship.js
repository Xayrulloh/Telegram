import { Model, DataTypes } from 'sequelize'

export default async function ({ sequelize }) {
    const User = sequelize.models.User
    const Message = sequelize.models.Message

    User.hasMany(Message, {
        constraints: false,
        foreignKey: 'who'
    })

    User.hasMany(Message, {
        constraints: false,
        foreignKey: 'to_whom'
    })
}