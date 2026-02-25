// src/types.ts

export type ChatEaseStatusKey =
  | 'scheduled_for_proof'
  | 'scheduled_for_response'
  | 'scheduled_for_completion'
  | 'waiting_for_reply'

type ScheduledStatusKey =
  | 'scheduled_for_proof'
  | 'scheduled_for_response'
  | 'scheduled_for_completion'

type NonScheduledStatusKey = 'waiting_for_reply'

export type InitialStatus =
  | {
      statusKey: ScheduledStatusKey
      /**
       * scheduled_for_* の場合は必須
       * YYYY-MM-DD
       */
      timeLimit: string
    }
  | {
      statusKey: NonScheduledStatusKey
      /**
       * scheduled 以外は timeLimit を指定させない
       */
      timeLimit?: never
    }

export interface ChatEaseClientOptions {
  apiToken: string
  workspaceSlug: string
  baseUrl?: string
}

export interface GuestInfo {
  name: string
  email: string
}

export interface InitialGuestComment {
  content: string
}

export interface CreateBoardBaseParams {
  title: string
  guest: GuestInfo
  boardUniqueKey: string
  inReplyTo?: string
}

export interface CreateBoardWithStatusParams extends CreateBoardBaseParams {
  initialStatus: InitialStatus
}

export interface CreateBoardWithStatusAndMessageParams
  extends CreateBoardBaseParams {
  initialStatus: InitialStatus
  initialGuestComment: InitialGuestComment
}

export interface CreateBoardRequestBody
  extends CreateBoardBaseParams {
  workspaceSlug: string
  inReplyTo?: string
  initialStatus?: InitialStatus
  initialGuestComment?: InitialGuestComment
}

export interface CreateBoardResponse {
  slug: string
  hostURL: string
  guestURL: string
}