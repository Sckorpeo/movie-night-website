const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const movieSchema = new Schema({
    name: String,
    votes: {
        type: Number,
        default: 0
    },
    image: String,
    genre: String,
    description: String,
    isFeatured: {
        type: String,
        default: 'off',
    },
    trailer: String,
    watched: {
        type: Boolean,
        default: false
    }
});

movieSchema.statics.addVote = async function (id) {
    const updatedMovie = await this.findOneAndUpdate({ _id: id }, { $inc: { votes: 1 } });
};

module.exports = mongoose.model("Movie", movieSchema);