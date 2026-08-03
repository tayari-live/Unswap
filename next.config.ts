import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The public waitlist moved from /join to /waitlist. Keep old links
  // (shared referral URLs, past emails) working.
  async redirects() {
    return [
      { source: "/join", destination: "/waitlist", permanent: true },
      { source: "/join/success", destination: "/waitlist/success", permanent: true },
    ];
  },
};

export default nextConfig;
