const express = require("express");
const { body, query } = require("express-validator");
const authenticate = require("../middleware/authenticate");
const validateRequest = require("../middleware/validateRequest");
const {
  createCashbookEntry,
  getCashbookEntries,
  updateCashbookEntry,
  deleteCashbookEntry,
} = require("../controllers/cashbookController");

const router = express.Router();

const entryValidation = [
  body("entryName")
    .trim()
    .isLength({ min: 2, max: 120 })
    .withMessage("Entry name must be between 2 and 120 characters"),
  body("category")
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage("Category must be between 2 and 80 characters"),
  body("amount").isFloat({ gt: 0 }).withMessage("Amount must be greater than zero"),
  body("date").isISO8601().withMessage("Valid date is required"),
  body("description")
    .trim()
    .isLength({ min: 3, max: 255 })
    .withMessage("Description must be between 3 and 255 characters"),
  body("entryType")
    .isIn(["Debit", "Credit"])
    .withMessage("Entry type must be Debit or Credit"),
  body("paymentMethod")
    .isIn(["Cash", "Online", "Card", "UPI"])
    .withMessage("Payment method must be Cash, Online, Card, or UPI"),
];

router.use(authenticate);

router.post("/entry", entryValidation, validateRequest, createCashbookEntry);
router.get(
  "/entries",
  [
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 50 }),
    query("fromDate").optional().isISO8601(),
    query("toDate").optional().isISO8601(),
    query("userId").optional().isInt({ min: 1 }),
  ],
  validateRequest,
  getCashbookEntries
);
router.put("/entry/:id", entryValidation, validateRequest, updateCashbookEntry);
router.delete("/entry/:id", deleteCashbookEntry);

module.exports = router;
