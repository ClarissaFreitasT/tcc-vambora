import { describe, expect, it } from '@jest/globals'
import { getAdultBirthDateIso, maskBrazilianDate } from '../utils/birthDate.js'

describe('birth date registration validation', () => {
  const today = new Date(2026, 9, 15)

  it('formats input as DD/MM/YYYY', () => {
    expect(maskBrazilianDate('15052008')).toBe('15/05/2008')
  })

  it('accepts a person who is exactly 18 today', () => {
    expect(getAdultBirthDateIso('15/10/2008', today)).toBe('2008-10-15')
  })

  it('rejects a person who has not turned 18 yet', () => {
    expect(getAdultBirthDateIso('16/10/2008', today)).toBeNull()
  })

  it('rejects impossible dates', () => {
    expect(getAdultBirthDateIso('31/02/2000', today)).toBeNull()
  })
})