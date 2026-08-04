"use client"

export function BookingWidget() {
  const BOOKING_URL = "https://calendar.app.google/sdPCuG2bVAXxivVd6"

  return (
    <div style={{ position: "relative", width: "100%", paddingTop: "133%", borderRadius: "10px", overflow: "hidden" }}>
      <iframe
        src={BOOKING_URL}
        title="Book an assessment call"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
      />
    </div>
  )
}
