const fs = require('fs')

module.exports = app => {
    fs.readdirSync(__dirname).filter(f => f.indexOf('.') !== 0 && f !== 'index.js').map(p => {
        fs.readdirSync(`${__dirname}/${p}`).map(pr => {
            let file = `${__dirname}/${p}/${pr}/index.js`
            if (fs.existsSync(file)) {
                console.log('\x1b[32m%s\x1b[0m', '[ Ok ]', `${p}/${pr}`)
                require(file)(app)
            } else {
                console.log('\x1b[31m%s\x1b[0m', '[ Er ]', `${p}/${pr}`)
            }
        })
    })
}
