import { AuditLog } from "../models/AuditLog.js";

export async function recordAudit({ actor, action, entityType, entityId, metadata = {} }) {
  await AuditLog.create({ actor, action, entityType, entityId, metadata });
}
