import { NextResponse } from "next/server"
import { prisma } from "@/server/prisma"
import { requireAdmin, toErrorResponse } from "@/server/http"

// GET /api/notifications — latest notifications for the header bell.
export async function GET() {
  try {
    await requireAdmin()
    const items = await prisma.notification.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    })
    return NextResponse.json(items)
  } catch (err) {
    return toErrorResponse(err)
  }
}

// PATCH /api/notifications — mark all notifications read.
export async function PATCH() {
  try {
    await requireAdmin()
    await prisma.notification.updateMany({ where: { read: false }, data: { read: true } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return toErrorResponse(err)
  }
}
