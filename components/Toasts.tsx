"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";
import { Toast, ToastStack, useToastStack } from "@/components/motion-ui/toast-stack";

const TOAST_MS = 3200;

/**
 * Auto-dismissing toast queue over Motion UI's `toast-stack`.
 * `notify(message)` queues a toast and removes it after TOAST_MS.
 */
export function useToasts() {
  const { toasts, add, dismiss } = useToastStack();
  const [messages, setMessages] = useState<Map<number, string>>(() => new Map());
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const notify = useCallback(
    (message: string) => {
      const id = add();
      setMessages((prev) => new Map(prev).set(id, message));
      const timer = setTimeout(() => {
        timers.current.delete(id);
        dismiss(id);
        setMessages((prev) => {
          const next = new Map(prev);
          next.delete(id);
          return next;
        });
      }, TOAST_MS);
      timers.current.set(id, timer);
    },
    [add, dismiss],
  );

  const renderToastStack = useCallback(
    () => (
      <ToastStack maxVisible={3} className="z-50">
        {toasts.map((id) => (
          <Toast key={id}>
            <div className="rounded-lg border border-border/70 bg-card px-3.5 py-2.5 text-xs font-medium shadow-lg">
              {messages.get(id)}
            </div>
          </Toast>
        ))}
      </ToastStack>
    ),
    [toasts, messages],
  );

  return { notify, renderToastStack: renderToastStack as () => ReactNode };
}