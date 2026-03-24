export const WS_EVENTS = {
  COMPLETION_REQUEST: 'completion:request',
  COMPLETION_RESULT: 'completion:result',
  REVIEW_START: 'review:start',
  REVIEW_PROGRESS: 'review:progress',
  REVIEW_COMPLETE: 'review:complete',
  REVIEW_FILE: 'review:file',
  REVIEW_FILE_RESULT: 'review:file:result',
  CHAT_MESSAGE: 'chat:message',
  CHAT_TOKEN: 'chat:token',
  CHAT_COMPLETE: 'chat:complete',
  CHAT_STOP: 'chat:stop',
  CHAT_ERROR: 'chat:error',
} as const;
