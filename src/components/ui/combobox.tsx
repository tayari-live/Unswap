"use client"

import { useEffect, useRef, useState } from "react"
import { Check, ChevronDown } from "lucide-react"
import { FIELD } from "@/components/ui/form"

/**
 * A point-and-click select that you can also type into. Click the field to see
 * the suggestions, click one to choose it, or type to filter. Any value is
 * allowed (allowCustom, default true), so an option not on the list can still be
 * entered — the list just saves most people from typing at all.
 */
export function Combobox({
  value,
  onChange,
  options,
  id,
  placeholder,
  allowCustom = true,
}: {
  value: string
  onChange: (value: string) => void
  options: string[]
  id?: string
  placeholder?: string
  allowCustom?: boolean
}) {
  const [open, setOpen] = useState(false)
  // null = not filtering, show the current value; a string = the user is typing.
  const [query, setQuery] = useState<string | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery(null)
      }
    }
    document.addEventListener("mousedown", onDoc)
    return () => document.removeEventListener("mousedown", onDoc)
  }, [open])

  const q = (query ?? "").trim().toLowerCase()
  const filtered = q ? options.filter((o) => o.toLowerCase().includes(q)) : options

  const pick = (o: string) => {
    onChange(o)
    setQuery(null)
    setOpen(false)
  }

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative">
        <input
          id={id}
          role="combobox"
          aria-expanded={open}
          autoComplete="off"
          className={`${FIELD} pr-10`}
          placeholder={placeholder}
          value={query ?? value}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
            if (allowCustom) onChange(e.target.value)
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              if (filtered.length > 0) pick(filtered[0])
              else setOpen(false)
            } else if (e.key === "Escape") {
              setOpen(false)
              setQuery(null)
            }
          }}
        />
        <button
          type="button"
          tabIndex={-1}
          aria-label="Show suggestions"
          onClick={() => setOpen((o) => !o)}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral hover:text-[var(--fg)]"
        >
          <ChevronDown size={18} className={`transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </div>

      {open && filtered.length > 0 && (
        <ul
          role="listbox"
          className="absolute z-30 mt-1 w-full max-h-64 overflow-auto rounded-md border border-[var(--hair)] bg-[var(--surface)] shadow-xl py-1"
        >
          {filtered.map((o) => (
            <li key={o}>
              <button
                type="button"
                onClick={() => pick(o)}
                className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between transition-colors hover:bg-[var(--gold)]/10 ${
                  o === value ? "text-[var(--gold-dark)] font-semibold" : "text-[var(--fg)]"
                }`}
              >
                <span>{o}</span>
                {o === value && <Check size={15} className="text-[var(--gold-dark)]" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
