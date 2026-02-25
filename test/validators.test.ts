// test/validators.test.ts
import { describe, it, expect } from 'vitest'
import {
  isValidISODate,
  isValidEmail,
  isValidBoardUniqueKey,
  validateInitialStatus,
} from '../src/validators.js'
import type { InitialStatus } from '../src/types.js'

describe('isValidISODate', () => {
  it('accepts valid YYYY-MM-DD dates', () => {
    expect(isValidISODate('2026-02-25')).toBe(true)
    expect(isValidISODate('2024-02-29')).toBe(true) // うるう年
  })

  it('rejects invalid format', () => {
    expect(isValidISODate('2026/02/25')).toBe(false)
    expect(isValidISODate('2026-2-5')).toBe(false)
    expect(isValidISODate('20260225')).toBe(false)
    expect(isValidISODate('')).toBe(false)
  })

  it('rejects non-existent dates', () => {
    expect(isValidISODate('2026-02-30')).toBe(false)
    expect(isValidISODate('2023-13-01')).toBe(false)
    expect(isValidISODate('2023-00-10')).toBe(false)
  })
})

describe('isValidEmail', () => {
  it('accepts typical valid emails', () => {
    expect(isValidEmail('taro@example.com')).toBe(true)
    expect(isValidEmail('user.name+tag@sub.domain.co.jp')).toBe(true)
  })

  it('rejects invalid emails', () => {
    expect(isValidEmail('plainaddress')).toBe(false)
    expect(isValidEmail('user@')).toBe(false)
    expect(isValidEmail('@example.com')).toBe(false)
    expect(isValidEmail('user@example')).toBe(false)
    expect(isValidEmail('user example@example.com')).toBe(false)
  })
})

describe('isValidBoardUniqueKey', () => {
  it('accepts reasonable keys', () => {
    expect(isValidBoardUniqueKey('20260225-0001')).toBe(true)
    expect(isValidBoardUniqueKey('order-ABC123')).toBe(true)
  })

  it('rejects empty or whitespace-only keys', () => {
    expect(isValidBoardUniqueKey('')).toBe(false)
    expect(isValidBoardUniqueKey('   ')).toBe(false)
  })

  it('rejects keys with whitespace', () => {
    expect(isValidBoardUniqueKey('has space')).toBe(false)
    expect(isValidBoardUniqueKey('tab\tinside')).toBe(false)
    expect(isValidBoardUniqueKey('newline\ninside')).toBe(false)
  })

  it('rejects too long keys', () => {
    const longKey = 'a'.repeat(256)
    expect(isValidBoardUniqueKey(longKey)).toBe(false)
  })
})

describe('validateInitialStatus', () => {
  it('accepts scheduled_for_* with valid timeLimit', () => {
    const status: InitialStatus = {
      statusKey: 'scheduled_for_response',
      timeLimit: '2026-02-28',
    }
    expect(() => validateInitialStatus(status)).not.toThrow()
  })

  it('throws if scheduled_for_* without timeLimit (型的には書けないが念のため)', () => {
    const status = {
      statusKey: 'scheduled_for_response',
      timeLimit: '' as unknown as string,
    } as InitialStatus

    expect(() => validateInitialStatus(status)).toThrowError(
      /timeLimit is required/
    )
  })

  it('throws if scheduled_for_* with invalid date', () => {
    const status: InitialStatus = {
      statusKey: 'scheduled_for_completion',
      timeLimit: '2026-02-31',
    }

    expect(() => validateInitialStatus(status)).toThrowError(
      /must be a valid date/
    )
  })

  it('does not require timeLimit for waiting_for_reply', () => {
    const status: InitialStatus = {
      statusKey: 'waiting_for_reply',
      // timeLimit は指定不可 (never) だが、実行時検証では何もしない
    }

    expect(() => validateInitialStatus(status)).not.toThrow()
  })
})