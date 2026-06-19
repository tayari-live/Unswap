import { NextRequest, NextResponse } from "next/server"
import { stripe, handleWebhookEvent } from "@/server/services/billing"

// POST /api/billing/webhook — Stripe events. Verifies the signature against
// STRIPE_WEBHOOK_SECRET, then applies the event to subscription state.
export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!stripe || !secret) {
    return NextResponse.json({ error: "Billing not configured." }, { status: 503 })
  }

  const body = await req.text() // raw body required for signature verification
  const sig = req.headers.get("stripe-signature")
  if (!sig) return NextResponse.json({ error: "Missing signature." }, { status: 400 })

  let event
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret)
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook signature verification failed: ${err.message}` }, { status: 400 })
  }

  try {
    await handleWebhookEvent(event)
  } catch (err) {
    console.error("Webhook handling error:", err)
    return NextResponse.json({ error: "Webhook handler failed." }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
