// Addresses that must never reach a marketing or waitlist provider:
// non-deliverable TLDs and known security-scanner patterns (for example the
// scan-…@blockaid-scan.invalid account a scanner created by submitting the
// public forms). Filtering them protects sender reputation and bounce rates.
export function isJunkEmail(email: string): boolean {
  const e = email.trim().toLowerCase()
  if (!e) return true
  if (/\.(invalid|test|local|localhost|example)$/.test(e)) return true
  if (/@(example|test)\./.test(e)) return true
  if (/(^|[._-])(scan|scanner|blockaid|mailosaur|virustotal)([._-]|@)/.test(e)) return true
  return false
}
