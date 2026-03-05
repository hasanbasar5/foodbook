const bcrypt = require("bcryptjs");
const asyncHandler = require("../middleware/asyncHandler");
const { findRoleByName } = require("../models/roleModel");
const { createOrganization } = require("../models/organizationModel");
const { findByEmail, createUser, findById, updateProfile } = require("../models/userModel");
const {
  createRefreshToken,
  findRefreshToken,
  deleteRefreshToken,
  deleteUserRefreshTokens,
} = require("../models/refreshTokenModel");
const { signAccessToken, signRefreshToken } = require("../utils/jwt");
const { hashToken } = require("../utils/hash");
const { createAuditLog } = require("../models/auditLogModel");
const { hasOrganizationScope } = require("../utils/org");

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/api/auth",
};

const getRefreshExpiry = () => {
  const days = Number(process.env.REFRESH_TOKEN_TTL_DAYS || 7);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + days);
  return expiresAt;
};

const issueTokens = async (user, res) => {
  await deleteUserRefreshTokens(user.id);
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  const expiresAt = getRefreshExpiry();

  await createRefreshToken({
    userId: user.id,
    tokenHash: hashToken(refreshToken),
    expiresAt,
  });

  res.cookie("refreshToken", refreshToken, {
    ...cookieOptions,
    expires: expiresAt,
  });

  return {
    accessToken,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      role: user.role,
      organizationId: user.organizationId,
      organizationName: user.organizationName,
    },
  };
};

const register = asyncHandler(async (req, res) => {
  const { email, password, fullName, avatarUrl, accountType, organizationName } = req.body;
  const existingUser = await findByEmail(email);
  if (existingUser) {
    const error = new Error("Email is already registered");
    error.statusCode = 409;
    throw error;
  }

  const isBusinessAccount = accountType === "business";
  const assignedRole = await findRoleByName(isBusinessAccount ? "SUPER_ADMIN" : "USER");
  const passwordHash = await bcrypt.hash(password, 12);
  let organizationId = null;

  if (isBusinessAccount) {
    const organization = await createOrganization(organizationName);
    organizationId = organization.id;
  }

  const user = await createUser({
    email,
    password: passwordHash,
    organizationId,
    roleId: assignedRole.id,
    fullName,
    avatarUrl,
  });

  const tokens = await issueTokens(user, res);
  if (hasOrganizationScope(user)) {
    await createAuditLog({
      organizationId: user.organizationId,
      actorUserId: user.id,
      actorRole: user.role,
      action: isBusinessAccount ? "REGISTER_BUSINESS_OWNER" : "REGISTER_USER",
      targetType: "USER",
      targetId: user.id,
      details: {
        email: user.email,
        accountType: isBusinessAccount ? "business" : "user",
        organizationName: user.organizationName,
      },
    });
  }
  res.status(201).json(tokens);
});

const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await findById(req.user.id);
  res.json({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    avatarUrl: user.avatarUrl,
    role: user.role,
    organizationId: user.organizationId,
    organizationName: user.organizationName,
    createdAt: user.createdAt,
  });
});

const updateCurrentUserProfile = asyncHandler(async (req, res) => {
  const user = await updateProfile({
    userId: req.user.id,
    fullName: req.body.fullName,
    avatarUrl: req.body.avatarUrl,
  });

  res.json({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    avatarUrl: user.avatarUrl,
    role: user.role,
    organizationId: user.organizationId,
    organizationName: user.organizationName,
    createdAt: user.createdAt,
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await findByEmail(email);
  if (!user) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  if (!user.isActive) {
    const error = new Error("This account is inactive. Contact an administrator.");
    error.statusCode = 403;
    throw error;
  }

  const tokens = await issueTokens(user, res);
  res.json(tokens);
});

const refresh = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
  if (!refreshToken) {
    const error = new Error("Refresh token is required");
    error.statusCode = 401;
    throw error;
  }

  let payload;
  try {
    payload = require("jsonwebtoken").verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET
    );
  } catch (_error) {
    const error = new Error("Invalid refresh token");
    error.statusCode = 401;
    throw error;
  }

  const storedToken = await findRefreshToken(hashToken(refreshToken));
  if (!storedToken || new Date(storedToken.expires_at) < new Date()) {
    const error = new Error("Refresh token expired");
    error.statusCode = 401;
    throw error;
  }

  await deleteRefreshToken(hashToken(refreshToken));
  const user = await findById(payload.id);
  const tokens = await issueTokens(user, res);
  res.json(tokens);
});

const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
  if (refreshToken) {
    await deleteRefreshToken(hashToken(refreshToken));
  }

  res.clearCookie("refreshToken", cookieOptions);
  res.status(204).send();
});

module.exports = {
  register,
  login,
  refresh,
  logout,
  getCurrentUser,
  updateCurrentUserProfile,
};
