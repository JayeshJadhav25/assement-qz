const express = require('express');
const router = express.Router();
const { quizController } = require('../controllers');

//create quiz
router.post('/create', quizController.createQuiz);

// get a quiz by ID
router.get('/id/:id', quizController.getQuizById);

// Submit an answer for a quiz question
router.post('/submit/answer', quizController.submitAnswer);

// Get results for a quiz
router.get('/result', quizController.quizResult);


module.exports = router;
