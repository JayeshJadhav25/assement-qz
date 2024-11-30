const request = require('supertest');
const { app } = require('../index'); // Import app
const quizService = require('../services/quizService');
const quizValidation = require('../validation/quizValidation');
const logger = require('../utils/logger');
const { CustomError } = require('../utils');

jest.mock('../services/quizService');
jest.mock('../validation/quizValidation');
jest.mock('../utils/logger');

describe('POST /api/quiz/create', () => {
    let mockCreateQuiz;
    let mockValidate;

    beforeEach(() => {
        mockCreateQuiz = quizService.createQuiz;
        mockValidate = quizValidation.quizSchema.validate;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should create a quiz successfully with valid data', async () => {

        const validQuizData = {
            title: 'Test Quiz',
            questions: [
                { id: 'q1', text: 'What is 2 + 2?', options: [2, 3, 4, 5], correct_option: 4 },
            ],
        };

        mockValidate.mockReturnValue({ error: null });

        const mockQuiz = { id: 'quiz123', ...validQuizData };
        mockCreateQuiz.mockReturnValue(mockQuiz);

        // Make the API request
        const response = await request(app)
            .post('/api/quiz/create')
            .send(validQuizData)
            .expect(201);

        // Check if the response is correct
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Quiz created successfully');
        expect(response.body.quiz_id).toBe(mockQuiz.id);
        expect(mockCreateQuiz).toHaveBeenCalledWith(validQuizData);
    });

    it('should return an error if validation fails', async () => {

        const invalidQuizData = {
            questions: [
                { id: 'q1', text: 'What is 2 + 2?', options: [2, 3, 4], correct_option: 4 },
            ],
        };

        const mockError = {
            details: [{ message: '"title" is required' }],
        };
        mockValidate.mockReturnValue({ error: mockError });

        const response = await request(app)
            .post('/api/quiz/create')
            .send(invalidQuizData)
            .expect(422);

        // Assert: Check if the response contains validation error
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('"title" is required');
    });

    it('should return an error if an internal error occurs', async () => {
        // Valid data
        const validQuizData = {
            title: 'Test Quiz',
            questions: [
                { id: 'q1', text: 'What is 2 + 2?', options: [2, 3, 4], correct_option: 4 },
            ],
        };

        mockValidate.mockReturnValue({ error: null });

        mockCreateQuiz.mockImplementation(() => {
            throw new Error('Internal Server Error');
        });

        const response = await request(app)
            .post('/api/quiz/create')
            .send(validQuizData)
            .expect(500);

        //Check if the response contains the correct error message
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Internal Server Error');
    });
});

describe('GET /api/quiz/id/:id', () => {
    it('should return a quiz successfully', async () => {
        const validQuizData = {
            id: 'quiz123',
            title: 'Test Quiz',
            questions: [
                { id: 'q1', text: 'What is 2 + 2?', options: [2, 3, 4], correct_option: 4 },
            ],
        };

        // Mock the service to return quiz data
        quizService.getQuiz.mockReturnValue(validQuizData);

        const response = await request(app).get('/api/quiz/id/quiz123').expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Quiz fetched successfully');
        expect(response.body.quiz.id).toBe(validQuizData.id);
    });

    it('should return a 404 error if the quiz is not found', async () => {
        // Mock the service to throw a CustomError (simulate quiz not found)
        quizService.getQuiz.mockImplementation(() => {
            throw new CustomError(404, 'Quiz not found');
        });

        const response = await request(app).get('/api/quiz/id/1');

        // Assert the response
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Quiz not found');
    });

});

