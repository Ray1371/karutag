import { createPortal } from "react-dom";
import type { ReactNode } from "react";

export function TaggingBarPortal({ children }: { children: ReactNode }) {
  const el = document.getElementById("tagging-portal");
  if (!el) return null;
  return createPortal(children, el);
}