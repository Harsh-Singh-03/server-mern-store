const jwt = require('jsonwebtoken');
const ErrorHandler = require('../Error/ErrorHandling');
const AsyncError = require('../Error/AsyncError');
require('dotenv/config')
const JWT_SECRET = process.env.JWT_SIGN;

const fetchUser = AsyncError((req, res, next) => {
    const { AuthToken } = req.cookies;
    if (!AuthToken) {
        return next(new ErrorHandler("Token Expired", 404))
    }
    const data = jwt.verify(AuthToken, JWT_SECRET)
    if(!data){
        return next(new ErrorHandler('Invalid Token', 400))
    }
    req.user = data.user;
    next()
})

module.exports = fetchUser;