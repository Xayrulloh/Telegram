import { Model, DataTypes } from 'sequelize'

export default async function ({ sequelize }) {
    class User extends Model {}
    
    User.init({

        user_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },

        socket_id: {
            type: DataTypes.STRING
        },

        username: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                len: {
                    args: [2, 50],
                    msg: 'Invalid length for username!'
                }
            }
        },

        user_password: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                len: {
                    args: [4, 50],
                    msg: 'Invalid password!'
                }
            }
        },

        user_img: {
            type: DataTypes.STRING,
            allowNull: false
        },

        is_online: {
            type: DataTypes.BOOLEAN,
            validate: {
                isIn: {
                    args: [[true, false]],
                    msg: 'Invalid value for is_online!'
                }
            }
        }

    }, {
        tableName: 'users',
        modelName: 'User',
        underscored: true,
        updatedAt: 'user_updated_at',
        createdAt: 'user_created_at',
        sequelize
    })
}