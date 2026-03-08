const jwt = require("jsonwebtoken");
const { isOwnerUser } = require("./owner");

const getAccessPayload = (user) => ({
  id: user.id,
  email: user.email,
  role: user.role,
  organizationId: user.organizationId,
  organizationName: user.organizationName,
  isOwner: isOwnerUser(user),
});

const signAccessToken = (user) =>
  jwt.sign(getAccessPayload(user), process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_TTL || "3d",
  });

const signRefreshToken = (user) =>
  jwt.sign(getAccessPayload(user), process.env.JWT_REFRESH_SECRET, {
    expiresIn: `${Number(process.env.REFRESH_TOKEN_TTL_DAYS || 30)}d`,
  });

module.exports = {
  getAccessPayload,
  signAccessToken,
  signRefreshToken,
};
