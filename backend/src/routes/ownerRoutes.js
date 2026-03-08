const express = require("express");
const { body, query } = require("express-validator");
const authenticate = require("../middleware/authenticate");
const authorizeOwner = require("../middleware/authorizeOwner");
const validateRequest = require("../middleware/validateRequest");
const {
  getOwnerDashboard,
  getOwnerUsers,
  getOwnerReports,
  createOwnerManagedUser,
  assignOwnerRole,
  updateOwnerManagedUserById,
  deleteOwnerManagedUserById,
  toggleOwnerUserStatus,
  resetOwnerManagedUserPassword,
  getOwnerDeletedEntries,
} = require("../controllers/ownerController");

const router = express.Router();

router.use(authenticate);
router.use(authorizeOwner);

router.get("/dashboard", getOwnerDashboard);

router.get(
  "/users",
  [
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 50 }),
    query("search").optional().isString(),
    query("status").optional().isIn(["all", "active", "inactive"]),
  ],
  validateRequest,
  getOwnerUsers
);

router.get(
  "/reports",
  [query("userId").optional().isInt({ min: 1 })],
  validateRequest,
  getOwnerReports
);

router.get(
  "/deleted-entries",
  [query("limit").optional().isInt({ min: 1, max: 50 })],
  validateRequest,
  getOwnerDeletedEntries
);

router.put(
  "/assign-role",
  [
    body("userId").isInt({ min: 1 }).withMessage("Valid user id is required"),
    body("role")
      .isIn(["USER", "ADMIN", "SUPER_ADMIN"])
      .withMessage("Valid role is required"),
  ],
  validateRequest,
  assignOwnerRole
);

router.post(
  "/users",
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
    body("organizationId").optional({ nullable: true }).isInt({ min: 1 }),
    body("avatarUrl")
      .optional({ nullable: true })
      .isString()
      .isLength({ max: 16777215 })
      .withMessage("Avatar image is too large"),
    body("isActive").optional().isBoolean().withMessage("Status must be true or false"),
  ],
  validateRequest,
  createOwnerManagedUser
);

router.put(
  "/users/:id",
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
  updateOwnerManagedUserById
);

router.delete("/users/:id", deleteOwnerManagedUserById);

router.patch(
  "/users/:id/status",
  [body("isActive").isBoolean().withMessage("Status must be true or false")],
  validateRequest,
  toggleOwnerUserStatus
);

router.post(
  "/users/:id/reset-password",
  [
    body("password")
      .optional({ nullable: true })
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters"),
  ],
  validateRequest,
  resetOwnerManagedUserPassword
);

module.exports = router;
