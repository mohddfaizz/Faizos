const swaggerJSDoc = require('swagger-jsdoc');  
const swaggerUi = require('swagger-ui-express');  
  
const options = {  
  definition: {  
    openapi: '3.0.0',  
    info: {  
      title: 'Faizos APIs',  
      version: '1.0.0',  
      description: 'This is a Food Delivery System called Faizos API documentation.',  
    },  
  },  
  apis: ['./src/routes/*.js'],   
};  
  
const swaggerSpec = swaggerJSDoc(options);  
  
module.exports = (app) => {  
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));  
};  