const { movieSchema } = require('../schemas.js');
const ExpressError = require('../utils/ExpressError');


module.exports.validateMovie = (req, res, next) => {
    const { error } = movieSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    } else {
        next();
    }
};

module.exports.isLoggedIn = (req, res, next) => {
    if (!req.session.user_id) {
        return res.redirect('/login')
    }
    next();
};

module.exports.isAdmin = (req, res, next) => {
    if (req.session.user_id === process.env.ADMIN) {
        next();
    } else if (req.session.user_id !== process.env.ADMIN) {
        res.redirect('/');
    }
};