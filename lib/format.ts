import { site } from './site'

/** Parse a `YYYY-MM-DD` string as a *local* date (avoids UTC off-by-one). */
function parseISODate(date: string): Date {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(year, (month ?? 1) - 1, day ?? 1)
}

export function formatDateLong(date: string): string {
  return new Intl.DateTimeFormat(site.locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(parseISODate(date))
}

export function formatDateMedium(date: string): string {
  return new Intl.DateTimeFormat(site.locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(parseISODate(date))
}

export function formatWeekday(date: string): string {
  return new Intl.DateTimeFormat(site.locale, { weekday: 'long' }).format(parseISODate(date))
}

export function formatDay(date: string): string {
  return new Intl.DateTimeFormat(site.locale, { day: '2-digit' }).format(parseISODate(date))
}

export function formatMonthShort(date: string): string {
  return new Intl.DateTimeFormat(site.locale, { month: 'short' }).format(parseISODate(date))
}

const RELATIVE = new Intl.RelativeTimeFormat(site.locale, { numeric: 'auto' })

export function formatRelativeFromNow(iso: string): string {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''
  const diff = then - Date.now()
  const abs = Math.abs(diff)
  if (abs < 3_600_000) return RELATIVE.format(Math.round(diff / 60_000), 'minute')
  if (abs < 86_400_000) return RELATIVE.format(Math.round(diff / 3_600_000), 'hour')
  if (abs < 7 * 86_400_000) return RELATIVE.format(Math.round(diff / 86_400_000), 'day')
  return formatDateMedium(iso.slice(0, 10))
}

export function languageLabel(code: string): string {
  try {
    const names = new Intl.DisplayNames([site.locale], { type: 'language' })
    return names.of(code) ?? code.toUpperCase()
  } catch {
    return code.toUpperCase()
  }
}
