import { describe, expect, it } from 'vitest'
import { evaluateAnswer, parseAlternates } from './answerEval.ts'

describe('parseAlternates', () => {
  it('returns empty array for undefined notes', () => {
    expect(parseAlternates(undefined)).toEqual([])
  })

  it('returns empty array for empty string', () => {
    expect(parseAlternates('')).toEqual([])
  })

  it('splits pipe-delimited values and trims whitespace', () => {
    expect(parseAlternates('to go | to leave | to depart')).toEqual([
      'to go',
      'to leave',
      'to depart',
    ])
  })

  it('filters out empty segments', () => {
    expect(parseAlternates('hello||world')).toEqual(['hello', 'world'])
  })
})

describe('evaluateAnswer', () => {
  it('returns correct for exact match', () => {
    const result = evaluateAnswer('water', 'water', [])
    expect(result.isCorrect).toBe(true)
  })

  it('is case-insensitive', () => {
    const result = evaluateAnswer('Water', 'water', [])
    expect(result.isCorrect).toBe(true)
  })

  it('trims leading/trailing whitespace', () => {
    const result = evaluateAnswer('  water  ', 'water', [])
    expect(result.isCorrect).toBe(true)
  })

  it('accepts alternate answers', () => {
    const result = evaluateAnswer('to leave', 'to go', ['to leave', 'to depart'])
    expect(result.isCorrect).toBe(true)
  })

  it('returns incorrect for wrong answer', () => {
    const result = evaluateAnswer('fire', 'water', [])
    expect(result.isCorrect).toBe(false)
    expect(result.hint).toBeUndefined()
  })

  it('returns hint when answer matches ignoring diacritics', () => {
    const result = evaluateAnswer('omi', 'omí', [])
    expect(result.isCorrect).toBe(false)
    expect(result.hint).toBe('Almost! Check your tone marks.')
  })

  it('returns hint for underdot mismatch', () => {
    const result = evaluateAnswer('ese', 'ẹsẹ', [])
    expect(result.isCorrect).toBe(false)
    expect(result.hint).toBe('Almost! Check your tone marks.')
  })

  it('returns correct when diacritics match exactly', () => {
    const result = evaluateAnswer('omí', 'omí', [])
    expect(result.isCorrect).toBe(true)
  })
})