describe('POST /api/quiz/submit/answer', () => {
    let mockSubmitAnswer;

    beforeEach(() => {
        mockSubmitAnswer = quizService.submitAnswer;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should return an error if quiz is not found', async () => {
        const validAnswerData = {
            user_id: 'user123',
            quiz_id: 'quiz123',
            question_id: 'q1',
            selected_option: 4,
        };

        mockSubmitAnswer.mockImplementation(() => {
            throw new CustomError(404, 'Quiz not found');
        });

        const response = await request(app)
            .post('/api/quiz/submit/answer')
            .send(validAnswerData)
            .expect(404);

        // Check if the response is correct
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Quiz not found');
    });

    it('should return an error if question is not found', async () => {
        const validAnswerData = {
            user_id: 'user123',
            quiz_id: 'quiz123',
            question_id: 'q1',
            selected_option: 4,
        };

        mockSubmitAnswer.mockImplementation(() => {
            throw new CustomError(404, 'Question not found');
        });

        const response = await request(app)
            .post('/api/quiz/submit/answer')
            .send(validAnswerData)
            .expect(404);

        // Check if the response is correct
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Question not found');
    });

    it('should return an error if invalid option is selected', async () => {
        const invalidAnswerData = {
            user_id: 'user123',
            quiz_id: 'quiz123',
            question_id: 'q1',
            selected_option: -1, // Invalid option
        };

        mockSubmitAnswer.mockImplementation(() => {
            throw new CustomError(400, 'Invalid option selected. Please select a correct option.');
        });

        const response = await request(app)
            .post('/api/quiz/submit/answer')
            .send(invalidAnswerData)
            .expect(400);

        // Check if the response is correct
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Invalid option selected. Please select a correct option.');
    });

    it('should return an error if the question is already answered', async () => {
        const answerData = {
            user_id: 'user123',
            quiz_id: 'quiz123',
            question_id: 'q1',
            selected_option: 4,
        };

        mockSubmitAnswer.mockImplementation(() => {
            throw new CustomError(400, 'You have already answered this question');
        });

        const response = await request(app)
            .post('/api/quiz/submit/answer')
            .send(answerData)
            .expect(400);

        // Check if the response is correct
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('You have already answered this question');
    });

    it('should return an error if an internal error occurs', async () => {
        const validAnswerData = {
            user_id: 'user123',
            quiz_id: 'quiz123',
            question_id: 'q1',
            selected_option: 4,
        };

        mockSubmitAnswer.mockImplementation(() => {
            throw new Error('Internal Server Error');
        });

        const response = await request(app)
            .post('/api/quiz/submit/answer')
            .send(validAnswerData)
            .expect(500);

        // Check if the response contains the correct error message
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Internal Server Error');
    });
});


describe('GET /api/quiz/result', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should fetch the quiz result successfully', async () => {
        const quizId = 'quiz123';
        const userId = 'user123';

        const mockResult = {
            user_id: userId,
            quiz_id: quizId,
            score: 10,
            summary: [
                { question_id: 'q1', is_correct: true, correct_option: 4 },
                { question_id: 'q2', is_correct: false, correct_option: 3 },
            ],
        };

        quizValidation.resultSchema.validate.mockReturnValue({ error: null });
        quizService.getResult.mockReturnValue(mockResult);

        // Make the API request
        const response = await request(app)
            .get('/api/quiz/result')
            .query({ quiz_id: quizId, user_id: userId })
            .expect(200);

        // Check if the response is correct
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Result fetched successfully');
        expect(response.body.result).toEqual(mockResult);
    });

    it('should return a validation error if query params are invalid', async () => {
        const invalidQueryParams = { quiz_id: 'quiz123' }; // Missing user_id

        const mockError = {
            details: [{ message: '"user_id" is required' }],
        };
        quizValidation.resultSchema.validate.mockReturnValue({ error: mockError });

        const response = await request(app)
            .get('/api/quiz/result')
            .query(invalidQueryParams)
            .expect(422);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('"user_id" is required');
    });

    it('should return an error if quiz result is not found', async () => {
        const quizId = 'quiz123';
        const userId = 'user123';

        quizValidation.resultSchema.validate.mockReturnValue({ error: null });

        quizService.getResult.mockImplementation(() => {
            throw new CustomError(404, 'No answers found for this user in this quiz');
        });

        const response = await request(app)
            .get('/api/quiz/result')
            .query({ quiz_id: quizId, user_id: userId })
            .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('No answers found for this user in this quiz');
    });

    it('should handle unexpected errors gracefully', async () => {
        const quizId = 'quiz123';
        const userId = 'user123';

        quizValidation.resultSchema.validate.mockReturnValue({ error: null });

        quizService.getResult.mockImplementation(() => {
            throw new Error('Internal Server Error');
        });

        const response = await request(app)
            .get('/api/quiz/result')
            .query({ quiz_id: quizId, user_id: userId })
            .expect(500);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Internal Server Error');
    });
});

