import { PageSkeleton } from "@/components/ui/skeleton"

/*
 * Loading boundary for the member dashboard.
 *
 * Every page under here is force-dynamic, and Next.js only prefetches a dynamic
 * route as far as its nearest loading boundary. Without one at this level the
 * click did nothing visible until the server replied, so navigation felt frozen.
 * With it, the skeleton paints immediately and the shell stays interactive.
 */
export default function Loading() {
  return <PageSkeleton />
}
