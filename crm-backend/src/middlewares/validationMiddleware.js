// src/middlewares/validationMiddleware.js
import { validationResult, body, param, query } from "express-validator";
import logger from "../config/logger.js";

// Validation error handler
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn("Validation errors", { errors: errors.array() });
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((err) => ({
        field: err.param,
        message: err.msg,
      })),
    });
  }
  next();
};

// Auth validation
export const validateLogin = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email is required"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  handleValidationErrors,
];

export const validateRegister = [
  body("name")
    .trim()
    .isLength({ min: 2 })
    .withMessage("Name must be at least 2 characters"),
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email is required"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("role")
    .isIn(["admin", "sales"])
    .withMessage("Role must be admin or sales"),
  handleValidationErrors,
];

// Lead validation
export const validateCreateLead = [
  body("name")
    .trim()
    .isLength({ min: 2 })
    .withMessage("Name must be at least 2 characters"),
  body("email")
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email is required"),
  body("phone")
    .optional()
    .matches(/^[0-9]{10,}$/)
    .withMessage("Valid phone number is required"),
  body("leadType")
    .optional()
    .isIn(["Buyer", "Contractor", "Seller", "Manufacturer"])
    .withMessage("Invalid lead type"),
  body("city")
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage("City must be at least 2 characters"),
  handleValidationErrors,
];

export const validateUpdateLead = [
  param("id")
    .isMongoId()
    .withMessage("Invalid lead ID"),
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage("Name must be at least 2 characters"),
  body("email")
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email is required"),
  body("phone")
    .optional()
    .matches(/^[0-9]{10,}$/)
    .withMessage("Valid phone number is required"),
  body("status")
    .optional()
    .isIn(["New", "In Progress", "Qualified", "Proposal", "Closed"])
    .withMessage("Invalid status"),
  handleValidationErrors,
];

// Quote validation
export const validateCreateQuote = [
  body("leadId")
    .isMongoId()
    .withMessage("Invalid lead ID"),
  body("amount")
    .isFloat({ min: 0 })
    .withMessage("Amount must be a positive number"),
  body("description")
    .optional()
    .trim()
    .isLength({ min: 5 })
    .withMessage("Description must be at least 5 characters"),
  handleValidationErrors,
];

// User validation
export const validateUpdateUser = [
  param("id")
    .isMongoId()
    .withMessage("Invalid user ID"),
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage("Name must be at least 2 characters"),
  body("email")
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email is required"),
  handleValidationErrors,
];

// Communication validation
export const validateCreateCommunication = [
  body("leadId")
    .isMongoId()
    .withMessage("Invalid lead ID"),
  body("type")
    .isIn(["call", "email", "meeting", "message"])
    .withMessage("Invalid communication type"),
  body("notes")
    .optional()
    .trim()
    .isLength({ min: 5 })
    .withMessage("Notes must be at least 5 characters"),
  handleValidationErrors,
];

// Pagination validation
export const validatePagination = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  handleValidationErrors,
];
