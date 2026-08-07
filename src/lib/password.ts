/*
 * Strong password generation.
 *
 * Browsers only offer to generate a password when a password manager is set up,
 * and many members will not have one, so the offer has to come from the product
 * itself.
 */

// Ambiguous glyphs are excluded on purpose: a member may read this off one
// screen and type it on another, and 0/O and 1/l/I are where that goes wrong.
const LOWER = "abcdefghijkmnopqrstuvwxyz"
const UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ"
const DIGIT = "23456789"
const SYMBOL = "!@#$%^&*?-_+="
const ALL = LOWER + UPPER + DIGIT + SYMBOL

/** Uniform random index, rejecting the biased tail of the random range. */
function randomInt(max: number): number {
  const limit = Math.floor(0xffffffff / max) * max
  const buf = new Uint32Array(1)
  let n: number
  do {
    crypto.getRandomValues(buf)
    n = buf[0]!
  } while (n >= limit)
  return n % max
}

const pick = (set: string) => set[randomInt(set.length)]!

/**
 * Generate a password that satisfies the policy in lib/validation/auth.
 *
 * One character is taken from each required class first so the result always
 * passes, then the rest is filled at random and the whole thing shuffled —
 * without the shuffle the classes would appear in a fixed order every time.
 */
export function generatePassword(length = 16): string {
  const required = [pick(LOWER), pick(UPPER), pick(DIGIT), pick(SYMBOL)]
  const rest = Array.from({ length: Math.max(0, length - required.length) }, () => pick(ALL))
  const chars = [...required, ...rest]

  // Fisher-Yates.
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1)
    ;[chars[i], chars[j]] = [chars[j]!, chars[i]!]
  }
  return chars.join("")
}
