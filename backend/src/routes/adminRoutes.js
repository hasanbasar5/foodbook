const express = require("express");
const { body, query } = require("express-validator");
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");
const validateRequest = require("../middleware/validateRequest");
const {
  getUsers,
  assignRole,
  getReports,
  createManagedUser,
  updateManagedUserById,
  deleteManagedUserById,
  toggleManagedUserStatus,
  resetManagedUserPassword,
  getAuditActivity,
} = require("../controllers/adminController");

const router = express.Router();

router.use(authenticate);

router.get(
  "/users",
  authorize(["ADMIN", "SUPER_ADMIN"]),
  [
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 50 }),
    query("search").optional().isString(),
    query("status").optional().isIn(["all", "active", "inactive"]),
  ],
  validateRequest,
  getUsers
);

router.put(
  "/assign-role",
  authorize(["SUPER_ADMIN"]),
  [
    body("userId").isInt({ min: 1 }).withMessage("Valid user id is required"),
    body("role")
      .isIn(["USER", "ADMIN", "SUPER_ADMIN"])
      .withMessage("Valid role is required"),
  ],
  validateRequest,
  assignRole
);

router.get(
  "/reports",
  authorize(["ADMIN", "SUPER_ADMIN"]),
  [query("userId").optional().isInt({ min: 1 })],
  validateRequest,
  getReports
);

router.get(
  "/audit-logs",
  authorize(["SUPER_ADMIN"]),
  [query("limit").optional().isInt({ min: 1, max: 50 })],
  validateRequest,
  getAuditActivity
);

router.post(
  "/users",
  authorize(["SUPER_ADMIN"]),
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("fullName")
      .trim()
      .isLength({ min: 2, max: 120 })
      .withMessage("Full name must be between 2 and 120 characters"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters"),
    body("role")
      .isIn(["USER", "ADMIN", "SUPER_ADMIN"])
      .withMessage("Valid role is required"),
    body("avatarUrl")
      .optional({ nullable: true })
      .isString()
      .isLength({ max: 16777215 })
      .withMessage("Avatar image is too large"),
    body("isActive").optional().isBoolean().withMessage("Status must be true or false"),
  ],
  validateRequest,
  createManagedUser
);

router.put(
  "/users/:id",
  authorize(["SUPER_ADMIN"]),
  [
    body("fullName")
      .trim()
      .isLength({ min: 2, max: 120 })
      .withMessage("Full name must be between 2 and 120 characters"),
    body("role")
      .isIn(["USER", "ADMIN", "SUPER_ADMIN"])
      .withMessage("Valid role is required"),
    body("password")
      .optional({ nullable: true })
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters"),
    body("avatarUrl")
      .optional({ nullable: true })
      .isString()
      .isLength({ max: 16777215 })
      .withMessage("Avatar image is too large"),
    body("isActive").optional().isBoolean().withMessage("Status must be true or false"),
  ],
  validateRequest,
  updateManagedUserById
);

router.delete(
  "/users/:id",
  authorize(["SUPER_ADMIN"]),
  deleteManagedUserById
);

router.patch(
  "/users/:id/status",
  authorize(["SUPER_ADMIN"]),
  [body("isActive").isBoolean().withMessage("Status must be true or false")],
  validateRequest,
  toggleManagedUserStatus
);

router.post(
  "/users/:id/reset-password",
  authorize(["SUPER_ADMIN"]),
  resetManagedUserPassword
);

module.exports = router;
