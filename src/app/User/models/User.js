const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: true,
        select: false,
    },
    phone: {
        type: String,
        required: true,
    },
    passwordResetToken: {
        type: String,
        select: false,
    },
    passwordResetExpires: {
        type: Date,
        select: false,
    },
    status: {
        type: Boolean,
        default: false
    },
    activationCode: {
        type: Number,
        select: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
    },
    loggedAt:  {
        type: Date,
    }
})

UserSchema.pre('save', async function (next) {
    if (this.password) {
        const hash = await bcrypt.hash(this.password, 10)
        this.password = hash
    }
    if (this.phone)
        this.phone = this.phone.replace(/\D/g, '')
    this.updatedAt = new Date()
    next()
})

module.exports = mongoose.model('User', UserSchema)
