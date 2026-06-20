import type { SystemEvent, SimulationSession } from '../types/event';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export const fetchEvents = async (): Promise<SystemEvent[]> => {
  const res = await fetch(`${apiBaseUrl}/events`);
  if (!res.ok) {
    throw new Error(`Failed to fetch events: ${res.statusText}`);
  }
  return res.json();
};

export const fetchReplaySessions = async (): Promise<SimulationSession[]> => {
  const res = await fetch(`${apiBaseUrl}/replay/sessions`);
  if (!res.ok) {
    throw new Error(`Failed to fetch replay sessions: ${res.statusText}`);
  }
  return res.json();
};

export const fetchReplaySession = async (sessionId: string): Promise<SystemEvent[]> => {
  const res = await fetch(`${apiBaseUrl}/replay/${sessionId}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch session events for ${sessionId}: ${res.statusText}`);
  }
  return res.json();
};
