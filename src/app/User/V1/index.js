const express = require('express')
const router = express.Router()
const auth = require('../../../middlewares/auth')
const response = require('../../../middlewares/response')

const UserController = require('./controllers/User')

router.use(response)

router.post('/', async (req, res) => (new UserController(req, res)).addUser())

router.post('/active', async (req, res) => (new UserController(req, res)).activeAccount())

router.post('/resend-activation-code', async (req, res) => (new UserController(req, res)).resendActivationCode())

router.get('/', auth, (req, res) => (new UserController(req, res)).getUser())

router.put('/', auth, async (req, res) => (new UserController(req, res)).updateUser())

router.delete('/', auth, async (req, res) => (new UserController(req, res)).deleteUser())

router.post('/login', async (req, res) => (new UserController(req, res)).login())

router.post('/forgot-password', async (req, res) => (new UserController(req, res)).forgotPassword())

router.post('/reset-password', async (req, res) => (new UserController(req, res)).resetPassword())

module.exports = app => app.use('/V1/user', router)
