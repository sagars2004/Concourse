"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  FlightData,
  FoodRecommendationItem,
  ChatMessage,
} from "@/lib/types";
import { getOrCreateSessionId } from "@/lib/session";
import type { PreferenceFilters } from "@/lib/preference-filters";
import { DEFAULT_PREFERENCE_FILTERS } from "@/lib/preference-filters";

type Step = "idle" | "loading" | "results";

export interface GateChangeAlert {
  visible: boolean;
  previousGate: string;
  newGate: string;
  message: string;
}

interface ConcourseState {
  step: Step;
  flightData: FlightData | null;
  recommendations: FoodRecommendationItem[];
  /** Full preference filters (dietary, cuisine, price, service, meal). Persisted to Supabase and sent to RAG/agents. */
  preferenceFilters: PreferenceFilters;
  messages: ChatMessage[];
  error: string | null;
  sessionId: string;
  gateOverride: string | null;
  terminalOverride: string | null;
  boardingTimeOverride: string | null;
  minutesUntilBoardingOverride: number | null;
  gateChangeAlert: GateChangeAlert | null;
}

interface ConcourseContextValue extends ConcourseState {
  setError: (error: string | null) => void;
  lookupFlight: (flightNumber: string, flightDate?: string, departureAirportIata?: string) => Promise<void>;
  setGateOverride: (gate: string | null) => void;
  setTerminalOverride: (terminal: string | null) => void;
  setBoardingTimeOverride: (time: string | null) => void;
  setMinutesUntilBoardingOverride: (minutes: number | null) => void;
  setPreferenceFilters: (filters: PreferenceFilters | ((prev: PreferenceFilters) => PreferenceFilters)) => void;
  savePreferences: (filters: PreferenceFilters) => Promise<void>;
  loadRecommendations: (filtersOverride?: Partial<PreferenceFilters>, terminalOverride?: string | null, minutesUntilBoardingOverride?: number | null) => Promise<void>;
  sendChatMessage: (content: string) => Promise<void>;
  setInitialMessages: (messages: ChatMessage[]) => void;
  clearResults: () => void;
  dismissGateAlert: () => void;
  simulateGateChange: () => Promise<void>;
}

