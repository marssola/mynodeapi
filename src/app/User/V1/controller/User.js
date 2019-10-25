const mongoose = require('mongoose')
const User = require('../model')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const authConfig = require('../../../../config/auth')
const mailer = require('../../../../modules/mail')
const bcrypt = require('bcryptjs')

let req = {}
let res = {}

class Users {    
    constructor (_req, _res) {
        req = _req, res = _res
        this.fieldsNotCreated = ['_id', '__v', 'createdAt', 'updatedAt', 'loggedAt', 'passwordResetToken', 'passwordResetExpires', 'status', 'activationCode']
        this.fieldsNotUpdated = ['_id', '__v', 'email', 'createdAt', 'updatedAt', 'loggedAt', 'passwordResetToken', 'passwordResetExpires', 'activationCode']
    }

    async addUser () {
        try {
            let { name, phone, email, password } = req.body
            if (!name || !phone || !email || !password)
                return res.error(`'email', 'password', 'name' and 'phone' are required`)
            
            if (await User.findOne({ email }))
                return res.error('User already exist')
            
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
            
            return res.success({ message: 'User created' })
        } catch (err) {
            console.log(err)
            return res.error(err)
        }
    }
    
    async activeAccount () {
        try {
            let { email, activationCode } = req.body
            if (!email || !activationCode)
                return res.error(`'email' and 'activationCode' are required`)
            
            let user = await User.findOne({ email }).select("+activationCode")
            if (!user)
                return res.error(`User not found`)
            if (!user.activationCode)
                return res.error(`Activation code is no longer valid`)
            if (user.activationCode !== activationCode)
                return res.error(`Activation code is invalid`)
            
            user.status = true
            user.activationCode = undefined
            await user.save()
            
            return res.success({ message: `User successfully activated` })
        } catch (err) {
            return res.error(err)
        }
    }
    
    async resendActivationCode () {
        try {
            let { email } = req.body
            if (!email)
                return res.error(`'email' is required`)
            
            let user = await User.findOne({ email })
            if (!user)
                return res.error(`User not found`)
            if (user.status)
                return res.error(`User account is already active`)
            const pinCode = generatePinCode()
            user.activationCode = pinCode
            
            await mailer.sendMail({
                to: email,
                from: 'mauro.marssola@hotmail.com',
                template: 'auth/active-account',
                context: { pinCode }
            })
            await user.save()
            
            return res.success({ message: `Activation code sent successfully` })
        } catch (err) {
            console.log(err)
            return res.error(err)
        }
    }
    
    async getUser () {
        try {
            let { _id } = req.user
            let data = await User.findOne({ _id })
            if (!data)
                return res.error('User not found')
            if (!data.status)
                return res.error('User account is not active')
            return res.success(data)
            
        } catch (err) {
            console.log(err)
            return res.error(err)
        }
    }
    
    async updateUser () {
        try {
            if (!Object.keys(req.body).length)
                return res.error(`No data received`)
            
            let { _id } = req.user
            let user = await User.findOne({ _id })
            if (!user)
                return res.error(`User not found`)
            if (!user.status)
                return res.error('User account is not active')
            Object.keys(req.body).map(k => this.fieldsNotUpdated.indexOf(k) < 0 ? user[k] = req.body[k] : null)
            await user.save()
            
            return res.success({ message: `User data updated successfully` })
        } catch (err) {
            console.log(err)
            return res.error(err)
        }
    }
    
    async deleteUser () {
        try {
            let { _id } = req.user
            let user = await User.findOne({ _id })
            if (!user)
                return res.error(`User not found`)
            if (!user.status)
                return res.error('User account is not active')
            await user.remove()
            
            return res.success({ message: `User account has been deleted successfully` })
        } catch (err) {
            console.log(err)
            return res.error(err)
        }
    }
    
    async login () {
        let { email, password } = req.body
        const user = await User.findOne({ email }).select('+password')
        if (!user)
            return res.error({ email: 'User not found' })
        if (!user.status)
                return res.error('User account is not active')
        if (!await bcrypt.compare(password, user.password))
            return res.error({ password: 'Invalid password' })
        
        user.password = undefined
        await User.updateOne({ _id: user._id }, { $set: { loggedAt: new Date() } })
        
        let data = { token: generateToken({ _id: user._id, email: user.email }) }
        return res.success({ data })
    }
    
    async forgotPassword () {
        try {
            let { email } = req.body
            if (!email)
                return res.error({ email: `'email' is required` })
            
            const user = await User.findOne({ email })
            if (!user)
                return res.error('User not found')
            
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
            
            return res.success({ message: `The code to recover your password was successfully sent to your email` })
        } catch (err) {
            console.log(err)
            return res.error(err)
        }
    }
    
    async resetPassword () {
        try {
            let { email, token, password } = req.body
            if (!email || !token || !password)
                return res.error(`'email', 'token' and 'password' are required`)
            
            let user = await User.findOne({ email }).select('+passwordResetToken +passwordResetExpires')
            if (!user)
                return res.error('User not found')
            if (user.passwordResetToken !== token)
                return res.error('Token is invalid')
            if (new Date() > user.passwordResetExpires)
                return res.error('Token is expired, generate a new one')
            
            user.password = password
            user.passwordResetToken = undefined
            user.passwordResetExpires = undefined
            await user.save()
            
            return res.success({ message: `Your password has been changed successfully` })
        } catch (err) {
            console.log(err)
            return res.error(err)
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
