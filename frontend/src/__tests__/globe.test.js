import { describe, expect, it } from '@jest/globals'
import { destinosGlobo } from '../data/destinosGlobo.js'
import { getDestinationVector, hasValidCoordinates, normalizePlaceSearch } from '../utils/globe.js'

describe('globe data helpers', () => {
  it('keeps demo destination coordinates within geographic bounds', () => {
    expect(destinosGlobo.every(hasValidCoordinates)).toBe(true)
    expect(hasValidCoordinates({ latitude: 91, longitude: 0 })).toBe(false)
    expect(hasValidCoordinates({ latitude: 0, longitude: -181 })).toBe(false)
  })

  it('normalizes accents and letter case for place searches', () => {
    expect(normalizePlaceSearch('  TÓQUIO ')).toBe('toquio')
    expect(normalizePlaceSearch('CIDADE DO CABO')).toBe('cidade do cabo')
  })

  it('maps latitude and longitude to a point on the requested sphere', () => {
    const equator = getDestinationVector(0, 90, 2)
    const greenwich = getDestinationVector(0, 0, 2)
    const northPole = getDestinationVector(90, 42, 3)
    expect(equator[0]).toBeCloseTo(0)
    expect(equator[1]).toBeCloseTo(0)
    expect(equator[2]).toBeCloseTo(-2)
    expect(greenwich[0]).toBeCloseTo(2)
    expect(greenwich[2]).toBeCloseTo(0)
    expect(Math.hypot(...northPole)).toBeCloseTo(3)
    expect(northPole[1]).toBeCloseTo(3)
  })
})
