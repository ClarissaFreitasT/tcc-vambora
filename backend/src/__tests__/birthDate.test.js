import { isAtLeast18, parseBirthDate } from '../utils/birthDate.js'

describe('birth date API validation', () => {
  const today = new Date(Date.UTC(2026, 9, 15))

  it('parses a valid Brazilian date', () => {
    expect(parseBirthDate('15/10/2008')).toEqual(new Date(Date.UTC(2008, 9, 15)))
  })

  it('accepts a person who is exactly 18', () => {
    expect(isAtLeast18(parseBirthDate('15/10/2008'), today)).toBe(true)
  })

  it('rejects a person who has not turned 18', () => {
    expect(isAtLeast18(parseBirthDate('16/10/2008'), today)).toBe(false)
  })

  it('rejects invalid calendar dates', () => {
    expect(parseBirthDate('31/02/2000')).toBeNull()
  })
})