"use client";

import { useState } from "react";
import { ArrowUp, MessageCircle, Plane, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useConcourse } from "@/context/concourse-context";
import {
  ChatBubble,
  ChatBubbleAvatar,
  ChatBubbleMessage,
} from "@/components/ui/chat-bubble";
import { ChatMessageList } from "@/components/ui/chat-message-list";
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

  return (
    <section id="concourse-chat" className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageCircle className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">Chat with Concourse</h2>
      </div>
      <Card>
        <CardContent className="flex h-[420px] flex-col gap-4 p-5">
          <div className="flex-1 overflow-hidden">
            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Say something to get started.
              </div>
            ) : (
              <ChatMessageList className="pr-1" smooth>
                {messages.map((msg, i) => (
                  <ChatBubble
                    key={i}
                    variant={msg.role === "user" ? "sent" : "received"}
                  >
                    <ChatBubbleAvatar
                      className="h-8 w-8 shrink-0"
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
                    >
                      {msg.content}
                    </ChatBubbleMessage>
                  </ChatBubble>
                ))}

                {isSending && (
                  <ChatBubble variant="received">
                    <ChatBubbleAvatar
                      className="h-8 w-8 shrink-0"
                      icon={<Plane className="h-4 w-4 text-primary" />}
                      fallback="C"
                    />
                    <ChatBubbleMessage isLoading />
                  </ChatBubble>
                )}
              </ChatMessageList>
            )}
          </div>

          <PromptInput
            value={inputValue}
            onValueChange={setInputValue}
            isLoading={isSending}
            onSubmit={handleSubmit}
            className="border-border/70 bg-background/80"
          >
            <PromptInputTextarea placeholder="Ask Concourse anything..." />
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

