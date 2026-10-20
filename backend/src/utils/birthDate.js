export function parseBirthDate(value) {
  if (typeof value !== "string") return null;

  const brazilianDate = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  const isoDate = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!brazilianDate && !isoDate) return null;

  const year = Number(brazilianDate ? brazilianDate[3] : isoDate[1]);
  const month = Number(brazilianDate ? brazilianDate[2] : isoDate[2]);
  const day = Number(brazilianDate ? brazilianDate[1] : isoDate[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
}

export function isAtLeast18(birthDate, today = new Date()) {
  let age = today.getUTCFullYear() - birthDate.getUTCFullYear();
  if (
    today.getUTCMonth() < birthDate.getUTCMonth() ||
    (today.getUTCMonth() === birthDate.getUTCMonth() &&
      today.getUTCDate() < birthDate.getUTCDate())
  ) {
    age -= 1;
  }
  return age >= 18;
}