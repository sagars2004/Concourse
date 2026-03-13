"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, MessageCircle, Plane, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useConcourse } from "@/context/concourse-context";
import {
  ChatBubble,
  ChatBubbleAvatar,
  ChatBubbleMessage,
} from "@/components/ui/chat-bubble";
import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from "@/components/ui/prompt-input";

export function ChatInterface() {
  const [inputValue, setInputValue] = useState("");
  const { messages, sendChatMessage, step } = useConcourse();
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const handleSubmit = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    setIsSending(true);
    setInputValue("");
    try {
      await sendChatMessage(trimmed);
    } finally {
      setIsSending(false);
    }
  };

  if (step !== "results") return null;

  const placeholder = isSending
    ? "Thinking hard..."
    : "Ask Concourse anything...";

  // Auto-scroll to bottom so the most recent message is visible
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, isSending]);

  // Track whether user has scrolled up
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleScroll = () => {
      const distanceToBottom =
        el.scrollHeight - el.scrollTop - el.clientHeight;
      setIsAtBottom(distanceToBottom < 16);
    };

    handleScroll();
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section id="concourse-chat" className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageCircle className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">Chat with Concourse</h2>
      </div>
      <Card className="h-full">
        <CardContent className="flex h-full flex-col gap-2 p-4">
          {/* Fixed-size scrollable message window; messages scroll to show latest at bottom */}
          <div className="relative h-[280px] shrink-0 sm:h-[320px]">
            <div
              ref={scrollRef}
              className="flex h-full w-full flex-col overflow-y-auto pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            >
              {messages.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  Say something to get started.
                </div>
              ) : (
                <div className="flex flex-col gap-3 pb-1">
                  {messages.map((msg, i) => (
                    <ChatBubble
                      key={i}
                      variant={msg.role === "user" ? "sent" : "received"}
                    >
                      <ChatBubbleAvatar
                        className={
                          msg.role === "user"
                            ? "h-8 w-8 shrink-0"
                            : "h-8 w-8 shrink-0 concourse-avatar"
                        }
                        icon={
                          msg.role === "user" ? (
                            <User className="h-4 w-4" />
                          ) : (
                            <Plane className="h-4 w-4 text-primary" />
                          )
                        }
                        fallback={msg.role === "user" ? "U" : "C"}
                      />
                      <ChatBubbleMessage
                        variant={msg.role === "user" ? "sent" : "received"}
                        className={
                          msg.role === "user" ? undefined : "concourse-bubble"
                        }
                      >
                        {msg.content}
                      </ChatBubbleMessage>
                    </ChatBubble>
                  ))}

                  {isSending && (
                    <ChatBubble variant="received">
                      <ChatBubbleAvatar
                        className="h-8 w-8 shrink-0 concourse-avatar"
                        icon={<Plane className="h-4 w-4 text-primary" />}
                        fallback="C"
                      />
                      <ChatBubbleMessage
                        className="concourse-bubble"
                        isLoading
                      />
                    </ChatBubble>
                  )}
                </div>
              )}
            </div>

            {!isAtBottom && (
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="absolute bottom-2 left-1/2 inline-flex -translate-x-1/2 transform rounded-full shadow-md"
                aria-label="Scroll to bottom"
                onClick={() => {
                  const el = scrollRef.current;
                  if (!el) return;
                  el.scrollTop = el.scrollHeight;
                }}
              >
                <ArrowDown className="h-4 w-4 text-foreground" />
              </Button>
            )}
          </div>

          <PromptInput
            value={inputValue}
            onValueChange={setInputValue}
            isLoading={isSending}
            onSubmit={handleSubmit}
            className="mt-1 border-border/70 bg-background/80 concourse-chat-input"
          >
            <PromptInputTextarea placeholder={placeholder} />
            <div className="flex items-center justify-end pt-2">
              <PromptInputActions>
                <PromptInputAction tooltip="Send message">
                  <Button
                    type="button"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={() => void handleSubmit()}
                    disabled={isSending || !inputValue.trim()}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                </PromptInputAction>
              </PromptInputActions>
            </div>
          </PromptInput>
        </CardContent>
      </Card>
    </section>
  );
}

