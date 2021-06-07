const express = require('express');
const router = express.Router();
const { validateMovie, isLoggedIn, isAdmin } = require('../utils/middleware');
const catchAsync = require('../utils/catchAsync');
const Movie = require('../models/movies');


router.get('/add', isLoggedIn, isAdmin, (req, res) => {
    res.render('movies/new')
});
router.post('/add', isLoggedIn, isAdmin, validateMovie, catchAsync(async (req, res, next) => {
    const movie = new Movie(req.body.movie);
    await movie.save();
    res.redirect('/movie/add')
}));
router.get('/watched', isLoggedIn, catchAsync(async (req, res, next) => {
    const watchedMovies = await Movie.find({ watched: true });
    res.render('movies/watched', { watchedMovies });

}));
router.post('/vote', isLoggedIn, catchAsync(async (req, res, next) => {
    const { id } = req.body.movie;
    await Movie.addVote(id);
    req.session.voted = true;
    res.redirect('/');
}));
router.put('/:id', isLoggedIn, isAdmin, validateMovie, catchAsync(async (req, res, next) => {
    const movie = await Movie.findByIdAndUpdate(req.params.id, { ...req.body.movie });
    res.redirect('/');
}));
router.get('/:id/edit', isLoggedIn, isAdmin, catchAsync(async (req, res, next) => {
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
        return res.redirect('/');
    }
    res.render('movies/edit', { movie })
}));



module.exports = router;

