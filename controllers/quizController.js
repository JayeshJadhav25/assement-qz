const { quizService } = require('../services');
const { CustomError } = require('../utils');
const { quizValidation } = require('../validation')


/**
 * Controller to handle the creation of a new quiz.
 * 
 * @route POST api/quiz/create
 * @body {string} title - The title of the quiz.
 * @body {array} questions - An array of questions, each containing `id`, `text`, `options`, and `correct_option`.
 * @returns {object} - Success message and the created quiz ID.
 */
const createQuiz = (req, res, next) => {
    try {
        // Validate the incoming request body against the schema
        const { error } = quizValidation.quizSchema.validate(req.body);

        if (error) {
            // Throw a 422 error if validation fails
            throw new CustomError(422, error.details[0].message);
        };

        // Pass validated data to the service layer
        const quiz = quizService.createQuiz(req.body);

        return res.status(201).json({
            success: true,
            message: "Quiz created successfully",
            quiz_id: quiz.id
        });

    } catch (error) {
        // Pass errors to the error-handling middleware

        next(error);
    }
};

/**
 * Controller to fetch a quiz by its ID.
 *
 * @route GET api/quiz/id/:id
 * @param {string} req.params.id - The ID of the quiz to fetch.
 * @returns {object} - The quiz details information (correct answers removed).
 * @throws {CustomError} - Throws an error if the quiz is not found.
 */
const getQuizById = (req, res, next) => {
    try {
        const quiz = quizService.getQuiz(req.params.id);

        return res.status(200).json({
            success: true,
            message: "Quiz fetched successfully",
            quiz: quiz
        });

    } catch (error) {
        // Pass errors to the error-handling middleware
        next(error);
    }
}

/**
 * Handles the request to submit an answer for a quiz.
 * 
 * @route POST api/quiz/submit/answer
 * @body {string} user_id - The ID of the user submitting the answer.
 * @body {string} quiz_id - The ID of the quiz.
 * @body {string} question_id  - The question ID 
 * @body {string} selected_option  - The selected option
 * @throws {CustomError} Throws an error when validation fails or submission logic encounters an issue.
 * @returns {object} - Feedback on whether the answer was correct and, if incorrect, the correct.
 */
const submitAnswer = (req, res, next) => {
    try {

        // Validate the incoming request body against the schema
        const { error } = quizValidation.answerSchema.validate(req.body);

        if (error) {
            // Throw a 422 error if validation fails
            throw new CustomError(422, error.details[0].message);
        };

        const result = quizService.submitAnswer(req.body);

        res.status(200).json({
            success: true,
            message: "Answer submitted successfully",
            result: result
        });

    } catch (error) {
        // Pass errors to the error-handling middleware
        next(error);
    }
};


/**
 * Controller to fetch the result of a quiz for a specific user.
 *
 * @route GET api/quiz/result
 * @query {string} quiz_id - ID of the quiz.
 * @query {string} user_id - ID of the user.
 * @returns {object} - Returns the quiz result, including the score and summary of answers.
 * @throws {CustomError} - Throws validation or fetching errors.
 */

const quizResult = (req, res, next) => {
    try {
        // Validate the incoming request body against the schema
        const { error } = quizValidation.resultSchema.validate(req.query);

        if (error) {
            // Throw a 422 error if validation fails
            throw new CustomError(422, error.details[0].message);
        };

        const { quiz_id: quizId, user_id: userId } = req.query;

        const result = quizService.getResult(quizId, userId);

        return res.status(200).json({
            success: true,
            message: "Result fetched successfully",
            result: result
        });

    } catch (error) {
        // Pass errors to the error-handling middleware
        next(error);
    }
}

module.exports = {
    createQuiz,
    getQuizById,
    submitAnswer,
    quizResult
}

