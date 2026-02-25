// test/client.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ChatEaseClient } from '../src/client.js'
import type {
  CreateBoardBaseParams,
  CreateBoardWithStatusParams,
} from '../src/types.js'

describe('ChatEaseClient', () => {
  const apiToken = 'test-token'
  const workspaceSlug = 'test-workspace'
  const baseUrl = 'https://example.com' // ステージング的なURL想定

  beforeEach(() => {
    // fetch を毎回リセット
    vi.restoreAllMocks()

    // Node 18 でも一応上書きしておく
    ;(globalThis as any).fetch = vi.fn(async () => {
      return {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({
          slug: 'board-slug',
          hostURL: 'https://host.example.com/board-slug',
          guestURL: 'https://guest.example.com/board-slug',
        }),
        text: async () => '',
      }
    })
  })

  it('throws in non-node environments (window defined) – シミュレーション', () => {
    // window を仮定してみる
    ;(globalThis as any).window = {}

    expect(
      () =>
        new ChatEaseClient({
          apiToken,
          workspaceSlug,
        })
    ).toThrowError(/Node\.js only/)

    // 後片付け
    delete (globalThis as any).window
  })

  it('creates a board with minimal params', async () => {
    const client = new ChatEaseClient({
      apiToken,
      workspaceSlug,
      baseUrl,
    })

    const params: CreateBoardBaseParams = {
      title: 'お問い合わせ #1',
      guest: {
        name: 'Taro',
        email: 'taro@example.com',
      },
      boardUniqueKey: '20260225-0001',
    }

    const res = await client.createBoard(params)

    expect(globalThis.fetch).toHaveBeenCalledTimes(1)
    const [url, options] = (globalThis.fetch as any).mock.calls[0]

    expect(url).toBe(`${baseUrl}/api/v1/board`)
    expect(options.method).toBe('POST')
    expect(options.headers['X-Chatease-API-Token']).toBe(apiToken)

    const body = JSON.parse(options.body)
    expect(body.workspaceSlug).toBe(workspaceSlug)
    expect(body.title).toBe(params.title)
    expect(body.guest.email).toBe(params.guest.email)
    expect(body.boardUniqueKey).toBe(params.boardUniqueKey)

    expect(res.slug).toBe('board-slug')
    expect(res.guestURL).toContain('board-slug')
  })

  it('creates a board with status', async () => {
    const client = new ChatEaseClient({
      apiToken,
      workspaceSlug,
      baseUrl,
    })

    const params: CreateBoardWithStatusParams = {
      title: '見積依頼 #2',
      guest: {
        name: 'Hanako',
        email: 'hanako@example.com',
      },
      boardUniqueKey: '20260225-0002',
      initialStatus: {
        statusKey: 'scheduled_for_response',
        timeLimit: '2026-03-01',
      },
    }

    await client.createBoardWithStatus(params)

    const [, options] = (globalThis.fetch as any).mock.calls[0]
    const body = JSON.parse(options.body)

    expect(body.initialStatus.statusKey).toBe('scheduled_for_response')
    expect(body.initialStatus.timeLimit).toBe('2026-03-01')
  })

  it('throws on invalid email', async () => {
    const client = new ChatEaseClient({
      apiToken,
      workspaceSlug,
      baseUrl,
    })

    const params: CreateBoardBaseParams = {
      title: 'invalid mail',
      guest: {
        name: 'Invalid',
        email: 'not-an-email',
      },
      boardUniqueKey: '20260225-0003',
    }

    await expect(client.createBoard(params)).rejects.toThrowError(
      /guest\.email is invalid/
    )

    // fetch が呼ばれていないことも確認（検証で落ちている）
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })

  it('throws on invalid boardUniqueKey', async () => {
    const client = new ChatEaseClient({
      apiToken,
      workspaceSlug,
      baseUrl,
    })

    const params: CreateBoardBaseParams = {
      title: 'invalid key',
      guest: {
        name: 'Taro',
        email: 'taro@example.com',
      },
      boardUniqueKey: 'has space',
    }

    await expect(client.createBoard(params)).rejects.toThrowError(
      /boardUniqueKey is invalid/
    )

    expect(globalThis.fetch).not.toHaveBeenCalled()
  })

  it('throws descriptive error when API returns non-OK', async () => {
    ;(globalThis as any).fetch = vi.fn(async () => {
      return {
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ error: 'Bad request' }),
        text: async () => '{"error":"Bad request"}',
      }
    })

    const client = new ChatEaseClient({
      apiToken,
      workspaceSlug,
      baseUrl,
    })

    const params: CreateBoardBaseParams = {
      title: 'bad request',
      guest: {
        name: 'Taro',
        email: 'taro@example.com',
      },
      boardUniqueKey: '20260225-0004',
    }

    await expect(client.createBoard(params)).rejects.toThrowError(
      /ChatEase API error: 400 Bad Request/
    )
  })
})