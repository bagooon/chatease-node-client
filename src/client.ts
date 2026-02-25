// src/client.ts
import type {
  ChatEaseClientOptions,
  CreateBoardBaseParams,
  CreateBoardWithStatusParams,
  CreateBoardWithStatusAndMessageParams,
  CreateBoardRequestBody,
  CreateBoardResponse,
} from './types.js'
import {
  isValidBoardUniqueKey,
  isValidEmail,
  validateInitialStatus,
} from './validators.js'

export class ChatEaseClient {
  private readonly apiToken: string
  private readonly workspaceSlug: string
  private readonly baseUrl: string

  constructor(options: ChatEaseClientOptions) {
    if (typeof window !== 'undefined') {
      throw new Error(
        'ChatEaseClient is for Node.js only. Do not use it in the browser (API token leak risk).'
      )
    }

    if (!options.apiToken) {
      throw new Error('ChatEaseClient: apiToken is required')
    }
    if (!options.workspaceSlug) {
      throw new Error('ChatEaseClient: workspaceSlug is required')
    }

    this.apiToken = options.apiToken
    this.workspaceSlug = options.workspaceSlug
    this.baseUrl = options.baseUrl ?? 'https://chatease.jp'

    if (typeof fetch !== 'function') {
      throw new Error(
        'ChatEaseClient requires global fetch (Node.js v18+).'
      )
    }
  }

  async createBoard(
    params: CreateBoardBaseParams
  ): Promise<CreateBoardResponse> {
    return this._createBoard(params)
  }

  async createBoardWithStatus(
    params: CreateBoardWithStatusParams
  ): Promise<CreateBoardResponse> {
    return this._createBoard(params)
  }

  async createBoardWithStatusAndMessage(
    params: CreateBoardWithStatusAndMessageParams
  ): Promise<CreateBoardResponse> {
    return this._createBoard(params)
  }

  /**
   * 実処理 + 共通バリデーション
   */
  private async _createBoard(
    params:
      | CreateBoardBaseParams
      | CreateBoardWithStatusParams
      | CreateBoardWithStatusAndMessageParams
  ): Promise<CreateBoardResponse> {
    this.validateParams(params)

    const body: CreateBoardRequestBody = {
      workspaceSlug: this.workspaceSlug,
      ...params,
    }

    const res = await fetch(this.buildUrl('/api/v1/board'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Chatease-API-Token': this.apiToken,
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      const message = [
        `ChatEase API error: ${res.status} ${res.statusText}`,
        text && `Body: ${text}`,
      ]
        .filter(Boolean)
        .join(' - ')
      throw new Error(message)
    }

    const json = (await res.json()) as CreateBoardResponse
    return json
  }

  /**
   * 呼び出しパラメータのバリデーション
   * - email 形式チェック
   * - boardUniqueKey 妥当性チェック
   * - initialStatus があれば timeLimit を検証
   */
  private validateParams(
    params:
      | CreateBoardBaseParams
      | CreateBoardWithStatusParams
      | CreateBoardWithStatusAndMessageParams
  ): void {
    const { guest, boardUniqueKey } = params

    if (!guest?.email) {
      throw new Error('guest.email is required')
    }
    if (!isValidEmail(guest.email)) {
      throw new Error(`guest.email is invalid: ${guest.email}`)
    }

    if (!isValidBoardUniqueKey(boardUniqueKey)) {
      throw new Error(
        `boardUniqueKey is invalid. It must be a non-empty string without whitespace and <= 255 chars. Got: "${boardUniqueKey}"`
      )
    }

    if ('initialStatus' in params && params.initialStatus) {
      validateInitialStatus(params.initialStatus)
    }
  }

  private buildUrl(path: string): string {
    return `${this.baseUrl.replace(/\/+$/, '')}${path}`
  }
}