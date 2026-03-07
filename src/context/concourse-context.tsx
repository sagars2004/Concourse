"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  FlightData,
  FoodRecommendationItem,
  ChatMessage,
} from "@/lib/types";
import { getOrCreateSessionId } from "@/lib/session";

type Step = "idle" | "loading" | "results";

interface ConcourseState {
  step: Step;
  flightData: FlightData | null;
  recommendations: FoodRecommendationItem[];
  dietaryPreferences: string[];
  messages: ChatMessage[];
  error: string | null;
  sessionId: string;
  gateOverride: string | null;
}

interface ConcourseContextValue extends ConcourseState {
  setError: (error: string | null) => void;
  lookupFlight: (flightNumber: string) => Promise<void>;
  setGateOverride: (gate: string | null) => void;
  setDietaryPreferences: (prefs: string[]) => void;
  savePreferences: (prefs: string[]) => Promise<void>;
  loadRecommendations: (dietaryPrefsOverride?: string[]) => Promise<void>;
  sendChatMessage: (content: string) => Promise<void>;
  setInitialMessages: (messages: ChatMessage[]) => void;
  clearResults: () => void;
}

const defaultState: ConcourseState = {
  step: "idle",
  flightData: null,
  recommendations: [],
  dietaryPreferences: ["none"],
  messages: [],
  error: null,
  sessionId: "",
  gateOverride: null,
};

const ConcourseContext = createContext<ConcourseContextValue | null>(null);

export function ConcourseProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ConcourseState>(defaultState);

  useEffect(() => {
    setState((s) => ({ ...s, sessionId: getOrCreateSessionId() }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState((s) => ({ ...s, error }));
  }, []);

  const lookupFlight = useCallback(async (flightNumber: string) => {
    setState((s) => ({ ...s, step: "loading", error: null }));
    try {
      const res = await fetch("/api/flight/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flightNumber: flightNumber.replace(/\s+/g, " ").trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Lookup failed");

      setState((s) => ({
        ...s,
        step: "results",
        flightData: data,
        gateOverride: data.gate ?? null,
        error: null,
      }));

      // Load recommendations after flight is set
      const recRes = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          terminal: data.terminal,
          gate: data.gate,
          dietaryPreferences: state.dietaryPreferences,
        }),
      });
      const recData = await recRes.json();
      if (recRes.ok && recData.recommendations) {
        setState((s) => ({ ...s, recommendations: recData.recommendations }));
      }

      // Set initial assistant message
      setState((s) => ({
        ...s,
        messages: [
          {
            role: "assistant",
            content: `Hey there! I see you're flying ${data.flightNumber} out of ${data.terminal}, Gate ${data.gate ?? "TBD"}. You've got about ${data.minutesUntilBoarding} minutes — that's basically luxury time in airport land. I've found some great food options near your gate. Want me to tell you more about any of them?`,
          },
        ],
      }));
    } catch (e) {
      setState((s) => ({
        ...s,
        step: "idle",
        error: e instanceof Error ? e.message : "Something went wrong",
      }));
    }
  }, [state.dietaryPreferences]);

  const setGateOverride = useCallback((gate: string | null) => {
    setState((s) => ({ ...s, gateOverride: gate }));
  }, []);

  const setDietaryPreferences = useCallback((prefs: string[]) => {
    setState((s) => ({ ...s, dietaryPreferences: prefs }));
  }, []);

  const savePreferences = useCallback(
    async (prefs: string[]) => {
      const sessionId = getOrCreateSessionId();
      setState((s) => ({ ...s, dietaryPreferences: prefs }));
      try {
        await fetch("/api/preferences", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-session-id": sessionId,
          },
          body: JSON.stringify({ dietaryPreferences: prefs }),
        });
      } catch {
        // Non-blocking; in-memory state already updated
      }
    },
    []
  );

  const loadRecommendations = useCallback(
    async (dietaryPrefsOverride?: string[]) => {
      const s = state;
      if (!s.flightData) return;
      const prefs = dietaryPrefsOverride ?? s.dietaryPreferences;
      try {
        const res = await fetch("/api/recommendations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            terminal: s.flightData.terminal,
            gate: s.gateOverride ?? s.flightData.gate,
            dietaryPreferences: prefs,
          }),
        });
        const data = await res.json();
        if (res.ok && data.recommendations) {
          setState((prev) => ({ ...prev, recommendations: data.recommendations }));
        }
      } catch {
        // Keep existing recommendations
      }
    },
    [state.flightData, state.dietaryPreferences, state.gateOverride]
  );

  const sendChatMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;
      const userMessage: ChatMessage = { role: "user", content: content.trim() };
      setState((s) => ({
        ...s,
        messages: [...s.messages, userMessage],
      }));

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: content.trim(),
            messages: state.messages,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error ?? "Send failed");
        setState((prev) => ({
          ...prev,
          messages: [
            ...prev.messages,
            { role: "assistant", content: data.message },
          ],
        }));
      } catch {
        setState((prev) => ({
          ...prev,
          messages: [
            ...prev.messages,
            {
              role: "assistant",
              content: "Sorry, I couldn't get a response right now. Try again in a moment.",
            },
          ],
        }));
      }
    },
    [state.messages]
  );

  const setInitialMessages = useCallback((messages: ChatMessage[]) => {
    setState((s) => ({ ...s, messages }));
  }, []);

  const clearResults = useCallback(() => {
    setState((s) => ({
      ...s,
      step: "idle",
      flightData: null,
      recommendations: [],
      messages: [],
      gateOverride: null,
      error: null,
    }));
  }, []);

  const value = useMemo<ConcourseContextValue>(
    () => ({
      ...state,
      setError,
      lookupFlight,
      setGateOverride,
      setDietaryPreferences,
      savePreferences,
      loadRecommendations,
      sendChatMessage,
      setInitialMessages,
      clearResults,
    }),
    [
      state,
      setError,
      lookupFlight,
      setGateOverride,
      setDietaryPreferences,
      savePreferences,
      loadRecommendations,
      sendChatMessage,
      setInitialMessages,
      clearResults,
    ]
  );

  return (
    <ConcourseContext.Provider value={value}>
      {children}
    </ConcourseContext.Provider>
  );
}

export function useConcourse() {
  const ctx = useContext(ConcourseContext);
  if (!ctx) throw new Error("useConcourse must be used within ConcourseProvider");
  return ctx;
}
