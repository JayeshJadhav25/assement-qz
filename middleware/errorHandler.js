
const { CustomError, logger } = require("../utils")

const errorHandler = (err, req, res, next) => {
    if (err instanceof CustomError) {
        // Custom error with a status code
        return res.status(err.statusCode).json({
            success: false,
            message: err.message
        });
    }

    // General error handling
    logger.error(`Unhandled Error:`, err);
    return res.status(500).json({
        success: false,
        message: 'Internal Server Error',
    });
}

module.exports = errorHandler;