const defaultState: ConcourseState = {
  step: "idle",
  flightData: null,
  recommendations: [],
  preferenceFilters: DEFAULT_PREFERENCE_FILTERS,
  messages: [],
  error: null,
  sessionId: "",
  gateOverride: null,
  terminalOverride: null,
  boardingTimeOverride: null,
  minutesUntilBoardingOverride: null,
  gateChangeAlert: null,
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

  const lookupFlight = useCallback(async (flightNumber: string, flightDate?: string, departureAirportIata?: string) => {
    setState((s) => ({ ...s, step: "loading", error: null }));
    try {
      const res = await fetch("/api/flight/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flightNumber: flightNumber.replace(/\s+/g, " ").trim(),
          flightDate: flightDate || undefined,
          departureAirportIata: departureAirportIata || undefined,
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

      // Load recommendations after flight is set (use departure airport so we map to correct terminal, e.g. JFK T4 vs LAX T4)
      const recRes = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          terminal: data.terminal,
          departureAirportIata: data.departureAirportIata ?? undefined,
          gate: data.gate,
          preferenceFilters: state.preferenceFilters,
          minutesUntilBoarding: data.minutesUntilBoarding ?? 40,
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
            content: `Hey there! I see you're flying ${data.flightNumber} out of ${data.departureAirportName ?? data.departureAirportIata ?? "the airport"}${data.terminal !== "—" ? `, ${data.terminal}` : ""}, Gate ${data.gate ?? "TBD"}. You've got about ${data.minutesUntilBoarding} minutes — that's basically luxury time in airport land. I've found some great food options near your gate. Want me to tell you more about any of them?`,
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
  }, [state.preferenceFilters]);

  const setGateOverride = useCallback((gate: string | null) => {
    setState((s) => ({ ...s, gateOverride: gate }));
  }, []);

  const setTerminalOverride = useCallback((terminal: string | null) => {
    setState((s) => ({ ...s, terminalOverride: terminal }));
  }, []);

  const setBoardingTimeOverride = useCallback((time: string | null) => {
    setState((s) => ({ ...s, boardingTimeOverride: time }));
  }, []);

  const setMinutesUntilBoardingOverride = useCallback((minutes: number | null) => {
    setState((s) => ({ ...s, minutesUntilBoardingOverride: minutes }));
  }, []);

  const setPreferenceFilters = useCallback((filters: PreferenceFilters | ((prev: PreferenceFilters) => PreferenceFilters)) => {
    setState((s) => ({
      ...s,
      preferenceFilters: typeof filters === "function" ? filters(s.preferenceFilters) : filters,
    }));
  }, []);

  const savePreferences = useCallback(async (filters: PreferenceFilters) => {
    const sessionId = getOrCreateSessionId();
    setState((s) => ({ ...s, preferenceFilters: filters }));
    try {
      await fetch("/api/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-id": sessionId,
        },
        body: JSON.stringify({ preferenceFilters: filters }),
      });
    } catch {
      // Non-blocking; in-memory state already updated
    }
  }, []);

  const loadRecommendations = useCallback(
    async (
      filtersOverride?: Partial<PreferenceFilters>,
      terminalOverrideArg?: string | null,
      minutesUntilBoardingOverrideArg?: number | null
    ) => {
      const s = state;
      if (!s.flightData) return;
      const filters: PreferenceFilters = filtersOverride
        ? { ...s.preferenceFilters, ...filtersOverride }
        : s.preferenceFilters;
      const terminal = terminalOverrideArg !== undefined ? terminalOverrideArg : (s.terminalOverride ?? s.flightData.terminal);
      const minutes = minutesUntilBoardingOverrideArg !== undefined ? minutesUntilBoardingOverrideArg : (s.minutesUntilBoardingOverride ?? s.flightData.minutesUntilBoarding ?? 40);
      try {
        const res = await fetch("/api/recommendations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            terminal: terminal ?? s.flightData.terminal,
            departureAirportIata: s.flightData.departureAirportIata ?? undefined,
            gate: s.gateOverride ?? s.flightData.gate,
            preferenceFilters: filters,
            minutesUntilBoarding: minutes ?? 40,
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
    [state.flightData, state.preferenceFilters, state.gateOverride, state.terminalOverride, state.minutesUntilBoardingOverride]
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
            preferenceFilters: state.preferenceFilters,
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
      preferenceFilters: DEFAULT_PREFERENCE_FILTERS,
      messages: [],
      gateOverride: null,
      terminalOverride: null,
      boardingTimeOverride: null,
      minutesUntilBoardingOverride: null,
      gateChangeAlert: null,
      error: null,
    }));
  }, []);

  const dismissGateAlert = useCallback(() => {
    setState((s) => ({
      ...s,
      gateChangeAlert: s.gateChangeAlert
        ? { ...s.gateChangeAlert, visible: false }
        : null,
    }));
  }, []);

  const applyGateChange = useCallback(
    (previousGate: string, newGate: string, flightNumber: string) => {
      const message = `Gate change: Your flight ${flightNumber} has moved from Gate ${previousGate} to Gate ${newGate}. Don't worry — I've updated your recommendations so you're still good to go!`;
      setState((s) => ({
        ...s,
        gateOverride: newGate,
        gateChangeAlert: {
          visible: true,
          previousGate,
          newGate,
          message: `Your flight ${flightNumber} has moved from Gate ${previousGate} to Gate ${newGate}. Recommendations updated!`,
        },
        messages: [
          ...s.messages,
          {
            role: "assistant",
            content: message,
          },
        ],
      }));
      setTimeout(() => loadRecommendations(), 0);
    },
    [loadRecommendations]
  );

  const applyGateChangeRef = useRef(applyGateChange);
  applyGateChangeRef.current = applyGateChange;

  const simulateGateChange = useCallback(async () => {
    const { flightData } = state;
    if (!flightData) return;
    try {
      const res = await fetch(
        `/api/gate/status?flightNumber=${encodeURIComponent(flightData.flightNumber)}&simulateGateChange=true`
      );
      const data = await res.json();
      if (res.ok && data.changed && data.previousGate && data.gate) {
        applyGateChangeRef.current(data.previousGate, data.gate, flightData.flightNumber);
      }
    } catch {
      // Ignore
    }
  }, [state.flightData]);

  useEffect(() => {
    if (state.step !== "results" || !state.flightData) return;
    const flightNumber = state.flightData.flightNumber;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/gate/status?flightNumber=${encodeURIComponent(flightNumber)}`
        );
        const data = await res.json();
        if (res.ok && data.changed && data.previousGate && data.gate) {
          applyGateChangeRef.current(data.previousGate, data.gate, flightNumber);
        }
      } catch {
        // Ignore
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [state.step, state.flightData?.flightNumber]);

  const value = useMemo<ConcourseContextValue>(
    () => ({
      ...state,
      setError,
      lookupFlight,
      setGateOverride,
      setTerminalOverride,
      setBoardingTimeOverride,
      setMinutesUntilBoardingOverride,
      setPreferenceFilters,
      savePreferences,
      loadRecommendations,
      sendChatMessage,
      setInitialMessages,
      clearResults,
      dismissGateAlert,
      simulateGateChange,
    }),
    [
      state,
      setError,
      lookupFlight,
      setGateOverride,
      setTerminalOverride,
      setBoardingTimeOverride,
      setMinutesUntilBoardingOverride,
      setPreferenceFilters,
      savePreferences,
      loadRecommendations,
      sendChatMessage,
      setInitialMessages,
      clearResults,
      dismissGateAlert,
      simulateGateChange,
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
