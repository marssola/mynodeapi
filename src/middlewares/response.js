module.exports = (req, res, next) => {
    res.success = ({ data }) => {
        return res.status(200).send({ success: true, data })
    }
    
    res.error = (error) => {
        return res.status((error ? 400 : 500)).send({ success: false, error })
    }
    
    return next()
}
