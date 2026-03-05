const asyncHandler = require("../middleware/asyncHandler");
const bcrypt = require("bcryptjs");
const {
  listUsers,
  updateUserRole,
  findById,
  findByEmail,
  createUser,
  updateManagedUser,
  deleteUser,
  setUserStatus,
  resetUserPassword,
} = require("../models/userModel");
const { findRoleByName } = require("../models/roleModel");
const { getAdminSummary } = require("../models/cashbookModel");
const { createAuditLog, listAuditLogs } = require("../models/auditLogModel");

const assertSameOrganization = (actor, targetUser) => {
  if (!targetUser || Number(targetUser.organizationId) !== Number(actor.organizationId)) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }
};

const getUsers = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Math.min(Number(req.query.limit || 10), 50);
  const result = await listUsers({
    organizationId: req.user.organizationId,
    page,
    limit,
    search: req.query.search?.trim(),
    status: req.query.status,
  });
  res.json(result);
});

const assignRole = asyncHandler(async (req, res) => {
  const { userId, role } = req.body;
  const existingUser = await findById(userId);
  if (!existingUser) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }
  assertSameOrganization(req.user, existingUser);

  const roleRecord = await findRoleByName(role);
  if (!roleRecord) {
    const error = new Error("Role not found");
    error.statusCode = 404;
    throw error;
  }

  const updatedUser = await updateUserRole({
    organizationId: req.user.organizationId,
    userId,
    roleId: roleRecord.id,
  });
  await createAuditLog({
    organizationId: req.user.organizationId,
    actorUserId: req.user.id,
    actorRole: req.user.role,
    action: "ASSIGN_ROLE",
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

const getReports = asyncHandler(async (req, res) => {
  const selectedUserId = req.query.userId ? Number(req.query.userId) : undefined;
  const reports = await getAdminSummary({
    organizationId: req.user.organizationId,
    selectedUserId,
  });
  res.json(reports);
});

const createManagedUser = asyncHandler(async (req, res) => {
  const { email, password, role, fullName, avatarUrl, isActive } = req.body;
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
    organizationId: req.user.organizationId,
    roleId: roleRecord.id,
    fullName,
    avatarUrl,
    isActive,
  });

  res.status(201).json({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    avatarUrl: user.avatarUrl,
    isActive: user.isActive,
    role: user.role,
  });
  await createAuditLog({
    organizationId: req.user.organizationId,
    actorUserId: req.user.id,
    actorRole: req.user.role,
    action: "CREATE_MANAGED_USER",
    targetType: "USER",
    targetId: user.id,
    details: { email: user.email, role: user.role },
  });
});

const updateManagedUserById = asyncHandler(async (req, res) => {
  const userId = Number(req.params.id);
  const { fullName, avatarUrl, role, password, isActive } = req.body;
  const existingUser = await findById(userId);
  if (!existingUser) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }
  assertSameOrganization(req.user, existingUser);

  const roleRecord = await findRoleByName(role);
  const passwordHash = password ? await bcrypt.hash(password, 12) : null;
  const user = await updateManagedUser({
    organizationId: req.user.organizationId,
    userId,
    fullName,
    avatarUrl,
    roleId: roleRecord.id,
    password: passwordHash,
    isActive,
  });

  res.json({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    avatarUrl: user.avatarUrl,
    isActive: user.isActive,
    role: user.role,
  });
  await createAuditLog({
    organizationId: req.user.organizationId,
    actorUserId: req.user.id,
    actorRole: req.user.role,
    action: "UPDATE_MANAGED_USER",
    targetType: "USER",
    targetId: user.id,
    details: { email: user.email, role: user.role, isActive: user.isActive },
  });
});

const deleteManagedUserById = asyncHandler(async (req, res) => {
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
  assertSameOrganization(req.user, existingUser);

  await deleteUser({ organizationId: req.user.organizationId, userId });
  await createAuditLog({
    organizationId: req.user.organizationId,
    actorUserId: req.user.id,
    actorRole: req.user.role,
    action: "DELETE_MANAGED_USER",
    targetType: "USER",
    targetId: userId,
    details: { email: existingUser.email },
  });
  res.status(204).send();
});

const toggleManagedUserStatus = asyncHandler(async (req, res) => {
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
  assertSameOrganization(req.user, existingUser);

  const user = await setUserStatus({
    organizationId: req.user.organizationId,
    userId,
    isActive,
  });
  await createAuditLog({
    organizationId: req.user.organizationId,
    actorUserId: req.user.id,
    actorRole: req.user.role,
    action: isActive ? "ACTIVATE_USER" : "DEACTIVATE_USER",
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

const resetManagedUserPassword = asyncHandler(async (req, res) => {
  const userId = Number(req.params.id);
  const existingUser = await findById(userId);
  if (!existingUser) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }
  assertSameOrganization(req.user, existingUser);

  const temporaryPassword = `Fb@${Math.random().toString(36).slice(-10)}`;
  const passwordHash = await bcrypt.hash(temporaryPassword, 12);
  await resetUserPassword({
    organizationId: req.user.organizationId,
    userId,
    passwordHash,
  });
  await createAuditLog({
    organizationId: req.user.organizationId,
    actorUserId: req.user.id,
    actorRole: req.user.role,
    action: "RESET_USER_PASSWORD",
    targetType: "USER",
    targetId: userId,
    details: { email: existingUser.email },
  });

  res.json({
    message: "Password reset successfully",
    temporaryPassword,
  });
});

const getAuditActivity = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit || 20), 50);
  const items = await listAuditLogs({
    organizationId: req.user.organizationId,
    limit,
  });

  res.json({ items });
});

module.exports = {
  getUsers,
  assignRole,
  getReports,
  createManagedUser,
  updateManagedUserById,
  deleteManagedUserById,
  toggleManagedUserStatus,
  resetManagedUserPassword,
  getAuditActivity,
};
