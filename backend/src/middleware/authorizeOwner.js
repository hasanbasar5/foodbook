const { isOwnerUser } = require("../utils/owner");

const authorizeOwner = (req, _res, next) => {
  if (!req.user) {
    const error = new Error("Authentication required");
    error.statusCode = 401;
    return next(error);
  }

  if (!isOwnerUser(req.user)) {
    const error = new Error("You do not have permission to access owner analytics");
    error.statusCode = 403;
    return next(error);
  }

  return next();
};

module.exports = authorizeOwner;
