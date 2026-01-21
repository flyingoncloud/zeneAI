// src/lib/routes.ts
import type { View } from "@/hooks/useZenemeStore";

export const VIEW_QUERY_KEY = "view" as const;

// ✅ 路由层只认这些（new-chat 不是页面，只是动作）
export type RoutableView = Exclude<View, "new-chat">;

export const DEFAULT_VIEW: RoutableView = "chat";

export function isRoutableView(v: string | null): v is RoutableView {
  switch (v) {
    case "chat":
    case "sketch":
    case "test":
    case "mood":
    case "first-aid":
    case "breathing":
    case "naming":
    case "history":
      return true;
    default:
      return false;
  }
}

export function viewToHref(view: RoutableView): string {
  if (view === DEFAULT_VIEW) return "/";
  return `/?${VIEW_QUERY_KEY}=${encodeURIComponent(view)}`;
}
