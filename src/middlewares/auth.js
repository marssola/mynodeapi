const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const authConfig = require('../config/auth.json')

module.exports = (req, res, next) => {
    const authHeader = req.headers.authorization
    if (!authHeader)
        return res.status(401).send({ success: false, error: 'No token provided' })
    
    const parts = authHeader.split(' ')
    if (parts.length !== 2)
        return res.status(401).send({ success: false, error: 'Token error' })
    const [scheme, token] = parts
    if (!/^Bearer$/i.test(scheme))
        return res.status(401).send({ success: false, error: 'Token malformatted' })
    
    jwt.verify(token, authConfig.secret, (err, decoded) => {
        if (err)
            return res.status(401).send({ success: false, error: 'Token invalid' })
        
        decoded.params._id = new mongoose.Types.ObjectId(decoded.params._id)
        req.user = decoded.params
        return next()
    })
}
