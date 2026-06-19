import { getAnalytics } from "@/server/services/analytics"
import AnalyticsClient from "./analytics-client"

export const dynamic = "force-dynamic"

export default async function AnalyticsPage() {
  const data = await getAnalytics()
  return <AnalyticsClient data={data} />
}
