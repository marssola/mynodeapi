const path = require('path')
const nodemailer = require('nodemailer')
const hbs = require('nodemailer-express-handlebars')
const { host, port, user, pass } = require('../config/mail')

const transport = nodemailer.createTransport({ service: 'gmail', auth: { user, pass } })

transport.use('compile', hbs({
    viewEngine: {
        extname: '.html',
        partialsDir: 'src/resources/mail',
        layoutsDir: 'src/resources/mail',
        defaultLayout: undefined,
        helpers: undefined,
        compilerOptions: undefined
    },
    viewPath: path.resolve(`${__dirname}/../resources/mail`),
    extName: '.html',
}))

module.exports = transport
