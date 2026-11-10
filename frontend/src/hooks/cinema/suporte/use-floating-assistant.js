"use client";

import { useRef, useState } from "react";
import { supportRequest } from "./use-support-resource";

export function useFloatingAssistant(signedIn) {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [pending, setPending] = useState(false);
  const sending = useRef(false);
  const needsSignIn = !signedIn || sessionExpired;

  async function ask(event) {
    event.preventDefault();
    const message = question.trim();
    if (!message || needsSignIn || sending.current) return;

    sending.current = true;
    setPending(true);
    setMessages(current => [...current, { role: "user", text: message }]);
    setQuestion("");
    try {
      const answer = await supportRequest("assistant/messages", { message });
      if (typeof answer.message !== "string" || typeof answer.available !== "boolean") {
        throw new Error("A assistente enviou uma resposta incompleta. Tente novamente.");
      }
      setMessages(current => [...current, {
        role: "assistant",
        text: answer.message,
        sessions: answer.sessions,
        showSupport: !answer.available,
      }]);
    } catch (requestError) {
      setQuestion(message);
      if (requestError.status === 401) setSessionExpired(true);
      else setMessages(current => [...current, { role: "error", text: requestError.message }]);
    } finally {
      sending.current = false;
      setPending(false);
    }
  }

  return { question, setQuestion, messages, needsSignIn, pending, ask };
}
