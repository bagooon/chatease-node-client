// src/validators.ts

import type { InitialStatus } from './types.js'

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

/**
 * YYYY-MM-DD 形式 & 実在する日付かをチェック
 */
export function isValidISODate(dateStr: string): boolean {
  if (!ISO_DATE_REGEX.test(dateStr)) return false

  const [y, m, d] = dateStr.split('-').map(Number)

  // UTC で日付オブジェクトを作成（タイムゾーン非依存）
  const date = new Date(Date.UTC(y, m - 1, d))

  return (
    date.getUTCFullYear() === y &&
    date.getUTCMonth() === m - 1 &&
    date.getUTCDate() === d
  )
}

/**
 * メールアドレスの簡易バリデーション
 * RFC完全準拠ではなく、実務的な最低限チェック。
 * 「本気の検証」は呼び出し側に任せる。
 */
export function isValidEmail(email: string): boolean {
  // かなり緩めのチェック（@の前後にそれなりの文字列があるか）
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return EMAIL_REGEX.test(email)
}

/**
 * boardUniqueKey のバリデーション
 *
 * ここは仕様に合わせて調整する想定。
 * 現状は：
 * - 空文字禁止
 * - 前後空白を許可しない（trimして変化するならNG）
 * - 制御文字・空白を含まない
 * - 長さ 1〜255 文字
 */
export function isValidBoardUniqueKey(key: string): boolean {
  if (!key) return false
  if (key.trim() !== key) return false
  if (key.length > 255) return false

  // 空白や制御文字を禁止（必要に応じて緩めてもOK）
  const INVALID_CHARS_REGEX = /[\s]/
  if (INVALID_CHARS_REGEX.test(key)) return false

  return true
}

/**
 * InitialStatus の timeLimit を検証
 * scheduled_for_* のときは timeLimit 必須（型でも実行時でも保証）
 */
export function validateInitialStatus(status: InitialStatus): void {
  if ('timeLimit' in status) {
    const { timeLimit } = status
    if (!timeLimit) {
      throw new Error(
        'initialStatus.timeLimit is required when statusKey is scheduled_for_*'
      )
    }
    if (!isValidISODate(timeLimit)) {
      throw new Error(
        `initialStatus.timeLimit must be a valid date in YYYY-MM-DD format. Got: ${timeLimit}`
      )
    }
  }
}