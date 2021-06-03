const Joi = require('joi');
const { number } = require('joi');

module.exports.movieSchema = Joi.object({
    movie: Joi.object({
        name: Joi.string().required(),
        image: Joi.string().required(),
        genre: Joi.string().required(),
        description: Joi.string(),
        trailer: Joi.string().required(),
        isFeatured: Joi.string(),
        watched: Joi.boolean(),
        votes: Joi.number()
    }).required()
});