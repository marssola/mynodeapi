const mongoose = require('mongoose')
const User = require('../model')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const authConfig = require('../../../../config/auth')
const mailer = require('../../../../modules/mail')

let req = {}
let res = {}

class Users {    
    constructor (_req, _res) {
        req = _req, res = _res
        this.fieldsNotCreated = ['_id', '__v', 'createdAt', 'updatedAt', 'loggedAt', 'passwordResetToken', 'passwordResetExpires', 'status']
        this.fieldsNotUpdated = ['_id', '__v', 'email', 'createdAt', 'updatedAt', 'loggedAt', 'passwordResetToken', 'passwordResetExpires']
    }
    
    static successHandler (data) {
        return res.status(200).send({ success: true, data })
    }
    
    static errorHandler (error) {
        return res.status((error ? 400 : 500)).send({ success: false, error })
    }
    
    async addUser () {
        try {
            if (!req.body.email || !req.body.password || !req.body.name || !req.body.phone)
                return Users.errorHandler(`'email', 'password', 'name' and 'phone' are required`)
            
            if (await User.findOne({ email: req.body.email }))
                return Users.errorHandler('User already exist')
            
            const user = new User({})
            Object.keys(req.body).map(k => this.fieldsNotCreated.indexOf(k) < 0 ? user[k] = req.body[k] : null)
            
            const pinCode = generatePinCode()
            user.activationCode = pinCode
            
            await mailer.sendMail({
                to: req.body.email,
                from: 'mauro.marssola@hotmail.com',
                template: 'auth/active-account',
                context: { pinCode }
            })
            await user.save()
            
            user.password = undefined
            user.updatedAt = undefined
            user.activationCode = undefined
            return Users.successHandler()
        } catch (err) {
            console.log(err)
            return Users.errorHandler(err)
        }
    }
    
    async activeAccount () {
        try {
            if (!req.body.email || !req.body.activationCode)
                return Users.errorHandler(`'email' and 'activationCode' are required`)
            
            let user = await User.findOne({ email: req.body.email }).select("+activationCode")
            if (!user)
                return Users.errorHandler(`User not found`)
            if (!user.activationCode)
                return Users.errorHandler(`Activation code is no longer valid`)
            if (user.activationCode !== (req.body.activationCode))
                return Users.errorHandler(`Activation code is invalid`)
            
            user.status = true
            user.activationCode = undefined
            await user.save()
            
            return Users.successHandler()
        } catch (err) {
            return Users.errorHandler(err)
        }
    }
    
    async resendActivationCode () {
        try {
            if (!req.body.email)
                return Users.errorHandler(`'email' is required`)
            
            let user = await User.findOne({ email: req.body.email }).select("+activationCode")
            if (!user)
                return Users.errorHandler(`User not found`)
            if (user.status)
                return Users.errorHandler(`User account is enabled`)
            
            const pinCode = generatePinCode()
            user.activationCode = pinCode
            
            await mailer.sendMail({
                to: req.body.email,
                from: 'mauro.marssola@hotmail.com',
                template: 'auth/active-account',
                context: { pinCode }
            })
            await user.save()
            
            return Users.successHandler()
        } catch (err) {
            console.log(err)
            return Users.errorHandler(err)
        }
    }
    
    async getUser () {
        try {
            let user = await User.findOne({ _id: req.user._id })
            if (!user)
                return Users.errorHandler('User not found')
            if (!user.status)
                return Users.errorHandler('User not enabled')
            return Users.successHandler({ user })
            
        } catch (err) {
            console.log(err)
            return Users.errorHandler(err)
        }
    }
    
    async updateUser () {
        try {
            if (!Object.keys(req.body).length)
                return Users.errorHandler(`No data received`)
            
            let user = await User.findOne({ _id: req.user._id })
            if (!user)
                return Users.errorHandler(`User not found`)
            if (!user.status)
                return Users.errorHandler('User not enabled')
            Object.keys(req.body).map(k => this.fieldsNotUpdated.indexOf(k) < 0 ? user[k] = req.body[k] : null)
            await user.save()
            
            return Users.successHandler()
        } catch (err) {
            console.log(err)
            return Users.errorHandler(err)
        }
    }
    
    async deleteUser () {
        try {
            let user = await User.findOne({ _id: req.user._id })
            if (!user)
                return Users.errorHandler(`User not found`)
            if (!user.status)
                return Users.errorHandler('User not enabled')
            await user.remove()
            
            return Users.successHandler()
        } catch (err) {
            console.log(err)
            return Users.errorHandler(err)
        }
    }
    
    async login () {
        const bcrypt = require('bcryptjs')
        const user = await User.findOne({email: req.body.email}).select('+password')
        if (!user)
            return Users.errorHandler({ email: 'User not found' })
        if (!user.status)
                return Users.errorHandler('User not enabled')
        if (!await bcrypt.compare(req.body.password, user.password))
            return Users.errorHandler({ password: 'Invalid password' })
        
        user.password = undefined
        await User.updateOne({ _id: user._id }, { $set: { loggedAt: new Date() } })
        
        return Users.successHandler({ token: generateToken({ _id: user._id, email: user.email }) })
    }
    
    async forgotPassword () {
        try {
            if (!req.body.email)
                return Users.errorHandler({ email: `'email' is required` })
            
            const user = await User.findOne({ email: req.body.email })
            if (!user)
                return Users.errorHandler('User not found')
            
            const token = crypto.randomBytes(20).toString('hex')
            const expires = new Date()
            expires.setHours(expires.getHours() + 1)
            
            user.passwordResetToken = token
            user.passwordResetExpires = expires
            await user.save()
            
            await mailer.sendMail({
                to: req.body.email,
                from: 'mauro.marssola@hotmail.com',
                template: 'auth/forgot-password',
                context: { token }
            })
            
            return Users.successHandler()
        } catch (err) {
            console.log(err)
            return Users.errorHandler(err)
        }
    }
    
    async resetPassword () {
        try {
            if (!req.body.email || !req.body.token || !req.body.password)
                return Users.errorHandler(`'email', 'token' and 'password' are required`)
            
            let user = await User.findOne({ email: req.body.email }).select('+passwordResetToken +passwordResetExpires')
            if (!user)
                return Users.errorHandler('User not found')
            if (user.passwordResetToken !== req.body.token)
                return Users.errorHandler('token is invalid')
            if (new Date() > user.passwordResetExpires)
                return Users.errorHandler('token is expired, generate a new one')
            
            user.password = req.body.password
            user.passwordResetToken = undefined
            user.passwordResetExpires = undefined
            await user.save()
            
            return Users.successHandler()
        } catch (err) {
            console.log(err)
            return Users.errorHandler(err)
        }
    }
}

const generateToken = (params) => {
    return jwt.sign({ params }, authConfig.secret, { expiresIn: 86400 })
}

const generatePinCode = () => {
    return parseInt((Math.random() * 99999999999).toFixed().padStart(4, 1).slice(0, 4))
}

module.exports = Users
