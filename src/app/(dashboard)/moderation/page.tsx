import { listReports } from "@/server/services/moderation"
import ModerationClient, { type ModReport } from "./moderation-client"

export const dynamic = "force-dynamic"

export default async function ModerationPage() {
  const reports = await listReports("open")
  const rows: ModReport[] = reports.map((r) => ({
    id: r.id,
    targetType: r.targetType,
    reason: r.reason,
    createdAt: r.createdAt.toISOString(),
    reporter: { fullName: r.reporter.fullName, avatarInitials: r.reporter.avatarInitials },
    content: r.content,
  }))
  return <ModerationClient initial={rows} />
}
