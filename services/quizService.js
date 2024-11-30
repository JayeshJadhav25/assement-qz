const { CustomError, logger } = require('../utils');
const { v4: uuidv4 } = require('uuid');

const { quizzes, userAnswers } = require('../models/dataStore');  // Importing in-memory storage


/**
 * Creates a new quiz and stores it in the `quizzes` Map.
 * 
 * @param {object} quizData - The data for the new quiz (title, questions, etc.).
 * @returns {object} - The newly created quiz object with a unique ID.
 */
const createQuiz = (quizData) => {

    const quiz = { id: uuidv4(), ...quizData, };

    quizzes.set(quiz.id, quiz);
    logger.info(`Quiz created with ID: ${quiz.id}`);
    return quiz;
}

/**
 * Fetches a quiz by its ID and removes sensitive information from the response (e.g correct_option).
 *
 * @param {string} quizId - The ID of the quiz to fetch.
 * @returns {object} - The quiz object with the correct options removed.
 * @throws {CustomError} - Throws an error if the quiz is not found.
 */
const getQuiz = (quizId) => {
    const quiz = quizzes.get(quizId);

    // Check if the quiz exists
    if (!quiz) {
        throw new CustomError(404, 'Quiz not found');
    }

    // Remove the correct_option property from each question
    const sanitizedQuiz = {
        ...quiz,
        questions: quiz.questions.map((question) => {
            const { correct_option, ...rest } = question; // Destructure to exclude correct_option
            return rest;
        }),
    };

    return sanitizedQuiz;
};

/**
 * Submits an answer for a specific question in a quiz.
 * 
 * @param {object} data - Object containing the details of the answer submission.
 * @param {string} data.user_id - ID of the user submitting the answer.
 * @param {string} data.quiz_id - ID of the quiz being answered.
 * @param {string} data.question_id - ID of the question being answered.
 * @param {number} data.selected_option - The option selected by the user.
 * @returns {object} - Feedback on whether the answer is correct, the correct option (if incorrect), and the question ID.
 * @throws {CustomError} - Throws an error if:
 *                         - The quiz is not found.
 *                         - The question is not found.
 *                         - The selected option is invalid.
 *                         - The question has already been answered.
 */
const submitAnswer = (data) => {
    const { user_id: userId, quiz_id: quizId, question_id: questionId, selected_option: selectedOption } = data;

    const quiz = quizzes.get(quizId);
    if (!quiz) throw new CustomError(404, 'Quiz not found');

    // Find the specific question within the quiz
    const question = quiz.questions.find((q) => q.id === questionId);
    if (!question) throw new CustomError(404, 'Question not found');

    // Validate that the selectedOption is within the valid range
    if (selectedOption < 0 || selectedOption >= question.options.length + 1) {
        throw new CustomError(400, `Invalid option selected. Please select a correct option.`);
    }

    // Check if the answer is correct
    const isCorrect = question.correct_option === selectedOption;

    const answer = {
        user_id: userId,
        quiz_id: quizId,
        question_id: questionId,
        selected_option: selectedOption,
        is_correct: isCorrect,
    };

    // Generate the unique key for storing the user's answers for the specific quiz
    const userQuizKey = `${userId}-${quizId}`;

    // If no answers exist for this quiz, initialize the storage
    if (!userAnswers.has(userQuizKey)) {
        userAnswers.set(userQuizKey, []);
    }

    // Check if the user has already answered this question
    const existingAnswers = userAnswers.get(userQuizKey);
    const alreadyAnswered = existingAnswers.find(
        (ans) => ans.question_id === questionId
    );

    if (alreadyAnswered) {
        throw new CustomError(400, 'You have already answered this question');
    }

    userAnswers.get(userQuizKey).push(answer);
    console.log('userAnswers', userAnswers)

    console.log('question', question)
    console.log('isCorrect', isCorrect)
    // Return the response object
    return {
        question_id: questionId,
        is_correct: isCorrect,
        correct_option: !isCorrect ? question.correct_option : undefined,
    };
};


/**
 * Fetches the result of a quiz for a specific user.
 *
 * @param {string} quizId - ID of the quiz.
 * @param {string} userId - ID of the user.
 * @returns {object} - Quiz result with user score and answer summary.
 * @throws {CustomError} - Throws an error if answers are not found or if data is inconsistent.
 */
const getResult = (quizId, userId) => {

    const userQuizKey = `${userId}-${quizId}`;
    const answers = userAnswers.get(userQuizKey);

    if (!answers) {
        throw new CustomError(404, 'No answers found for this user in this quiz');
    }

    //find correct answer count
    const score = answers.filter(answer => answer.is_correct).length;

    const summary = answers.map(answer => ({
        question_id: answer.question_id,
        is_correct: answer.is_correct,
        correct_option: quizzes.get(quizId).questions.find(q => q.id === answer.question_id).correct_option,
    }));

    return {
        user_id: userId,
        quiz_id: quizId,
        score,
        summary,
    }
}

module.exports = {
    createQuiz,
    getQuiz,
    submitAnswer,
    getResult
}

