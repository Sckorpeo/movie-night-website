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

const app = express();

mongoose.connect('mongodb://localhost:27017/movieNights', {
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



const sessionConfig = {
    secret: 'thisshouldbeabettersecret!',
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
        next();
    } else {
        res.locals.user = req.session.user_id;
        next();
    }

});

const validateMovie = (req, res, next) => {
    const { error } = movieSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    } else {
        next();
    }
};

const isLoggedIn = (req, res, next) => {
    if (!req.session.user_id) {
        return res.redirect('/login')
    }
    next();
};



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
app.get('/movie/add', isLoggedIn, (req, res) => {
    res.render('movies/new')
});
app.post('/movie/add', isLoggedIn, validateMovie, catchAsync(async (req, res, next) => {
    const movie = new Movie(req.body.movie);
    await movie.save();
    res.redirect('/movie/add')
}));
app.get('/movie/watched', isLoggedIn, catchAsync(async (req, res, next) => {
    const watchedMovies = await Movie.find({ watched: true });
    res.render('movies/watched', { watchedMovies });

}));
app.post('/movie/vote', isLoggedIn, catchAsync(async (req, res, next) => {
    const { id } = req.body.movie;
    await Movie.addVote(id);
    req.session.voted = true;
    res.redirect('/');
}));
app.put('/movie/:id', isLoggedIn, validateMovie, catchAsync(async (req, res, next) => {
    const movie = await Movie.findByIdAndUpdate(req.params.id, { ...req.body.movie });
    res.redirect('/');
}));
app.get('/movie/:id/edit', isLoggedIn, catchAsync(async (req, res, next) => {
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
        return res.redirect('/');
    }
    res.render('movies/edit', { movie })
}));




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

