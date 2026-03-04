// src/controllers/__tests__/authController.test.js
import { login, getSalesExecutives } from "../authController.js";
import User from "../../models/User.js";

// Mock the User model
jest.mock("../../models/User.js");

describe("Auth Controller", () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      user: { _id: "user123" },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("login", () => {
    it("should return 400 if email or password is missing", async () => {
      req.body = { email: "", password: "" };

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Email and password are required",
      });
    });

    it("should return 400 if email format is invalid", async () => {
      req.body = { email: "invalid-email", password: "password123" };

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 401 if user not found", async () => {
      req.body = { email: "test@example.com", password: "password123" };
      User.findOne.mockResolvedValue(null);

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: "Invalid email or password",
      });
    });

    it("should return 401 if password is incorrect", async () => {
      const mockUser = {
        _id: "userId123",
        email: "test@example.com",
        matchPassword: jest.fn().mockResolvedValue(false),
        isActive: true,
      };

      req.body = { email: "test@example.com", password: "wrongpassword" };
      User.findOne.mockResolvedValue(mockUser);

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("should return 403 if user account is inactive", async () => {
      const mockUser = {
        _id: "userId123",
        email: "test@example.com",
        matchPassword: jest.fn().mockResolvedValue(true),
        isActive: false,
      };

      req.body = { email: "test@example.com", password: "correctpassword" };
      User.findOne.mockResolvedValue(mockUser);

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it("should return 500 on server error", async () => {
      req.body = { email: "test@example.com", password: "password123" };
      User.findOne.mockRejectedValue(new Error("Database error"));

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Server error while logging in",
      });
    });
  });

  describe("getSalesExecutives", () => {
    it("should return list of sales executives", async () => {
      const mockSalesUsers = [
        { _id: "user1", name: "John", email: "john@example.com", role: "sales" },
        { _id: "user2", name: "Jane", email: "jane@example.com", role: "sales" },
      ];

      User.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(mockSalesUsers),
        }),
      });

      await getSalesExecutives(req, res);

      expect(res.json).toHaveBeenCalledWith({
        status: "success",
        data: mockSalesUsers,
      });
    });

    it("should handle errors gracefully", async () => {
      User.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          sort: jest.fn().mockRejectedValue(new Error("Database error")),
        }),
      });

      await getSalesExecutives(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
