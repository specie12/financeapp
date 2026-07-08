import { getApiErrorMessage } from '../api-error'

describe('getApiErrorMessage', () => {
  it('reads a string message from an axios-style error', () => {
    const err = { response: { data: { message: 'Validation failed' } } }
    expect(getApiErrorMessage(err)).toBe('Validation failed')
  })

  it('joins an array of validation messages', () => {
    const err = { response: { data: { message: ['name is required', 'value must be a number'] } } }
    expect(getApiErrorMessage(err)).toBe('name is required, value must be a number')
  })

  it('falls back to an Error message', () => {
    expect(getApiErrorMessage(new Error('network down'))).toBe('network down')
  })

  it('uses the provided fallback when nothing usable is present', () => {
    expect(getApiErrorMessage({}, 'Could not save.')).toBe('Could not save.')
  })
})
