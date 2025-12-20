"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Bot, User } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";
import { ScrollArea } from "../ui/scroll-area";
import { MemoizedMarkdown } from "../markdown/MarkdownRenderer";
import type { AiChatMessage } from "@/ai/chat-types";
import type { AiSource } from "@/store/ai-store";

interface ChatMessagesProps {
  messages: (AiChatMessage & { id?: string })[];
  resolvedSource: AiSource | null;
}

export function ChatMessages({ messages, resolvedSource }: ChatMessagesProps) {
  const { t } = useTranslation("commons", { keyPrefix: "chat-page" });
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = (smooth = true) => {
    const viewport = scrollAreaRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]",
    ) as HTMLElement;
    if (viewport) {
      viewport.scrollTo({
        top: viewport.scrollHeight,
        behavior: smooth ? "smooth" : "instant",
      });
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => scrollToBottom(true), 100);
    return () => clearTimeout(timeout);
  }, [messages]);

  return (
    <div className="flex-1 min-h-0 overflow-hidden relative">
      <ScrollArea ref={scrollAreaRef} className="h-full">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 md:px-6 lg:px-8">
          {messages.length === 0 ? (
            <div className="mt-20 flex flex-col items-center justify-center gap-4 text-center">
              <div className="rounded-full bg-muted p-4">
                <Bot className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="max-w-md space-y-2">
                <h2 className="text-lg font-semibold">
                  {t("conversation.empty-title")}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Start a new conversation with{" "}
                  <span className="font-medium text-foreground">
                    {resolvedSource?.name}
                  </span>
                  .
                </p>
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.05 }}
                key={msg.id}
                className={cn(
                  "group flex gap-4 text-sm md:text-base",
                  msg.role === "user" ? "flex-row-reverse" : "flex-row",
                )}
              >
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border shadow-sm",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-background",
                  )}
                >
                  {msg.role === "user" ? (
                    <User className="h-5 w-5" />
                  ) : (
                    <Bot className="h-5 w-5 text-primary" />
                  )}
                </div>

                <div
                  className={cn(
                    "flex min-w-0 max-w-[85%] flex-col gap-1 rounded-2xl px-4 py-3 shadow-sm md:max-w-[75%]",
                    msg.role === "user"
                      ? "bg-primary/5 text-foreground rounded-tr-sm"
                      : "bg-muted/30 border border-border/50 rounded-tl-sm",
                  )}
                >
                  <div className="prose prose-sm dark:prose-invert max-w-none wrap-break-word leading-normal">
                    <MemoizedMarkdown source={msg.content || "..."} />
                  </div>
                </div>
                {/* TODO: add action buttons */}
              </motion.div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
