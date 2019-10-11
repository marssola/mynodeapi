module.exports = {
    env: process.env.ENV ||  'production',
    port: process.env.PORT || '3000'
}

if (process.env.ENV === 'local')
    process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0'
