if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

const express = require('express');
const ejsMate = require('ejs-mate');
const path = require('path');
const mongoose = require('mongoose');
const ExpressError = require('./utils/ExpressError');
const catchAsync = require('./utils/catchAsync');
const { movieSchema } = require('./schemas.js');
const Movie = require('./models/movies');
const User = require('./models/users');
const methodOverride = require('method-override');
const session = require('express-session');
const { validateMovie, isLoggedIn } = require('./utils/middleware');
const dbUrl = 'mongodb://localhost:27017/movieNights';
const MongoStore = require('connect-mongo');
// const dbUrl = process.env.DB;


const movieRoutes = require('./routes/movie');

const app = express();

mongoose.connect(dbUrl, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false
}).then(() => {
    console.log('Connection to mongo open!');
}).catch((err) => {
    console.log('There was an error');
    console.log(err);
});

app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto: { secret: process.env.SECRET },
    touchAfter: 24 * 3600

});

const sessionConfig = {
    store,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
};

app.use(session(sessionConfig));

app.use((req, res, next) => {
    if (!req.session.user_id) {
        req.session.user_id = null;
        res.locals.user = req.session.user_id;
        res.locals.admin = process.env.ADMIN;
        next();
    } else {
        res.locals.user = req.session.user_id;
        res.locals.admin = process.env.ADMIN;
        next();
    }

});

app.use('/movie', movieRoutes);

app.get('/', isLoggedIn, catchAsync(async (req, res, next) => {
    const featuredMovies = await Movie.find({ isFeatured: 'on' })
    const voted = req.session.voted;
    const user = req.session.user_id;
    res.render('home', { featuredMovies, voted, user })

}));

app.get('/login', (req, res) => {
    res.render('login')
});

app.post('/login', catchAsync(async (req, res, next) => {
    const { username, password } = req.body.user;
    const foundUser = await User.findAndValidate(username, password);
    if (foundUser) {
        req.session.user_id = foundUser._id;
        res.redirect('/');
    } else {
        return res.redirect('/login');
    }

}));

app.get('/logout', (req, res) => {
    req.session.user_id = null;
    res.redirect('/login');
});

app.all('*', (req, res, next) => {
    next(new ExpressError('Page Not Found', 404))
});

app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = 'Something Went Wrong!'
    res.status(statusCode).render('error', { err });
});

app.listen(3000, () => {
    console.log('Listening on port 3000!')
});

