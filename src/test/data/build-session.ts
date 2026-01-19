export type Session = {
  user?: {
    id: string;
  };
};

export function buildSession(overrides: Partial<Session> = {}): Session {
  const base: Session = { user: { id: "user-203" } };
  return { ...base, ...overrides };
}
