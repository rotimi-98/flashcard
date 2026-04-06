import { describe, expect, it } from 'vitest'
import { fisherYatesShuffle } from './shuffle.ts'

describe('fisherYatesShuffle', () => {
  it('returns a new array and does not mutate the original', () => {
    const input = [1, 2, 3]
    const out = fisherYatesShuffle(input)
    expect(out).not.toBe(input)
    expect(input).toEqual([1, 2, 3])
  })

  it('output length equals input length and contains all original elements', () => {
    const input = ['a', 'b', 'c', 'd', 'e']
    const out = fisherYatesShuffle(input)
    expect(out).toHaveLength(input.length)
    expect([...out].sort()).toEqual([...input].sort())
  })

  it('produces at least 5 distinct orderings over 100 runs on a 10-item array', () => {
    const base = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
    const orderings = new Set<string>()
    for (let i = 0; i < 100; i++) {
      orderings.add(fisherYatesShuffle(base).join(','))
    }
    expect(orderings.size).toBeGreaterThanOrEqual(5)
  })
})
