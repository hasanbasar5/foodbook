const asyncHandler = require("../middleware/asyncHandler");
const {
  createEntry,
  getEntryById,
  listEntries,
  updateEntry,
  deleteEntry,
} = require("../models/cashbookModel");
const { createAuditLog } = require("../models/auditLogModel");
const { hasOrganizationScope } = require("../utils/org");

const createCashbookEntry = asyncHandler(async (req, res) => {
  const entry = await createEntry({
    userId: req.user.id,
    organizationId: req.user.organizationId,
    entryName: req.body.entryName,
    category: req.body.category,
    amount: req.body.amount,
    date: req.body.date,
    description: req.body.description,
    entryType: req.body.entryType,
    paymentMethod: req.body.paymentMethod,
  });

  await createAuditLog({
    organizationId: req.user.organizationId,
    actorUserId: req.user.id,
    actorRole: req.user.role,
    action: "CREATE_ENTRY",
    targetType: "CASHBOOK_ENTRY",
    targetId: entry.id,
    details: {
      entryName: entry.entry_name,
      amount: entry.amount,
      entryType: entry.entry_type,
    },
  });

  res.status(201).json(entry);
});

const getCashbookEntries = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Math.min(Number(req.query.limit || 10), 50);
  const scope = hasOrganizationScope(req.user) ? "all" : "own";
  const data = await listEntries({
    organizationId: req.user.organizationId,
    userId: req.user.id,
    scope,
    page,
    limit,
    fromDate: req.query.fromDate,
    toDate: req.query.toDate,
    selectedUserId: req.query.userId ? Number(req.query.userId) : undefined,
  });

  res.json(data);
});

const updateCashbookEntry = asyncHandler(async (req, res) => {
  if (req.user.role === "USER") {
    const error = new Error("Users can add entries, but cannot edit them");
    error.statusCode = 403;
    throw error;
  }

  const entry = await getEntryById(Number(req.params.id), req.user.organizationId);
  if (!entry) {
    const error = new Error("Entry not found");
    error.statusCode = 404;
    throw error;
  }

  const canEdit =
    req.user.role === "SUPER_ADMIN" ||
    req.user.role === "ADMIN" ||
    Number(entry.user_id) === Number(req.user.id);
  if (!canEdit) {
    const error = new Error("You do not have permission to edit this entry");
    error.statusCode = 403;
    throw error;
  }

  const updatedEntry = await updateEntry({
    id: Number(req.params.id),
    entryName: req.body.entryName,
    category: req.body.category,
    amount: req.body.amount,
    date: req.body.date,
    description: req.body.description,
    entryType: req.body.entryType,
    paymentMethod: req.body.paymentMethod,
  });

  await createAuditLog({
    organizationId: req.user.organizationId,
    actorUserId: req.user.id,
    actorRole: req.user.role,
    action: "UPDATE_ENTRY",
    targetType: "CASHBOOK_ENTRY",
    targetId: updatedEntry.id,
    details: {
      entryName: updatedEntry.entry_name,
      amount: updatedEntry.amount,
      entryType: updatedEntry.entry_type,
    },
  });

  res.json(updatedEntry);
});

const deleteCashbookEntry = asyncHandler(async (req, res) => {
  if (req.user.role === "USER") {
    const error = new Error("Users can add entries, but cannot delete them");
    error.statusCode = 403;
    throw error;
  }

  const entry = await getEntryById(Number(req.params.id), req.user.organizationId);
  if (!entry) {
    const error = new Error("Entry not found");
    error.statusCode = 404;
    throw error;
  }

  const canDelete =
    req.user.role === "SUPER_ADMIN" ||
    req.user.role === "ADMIN" ||
    Number(entry.user_id) === Number(req.user.id);

  if (!canDelete) {
    const error = new Error("You do not have permission to delete this entry");
    error.statusCode = 403;
    throw error;
  }

  await deleteEntry(Number(req.params.id));
  await createAuditLog({
    organizationId: req.user.organizationId,
    actorUserId: req.user.id,
    actorRole: req.user.role,
    action: "DELETE_ENTRY",
    targetType: "CASHBOOK_ENTRY",
    targetId: entry.id,
    details: {
      entryName: entry.entry_name,
      ownerUserId: entry.user_id,
    },
  });
  res.status(204).send();
});

module.exports = {
  createCashbookEntry,
  getCashbookEntries,
  updateCashbookEntry,
  deleteCashbookEntry,
};
