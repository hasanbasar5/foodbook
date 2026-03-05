const jwt = require("jsonwebtoken");

const authenticate = (req, _res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    const error = new Error("Authentication required");
    error.statusCode = 401;
    return next(error);
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = payload;
    return next();
  } catch (_error) {
    const error = new Error("Invalid or expired token");
    error.statusCode = 401;
    return next(error);
  }
};

module.exports = authenticate;
