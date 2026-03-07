const express = require("express");
const { body } = require("express-validator");
const {
  register,
  login,
  refresh,
  logout,
  getCurrentUser,
  updateCurrentUserProfile,
  changeCurrentUserPassword,
} = require("../controllers/authController");
const validateRequest = require("../middleware/validateRequest");
const { loginLimiter } = require("../middleware/rateLimiters");
const authenticate = require("../middleware/authenticate");

const router = express.Router();

router.post(
  "/register",
  [
    body("accountType")
      .optional()
      .isIn(["user", "business"])
      .withMessage("Account type must be user or business"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("fullName")
      .optional()
      .trim()
      .isLength({ min: 2, max: 120 })
      .withMessage("Full name must be between 2 and 120 characters"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters"),
    body("avatarUrl")
      .optional({ nullable: true })
      .isString()
      .isLength({ max: 16777215 })
      .withMessage("Avatar image is too large"),
    body("organizationName")
      .if(body("accountType").equals("business"))
      .trim()
      .isLength({ min: 2, max: 120 })
      .withMessage("Business name must be between 2 and 120 characters"),
  ],
  validateRequest,
  register
);

router.post(
  "/login",
  loginLimiter,
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  validateRequest,
  login
);

router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/me", authenticate, getCurrentUser);
router.put(
  "/profile",
  authenticate,
  [
    body("fullName")
      .trim()
      .isLength({ min: 2, max: 120 })
      .withMessage("Full name must be between 2 and 120 characters"),
    body("avatarUrl")
      .optional({ nullable: true })
      .isString()
      .isLength({ max: 16777215 })
      .withMessage("Avatar image is too large"),
  ],
  validateRequest,
  updateCurrentUserProfile
);
router.put(
  "/password",
  authenticate,
  [
    body("currentPassword").notEmpty().withMessage("Current password is required"),
    body("newPassword")
      .isLength({ min: 8 })
      .withMessage("New password must be at least 8 characters"),
    body("confirmPassword")
      .custom((value, { req }) => value === req.body.newPassword)
      .withMessage("Password confirmation does not match"),
  ],
  validateRequest,
  changeCurrentUserPassword
);

module.exports = router;
