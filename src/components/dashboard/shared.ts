export const EXPO_OUT = [0.16, 1, 0.3, 1] as const;
export const SIDEBAR_SPRING = { type: "spring" as const, stiffness: 500, damping: 32, mass: 0.7 };
export const SKY_BG = "linear-gradient(135deg, #0ea5e9, #38bdf8)";

export type UIBlock = { component: "email_list" | "email_card" | "event_list" | "email_draft"; data: unknown };
export interface Message { id: number; role: "user" | "assistant"; text: string; blocks?: UIBlock[]; }
export interface Conversation { id: string; title: string; messages: Message[]; loadingTitle?: boolean; }
