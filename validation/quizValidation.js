const Joi = require('joi');

// Quiz Schema
const quizSchema = Joi.object({
    title: Joi.string().required(),
    questions: Joi.array()
        .items(
            Joi.object({
                id: Joi.string().required(),
                text: Joi.string().required(),
                options: Joi.array().items(Joi.string()).length(4).required(),
                correct_option: Joi.number().integer().required(),
            }).custom((question, helpers) => {
                // Ensure correct_option is within the range of the options
                if (
                    question.correct_option <= 0 ||
                    question.correct_option >= question.options.length + 1
                ) {
                    return helpers.error('custom.correctOption', { id: question.id });
                }
                return question;
            })
        )
        .required()
        .custom((questions, helpers) => {
            // Check for unique IDs across all questions
            const ids = questions.map((q) => q.id);
            const uniqueIds = new Set(ids);
            if (uniqueIds.size !== ids.length) {
                return helpers.error('custom.uniqueId');
            }
            return questions;
        }),
})
    .messages({
        'custom.uniqueId': 'Each question must have a unique ID.', // Error for duplicate question IDs
        'custom.correctOption': 'Invalid correct option for question with ID "{#id}". It should be within the range of available options. Starting from one(1)', // Error for out-of-range correct_option
    });



// Answer Schema
const answerSchema = Joi.object({
    user_id: Joi.string().required(),
    question_id: Joi.string().required(),
    quiz_id: Joi.string().required(),
    selected_option: Joi.number().integer().min(1).required(), // Ensures selected_option is greater than 0
}).messages({
    'number.min': 'The selected option must be greater than 0.', // Custom error message for invalid options
});

// Result Schema
const resultSchema = Joi.object({
    quiz_id: Joi.string().required(),
    user_id: Joi.string().required(),
});

module.exports = { quizSchema, answerSchema, resultSchema };
