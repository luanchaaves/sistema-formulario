import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

export async function createAuditLog({
  userId,
  action,
  entityType,
  entityId,
  formId,
  metadata,
}: {
  userId?: string;
  action: string;
  entityType: string;
  entityId: string;
  formId?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await db.auditLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId,
        formId,
        metadata: metadata ? (metadata as Prisma.InputJsonValue) : undefined,
      },
    });
  } catch (error) {
    console.error("Failed to write audit log:", error);
  }
}
