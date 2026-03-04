// src/config/swagger.js
import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "OGCS CRM API",
      version: "1.0.0",
      description:
        "Complete CRM system for managing leads, quotes, communications, and team activities",
      contact: {
        name: "OGCS Support",
        email: "support@ogcs.co.in",
      },
    },
    servers: [
      {
        url: process.env.SERVER_URL || "http://localhost:3181",
        description: "Development server",
      },
      {
        url: "https://api.crm.ogcs.co.in",
        description: "Production server",
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
      schemas: {
        User: {
          type: "object",
          properties: {
            _id: { type: "string" },
            name: { type: "string" },
            email: { type: "string" },
            role: { type: "string", enum: ["admin", "sales"] },
            isActive: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Lead: {
          type: "object",
          properties: {
            _id: { type: "string" },
            name: { type: "string" },
            email: { type: "string" },
            phone: { type: "string" },
            company: { type: "string" },
            leadType: {
              type: "string",
              enum: ["Buyer", "Contractor", "Seller", "Manufacturer"],
            },
            status: {
              type: "string",
              enum: ["New", "In Progress", "Qualified", "Proposal", "Closed"],
            },
            owner: { type: "string" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Quote: {
          type: "object",
          properties: {
            _id: { type: "string" },
            leadId: { type: "string" },
            amount: { type: "number" },
            description: { type: "string" },
            status: {
              type: "string",
              enum: ["Draft", "Sent", "Accepted", "Rejected"],
            },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Error: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            message: { type: "string" },
            errors: {
              type: "array",
              items: { type: "object" },
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./src/routes/*.js"],
};

export const specs = swaggerJsdoc(options);
