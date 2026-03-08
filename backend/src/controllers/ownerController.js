const asyncHandler = require("../middleware/asyncHandler");
const bcrypt = require("bcryptjs");
const {
  listAllUsers,
  findById,
  findByEmail,
  createUser,
  updateManagedUserGlobal,
  deleteUserGlobal,
  setUserStatusGlobal,
  resetUserPasswordGlobal,
  updateUserRoleGlobal,
} = require("../models/userModel");
const { findRoleByName } = require("../models/roleModel");
const { getOwnerLoginStats } = require("../models/loginEventModel");
const {
  getOwnerSummary,
  listDeletedEntriesGlobal,
} = require("../models/cashbookModel");
const { createAuditLog } = require("../models/auditLogModel");

const getOwnerDashboard = asyncHandler(async (_req, res) => {
  const data = await getOwnerLoginStats();
  res.json(data);
});

const getOwnerUsers = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Math.min(Number(req.query.limit || 10), 50);
  const result = await listAllUsers({
    page,
    limit,
    search: req.query.search?.trim(),
    status: req.query.status,
  });
  res.json(result);
});

const getOwnerReports = asyncHandler(async (req, res) => {
  const selectedUserId = req.query.userId ? Number(req.query.userId) : undefined;
  const reports = await getOwnerSummary({ selectedUserId });
  res.json(reports);
});

const createOwnerManagedUser = asyncHandler(async (req, res) => {
  const { email, password, role, fullName, avatarUrl, isActive, organizationId } = req.body;
  const existingUser = await findByEmail(email);
  if (existingUser) {
    const error = new Error("Email is already registered");
    error.statusCode = 409;
    throw error;
  }

  const roleRecord = await findRoleByName(role);
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await createUser({
    email,
    password: passwordHash,
    organizationId: organizationId || null,
    roleId: roleRecord.id,
    fullName,
    avatarUrl,
    isActive,
  });

  await createAuditLog({
    organizationId: user.organizationId,
    actorUserId: req.user.id,
    actorRole: req.user.role,
    action: "OWNER_CREATE_USER",
    targetType: "USER",
    targetId: user.id,
    details: { email: user.email, role: user.role },
  });

  res.status(201).json({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    avatarUrl: user.avatarUrl,
    isActive: user.isActive,
    role: user.role,
    organizationId: user.organizationId,
    organizationName: user.organizationName,
  });
});

const assignOwnerRole = asyncHandler(async (req, res) => {
  const { userId, role } = req.body;
  const existingUser = await findById(userId);
  if (!existingUser) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  const roleRecord = await findRoleByName(role);
  if (!roleRecord) {
    const error = new Error("Role not found");
    error.statusCode = 404;
    throw error;
  }

  const updatedUser = await updateUserRoleGlobal({
    userId,
    roleId: roleRecord.id,
  });

  await createAuditLog({
    organizationId: updatedUser.organizationId,
    actorUserId: req.user.id,
    actorRole: req.user.role,
    action: "OWNER_ASSIGN_ROLE",
    targetType: "USER",
    targetId: updatedUser.id,
    details: { role: updatedUser.role, email: updatedUser.email },
  });

  res.json({
    id: updatedUser.id,
    email: updatedUser.email,
    role: updatedUser.role,
  });
});

const updateOwnerManagedUserById = asyncHandler(async (req, res) => {
  const userId = Number(req.params.id);
  const { fullName, avatarUrl, role, password, isActive } = req.body;
  const existingUser = await findById(userId);
  if (!existingUser) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  const roleRecord = await findRoleByName(role);
  const passwordHash = password ? await bcrypt.hash(password, 12) : null;
  const user = await updateManagedUserGlobal({
    userId,
    fullName,
    avatarUrl,
    roleId: roleRecord.id,
    password: passwordHash,
    isActive,
  });

  await createAuditLog({
    organizationId: user.organizationId,
    actorUserId: req.user.id,
    actorRole: req.user.role,
    action: "OWNER_UPDATE_USER",
    targetType: "USER",
    targetId: user.id,
    details: { email: user.email, role: user.role, isActive: user.isActive },
  });

  res.json({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    avatarUrl: user.avatarUrl,
    isActive: user.isActive,
    role: user.role,
  });
});

const deleteOwnerManagedUserById = asyncHandler(async (req, res) => {
  const userId = Number(req.params.id);
  if (req.user.id === userId) {
    const error = new Error("You cannot delete your own account");
    error.statusCode = 400;
    throw error;
  }

  const existingUser = await findById(userId);
  if (!existingUser) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  await deleteUserGlobal({ userId });
  await createAuditLog({
    organizationId: existingUser.organizationId,
    actorUserId: req.user.id,
    actorRole: req.user.role,
    action: "OWNER_DELETE_USER",
    targetType: "USER",
    targetId: userId,
    details: { email: existingUser.email },
  });
  res.status(204).send();
});

const toggleOwnerUserStatus = asyncHandler(async (req, res) => {
  const userId = Number(req.params.id);
  const { isActive } = req.body;
  if (req.user.id === userId && !isActive) {
    const error = new Error("You cannot deactivate your own account");
    error.statusCode = 400;
    throw error;
  }

  const existingUser = await findById(userId);
  if (!existingUser) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  const user = await setUserStatusGlobal({ userId, isActive });
  await createAuditLog({
    organizationId: user.organizationId,
    actorUserId: req.user.id,
    actorRole: req.user.role,
    action: isActive ? "OWNER_ACTIVATE_USER" : "OWNER_DEACTIVATE_USER",
    targetType: "USER",
    targetId: user.id,
    details: { email: user.email },
  });
  res.json({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    isActive: user.isActive,
    role: user.role,
  });
});

const resetOwnerManagedUserPassword = asyncHandler(async (req, res) => {
  const userId = Number(req.params.id);
  const manualPassword = typeof req.body.password === "string" ? req.body.password.trim() : "";
  const existingUser = await findById(userId);
  if (!existingUser) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  const requiresManualPassword = existingUser.role === "ADMIN" || existingUser.role === "SUPER_ADMIN";
  if (requiresManualPassword && !manualPassword) {
    const error = new Error("Enter a password manually for admin or super admin accounts");
    error.statusCode = 400;
    throw error;
  }

  const nextPassword = manualPassword || `Fb@${Math.random().toString(36).slice(-10)}`;
  const passwordHash = await bcrypt.hash(nextPassword, 12);
  await resetUserPasswordGlobal({
    userId,
    passwordHash,
  });
  await createAuditLog({
    organizationId: existingUser.organizationId,
    actorUserId: req.user.id,
    actorRole: req.user.role,
    action: "OWNER_RESET_USER_PASSWORD",
    targetType: "USER",
    targetId: userId,
    details: { email: existingUser.email },
  });

  res.json({
    message: "Password reset successfully",
    temporaryPassword: nextPassword,
    wasAutoGenerated: !manualPassword,
  });
});

const getOwnerDeletedEntries = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit || 20), 50);
  const items = await listDeletedEntriesGlobal({ limit });
  res.json({ items });
});

module.exports = {
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
};
