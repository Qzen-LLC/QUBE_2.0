import { prismaClient } from "@/utils/db";
import { notificationSystem } from "./notification-system";

export interface FinOpsAnomalyCheckInput {
  useCaseId: string;
  totalVariancePercent: number;
  anomalies: Array<{ category: string; variance_percent: number; message: string }>;
  useCaseTitle?: string;
}

/**
 * Check reconciliation results for anomalies and create in-app notifications.
 * Called after each reconciliation completes.
 */
export async function checkAndNotifyFinOpsAnomalies(
  input: FinOpsAnomalyCheckInput
): Promise<void> {
  const { useCaseId, totalVariancePercent, anomalies, useCaseTitle } = input;

  try {
    // Find the use case owner (userId)
    const useCase = await prismaClient.useCase.findUnique({
      where: { id: useCaseId },
      select: { userId: true, title: true, organizationId: true },
    });

    if (!useCase?.userId) return;

    const title = useCaseTitle || useCase.title || "Unknown Use Case";

    // Check 1: Variance > 20% → Budget Alert
    if (Math.abs(totalVariancePercent) > 20) {
      const direction = totalVariancePercent > 0 ? "over" : "under";
      const priority = Math.abs(totalVariancePercent) > 50 ? "urgent" : "high";
      try {
        notificationSystem.addNotification({
          id: `finops_budget_${useCaseId}_${Date.now()}`,
          type: "warning",
          title: "Budget Alert",
          message: `"${title}" is ${Math.abs(totalVariancePercent).toFixed(1)}% ${direction} budget. Review cost reconciliation for details.`,
          timestamp: new Date(),
          read: false,
          priority: priority as "high" | "urgent",
          category: "performance",
          actionUrl: `/dashboard/finops-dashboard/${useCaseId}`,
          userId: useCase.userId,
          source: "finops-reconciliation",
        });
      } catch {
        console.log(`[FinOps Alert] ${priority.toUpperCase()}: Budget Alert — "${title}" is ${Math.abs(totalVariancePercent).toFixed(1)}% ${direction} budget.`);
      }
    }

    // Check 2: New anomalies detected
    if (anomalies.length > 0) {
      const categories = anomalies.map((a) => a.category).join(", ");
      try {
        notificationSystem.addNotification({
          id: `finops_anomaly_${useCaseId}_${Date.now()}`,
          type: "warning",
          title: "Cost Anomaly Detected",
          message: `${anomalies.length} cost anomal${anomalies.length === 1 ? "y" : "ies"} detected in "${title}": ${categories}.`,
          timestamp: new Date(),
          read: false,
          priority: "high",
          category: "performance",
          actionUrl: `/dashboard/finops-dashboard/${useCaseId}`,
          userId: useCase.userId,
          source: "finops-reconciliation",
        });
      } catch {
        console.log(`[FinOps Alert] HIGH: Cost Anomaly Detected — ${anomalies.length} in "${title}"`);
      }
    }

    // Check 3: 3+ consecutive months of overspend → Persistent Overspend
    const recentReconciliations = await prismaClient.costReconciliation.findMany({
      where: { useCaseId },
      orderBy: { reconciledAt: "desc" },
      take: 3,
      select: { totalVariancePercent: true },
    });

    if (
      recentReconciliations.length >= 3 &&
      recentReconciliations.every((r) => r.totalVariancePercent > 10)
    ) {
      try {
        notificationSystem.addNotification({
          id: `finops_persistent_${useCaseId}_${Date.now()}`,
          type: "error",
          title: "Persistent Overspend Warning",
          message: `"${title}" has been over budget for 3+ consecutive reconciliation periods. Consider reviewing cost structure.`,
          timestamp: new Date(),
          read: false,
          priority: "urgent",
          category: "performance",
          actionUrl: `/dashboard/finops-dashboard/${useCaseId}`,
          userId: useCase.userId,
          source: "finops-reconciliation",
        });
      } catch {
        console.log(`[FinOps Alert] URGENT: Persistent Overspend — "${title}" over budget for 3+ periods.`);
      }
    }
  } catch (error) {
    // Non-critical — don't block reconciliation
    console.error("[FinOps Alerts] Failed to check/notify:", error);
  }
}
