const express = require('express');
const router = express.Router();
const voteControllerInit = require('../controllers/voteController');

module.exports = (io) => {
    const voteController = voteControllerInit(io);
    router.post('/', voteController.submitVote);
    return router;
};
