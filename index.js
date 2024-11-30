const express = require('express');
const swaggerUi = require('swagger-ui-express');
const { quizRoutes } = require('./routes');
const YAML = require('yamljs');
const path = require('path');
const errorHandler = require('./middleware/errorHandler');

require('dotenv').config(); // Load .env file


const app = express();

// Middleware
app.use(express.json());

//Api Routes
app.use('/api/quiz', quizRoutes);


const swaggerDocument = YAML.load(path.join(__dirname, '.', 'docs', 'swagger.yaml'));

// Serve Swagger UI at /api-docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));


// Error handling
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Export the app for testing purposes
module.exports = { app }