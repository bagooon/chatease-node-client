<a href="https://chatease.jp/"><img width="500" height="106" alt="ChatEase logo" src="./.github/assets/chatease_logo.svg" /></a>

# @bagooon/chatease-node-client

[![npm version](https://img.shields.io/npm/v/@bagooon/chatease-node-client.svg)](https://www.npmjs.com/package/@bagooon/chatease-node-client)
[![CI](https://github.com/bagooon/chatease-node-client/actions/workflows/ci.yml/badge.svg)](https://github.com/bagooon/chatease-node-client/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Node.js 向けの **[ChatEase](https://chatease.jp "ChatEase.jp") チャットボード新規追加 API クライアント** です。  
サーバーサイド（Node.js）専用で、ブラウザからの利用は想定していません。

> ⚠️ This package is **Node.js-only**.  
> Do **NOT** use it in browser environments. Your API token will be exposed.

---

## Features

- ChatEase の「チャットボード生成 API」を安全にラップ
- 3パターンのメソッドを提供
  - チャットボード生成のみ
  - チャットボード + 初期ステータス
  - チャットボード + 初期ステータス + 初期投稿
- ワークスペース名取得メソッド `getWorkspaceName()` を提供
- TypeScript フルサポート（型定義同梱）
- 実行時バリデーション
  - `timeLimit` の日付妥当性（`YYYY-MM-DD` & 実在日付）
  - `guest.email` の簡易フォーマットチェック
  - `boardUniqueKey` の妥当性チェック

---

## Requirements

- Node.js **18+** （グローバル `fetch` が必要）
- ChatEase のワークスペーススラッグ & API トークン
- サーバーサイド（Node.js）環境のみ

---

## Installation

```bash
npm install @bagooon/chatease-node-client
# or
yarn add @bagooon/chatease-node-client
# or
pnpm add @bagooon/chatease-node-client
```

---

## Quick Start

```ts
import { ChatEaseClient } from '@bagooon/chatease-node-client'

const chatease = new ChatEaseClient({
  apiToken: process.env.CHATEASE_API_TOKEN!,
  workspaceSlug: 'your-workspace-slug',
})

// 1) チャットボードのみ生成
const res1 = await chatease.createBoard({
  title: 'お問い合わせ #1001',
  guest: {
    name: '田中太郎',
    email: 'taro@example.com',
  },
  boardUniqueKey: '20260225-1001',
})

console.log(res1.guestURL)

// 2) 初期ステータス付きで生成
const res2 = await chatease.createBoardWithStatus({
  title: '見積依頼 #1002',
  guest: {
    name: 'Suzuki Hanako',
    email: 'hanako@example.com',
  },
  boardUniqueKey: '20260225-1002',
  initialStatus: {
    statusKey: 'scheduled_for_response',
    timeLimit: '2026-02-28', // YYYY-MM-DD
  },
})

// 3) 初期ステータス + 初期投稿付きで生成
const res3 = await chatease.createBoardWithStatusAndMessage({
  title: 'デザイン相談 #1003',
  guest: {
    name: 'John Smith',
    email: 'john@example.com',
  },
  boardUniqueKey: '20260225-1003',
  initialStatus: {
    statusKey: 'scheduled_for_proof',
    timeLimit: '2026-03-05',
  },
  initialGuestComment: {
    content: 'ロゴデザインについて相談したいです。現在の案を添付しました。',
  },
})

// 4) ワークスペース名を取得
//   （APIトークン＋ワークスペーススラッグが正しく設定されているかを確認する用途に利用できます。)
const workdpaceName = await chatease.getWorkspaceName()
```

---

## API

### `new ChatEaseClient(options)`

```ts
interface ChatEaseClientOptions {
  apiToken: string
  workspaceSlug: string
  baseUrl?: string // default: 'https://chatease.jp'
}
```

- `apiToken` – ChatEase の API トークン
- `workspaceSlug` – ワークスペースの slug
- `baseUrl` – ステージングなどを使う場合に差し替え。通常は指定不要。

ブラウザ環境（window が存在する）で呼び出すと、即座にエラーを投げます。

---

### `createBoard(params)`

```ts
interface GuestInfo {
  name: string
  email: string
}

interface CreateBoardBaseParams {
  title: string
  guest: GuestInfo
  boardUniqueKey: string
  inReplyTo?: string
}

createBoard(params: CreateBoardBaseParams): Promise<CreateBoardResponse>
```

最低限の情報でチャットボードを生成します。

- `boardUniqueKey` は同じ値で再度呼び出すと、既存ボードが返ってくる仕様です
- `guest.email` は簡易フォーマットチェックが行われます
- `boardUniqueKey` は空文字や空白を含む値は拒否されます

---

### `createBoardWithStatus(params)`

```ts
type InitialStatus =
  | {
      statusKey:
        | 'scheduled_for_proof'  // 校正予定
        | 'scheduled_for_response'  // 返答予定
        | 'scheduled_for_completion'  // 完了予定
      timeLimit: string // YYYY-MM-DD
    }
  | {
      statusKey: 'waiting_for_reply'  // 返答待ち
      timeLimit: never // 日付は指定できません
    }

interface CreateBoardWithStatusParams extends CreateBoardBaseParams {
  initialStatus: InitialStatus
}

createBoardWithStatus(
  params: CreateBoardWithStatusParams
): Promise<CreateBoardResponse>
```

- `scheduled_for_*` の場合は timeLimit が必須
- `waiting_for_reply` の場合は timeLimit は指定できません（型でも実行時でも防止）

---

### `createBoardWithStatusAndMessage(params)`

```ts
interface InitialGuestComment {
  content: string
}

interface CreateBoardWithStatusAndMessageParams
  extends CreateBoardBaseParams {
  initialStatus: InitialStatus
  initialGuestComment: InitialGuestComment
}

createBoardWithStatusAndMessage(
  params: CreateBoardWithStatusAndMessageParams
): Promise<CreateBoardResponse>
```

初回のゲスト投稿までまとめて登録する場合に使います。

---

### `CreateBoardResponse`

```ts
interface CreateBoardResponse {
  slug: string
  hostURL: string
  guestURL: string
}
```

- `slug` – ボードの識別子
- `hostURL` – ホスト（管理側）用 URL
- `guestURL` – ゲスト側 URL（メールに貼るなど）

---

### `getWorkspaceName()`

```ts
getWorkspaceName(): Promise<string>
```

認証には既存の API トークンヘッダー（`X-Chatease-API-Token`）と、リクエストボディの `workspaceSlug` を使用します。  
APIトークン＋ワークスペーススラッグが正しく設定されているかを確認する用途に利用できます。
認証に失敗した場合は、例外を投げます。

---

## Validation

このクライアントは、API 呼び出し前に以下の実行時チェックを行います：

- guest.email – 簡易メール形式チェック
- boardUniqueKey
    - 空文字禁止
    - 前後の空白禁止
    - 空白文字（スペース・タブ・改行など）を含まない
    - 最大 255 文字まで
- initialStatus.timeLimit
    - scheduled_for_* の場合は必須
    - YYYY-MM-DD 形式
    - 実在する日付か確認（うるう年を含む）

バリデーションエラーの場合、API は呼び出されず Error が投げられます。

---

## Development

ローカル開発用コマンド：

```bash
# 依存関係インストール
npm install

# テスト実行（1回）
npm run test

# テストをウォッチモードで実行
npm run test:watch

# ビルド
npm run build
```

リリース前チェック：

```bash
# テスト & ビルド
npm run test
npm run build
```

`npm publish` 時には自動的に `npm run test && npm run build` が実行されます。

---

## License

MIT
