import { useState, useEffect, useCallback } from "react";

export function useArchitectSession(useCaseId: string | undefined) {
  const [session, setSession] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!useCaseId) {
      setSession(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    fetch(`/api/architect/session/${useCaseId}`)
      .then((res) => {
        if (res.status === 404) return null;
        if (!res.ok) throw new Error("Failed to fetch session");
        return res.json();
      })
      .then((data) => {
        setSession(data);
        setError(null);
      })
      .catch((err) => {
        setError(err);
        setSession(null);
      })
      .finally(() => setIsLoading(false));
  }, [useCaseId]);

  const updateSession = useCallback(
    async (data: Record<string, unknown>) => {
      const res = await fetch(`/api/architect/session/${useCaseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update session");
      const updated = await res.json();
      setSession(updated);
      return updated;
    },
    [useCaseId]
  );

  return { session, isLoading, error, updateSession };
}
