const express = require('express')
const router = express.Router()
const auth = require('../../../middlewares/auth')

router.get('/', async (req, res) => {
    return res.status(200).send({ ok: true })
})

module.exports = app => app.use('/V1/test', router)
