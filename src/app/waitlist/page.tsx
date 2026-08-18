import { WaitlistClient } from "./waitlist-client"

export const metadata = {
  title: "Join the Waitlist",
  description:
    "Join the UnSwap waitlist, a closed-loop home exchange ecosystem for verified UN, World Bank, IMF and international organisation staff.",
}

export default function WaitlistPage() {
  return <WaitlistClient />
}
