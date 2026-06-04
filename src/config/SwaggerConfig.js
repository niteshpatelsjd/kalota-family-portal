const swaggerJSDoc = require("swagger-jsdoc");

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Kalota Family Portal",
      version: "1.0.0",
      description: "API documentation for Kalota Family Portal Backend Service",
    },
    servers: [
      {
        url: "http://localhost:7000",
        description: "Local server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [
    "./src/routes/AdminUserRoute.js",
    "./src/routes/RoleRoute.js",
    "./src/routes/ModuleRoute.js",
    "./src/routes/LocationRoute.js",
    "./src/routes/FamilyRoute.js",
    "./src/routes/MemberRoute.js",
    "./src/routes/MemberAdminRoute.js",
    "./src/controllers/AdminUserController.js",
    "./src/controllers/ModuleController.js",
    "./src/controllers/RoleController.js",
  ],
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

module.exports = swaggerSpec;
