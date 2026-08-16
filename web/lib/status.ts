export const MESSAGE_STATUSES = [
  "received",
  "reviewing",
  "answered",
  "closed",
] as const;

export type MessageStatus = (typeof MESSAGE_STATUSES)[number];

export type StatusStyle = { label: string; note: string; tone: string };

export const STATUS_STYLES: Record<MessageStatus, StatusStyle> = {
  received: {
    label: "statusReceived",
    note: "statusReceivedNote",
    tone: "border-ash/40 text-ash",
  },
  reviewing: {
    label: "statusReviewing",
    note: "statusReviewingNote",
    tone: "border-brass/50 text-brass",
  },
  answered: {
    label: "statusAnswered",
    note: "statusAnsweredNote",
    tone: "border-emerald-500/50 text-emerald-400",
  },
  closed: {
    label: "statusClosed",
    note: "statusClosedNote",
    tone: "border-line-strong text-bone",
  },
};

export const UNKNOWN_STATUS: StatusStyle = {
  label: "statusUnknown",
  note: "",
  tone: "border-line-strong text-ash",
};

export function statusStyle(value: string): StatusStyle {
  return STATUS_STYLES[value as MessageStatus] ?? UNKNOWN_STATUS;
}
