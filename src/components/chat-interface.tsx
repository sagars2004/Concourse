"use client";

import { useState } from "react";
import { Send, Plane, User, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

const mockMessages = [
  {
    role: "assistant" as const,
    content:
      "Hey there! I see you're flying AA 203 out of JFK T4, Gate B12. You've got about 40 minutes \u2014 that's basically luxury time in airport land. I've found some great food options near your gate. Want me to tell you more about any of them?",
  },
  {
    role: "user" as const,
    content: "What's the quickest option?",
  },
  {
    role: "assistant" as const,
    content:
      "Shake Shack at Gate B14 \u2014 it's a 4-minute walk from your gate. Grab the ShackBurger, you'll be back in your seat in under 15 minutes with zero regrets. Pro tip: order on their app while you walk to skip the line.",
  },
];

export function ChatInterface() {
  const [message, setMessage] = useState("");

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageCircle className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">Chat with Concourse</h2>
      </div>
      <Card>
        <CardContent className="space-y-4 p-5">
          {/* Messages */}
          <div className="max-h-80 space-y-4 overflow-y-auto pr-1">
            {mockMessages.map((msg, i) => (
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
            ))}
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 border-t border-border pt-4">
            <Input
              placeholder="Ask Concourse anything..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="flex-1"
            />
            <Button size="icon" className="shrink-0">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
