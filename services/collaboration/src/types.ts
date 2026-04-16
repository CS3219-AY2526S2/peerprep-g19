// Client -> Server messages
export type JoinMessage = { type: "join"; userId: string; username: string; token: string };
export type EndSessionMessage = { type: "end-session" };
export type LanguageChangeMessage = { type: "language-change"; language: string };
export type ChatMessage = { type: "chat"; text: string };
export type ClientMessage = JoinMessage | EndSessionMessage | LanguageChangeMessage | ChatMessage;

// Server -> Client messages
export type UserJoinedMessage = { type: "user-joined"; userId: string; username: string; userCount: number };
export type SessionEndedMessage = { type: "session-ended"; endedBy: string };
export type UserDisconnectedMessage = { type: "user-disconnected"; userId: string; username: string };
export type LanguageChangedMessage = { type: "language-changed"; language: string; changedBy: string };
export type ChatReceivedMessage = { type: "chat-received"; userId: string; username: string; text: string; timestamp: number };
export type ErrorMessage = { type: "error"; code: string; message: string };
export type ServerMessage =
  | UserJoinedMessage
  | SessionEndedMessage
  | UserDisconnectedMessage
  | LanguageChangedMessage
  | ChatReceivedMessage
  | ErrorMessage;
