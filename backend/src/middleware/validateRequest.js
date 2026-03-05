const { validationResult } = require("express-validator");

const validateRequest = (req, _res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  const error = new Error("Validation failed");
  error.statusCode = 422;
  error.errors = errors.array();
  return next(error);
};

module.exports = validateRequest;
