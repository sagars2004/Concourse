"use client";

import { useState, useRef } from "react";
import { Send, Plane, User, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useConcourse } from "@/context/concourse-context";

export function ChatInterface() {
  const [inputValue, setInputValue] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const { messages, sendChatMessage, step } = useConcourse();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    sendChatMessage(inputValue.trim());
    setInputValue("");
  };

  if (step !== "results") return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageCircle className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">Chat with Concourse</h2>
      </div>
      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="max-h-80 space-y-4 overflow-y-auto pr-1">
            {messages.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Say something to get started.
              </p>
            ) : (
              messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                      msg.role === "assistant"
                        ? "bg-primary/10 text-primary"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <Plane className="h-4 w-4" />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                  </div>
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === "assistant"
                        ? "bg-secondary text-secondary-foreground"
                        : "bg-primary text-primary-foreground"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 border-t border-border pt-4"
          >
            <Input
              placeholder="Ask Concourse anything..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" size="icon" className="shrink-0">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
