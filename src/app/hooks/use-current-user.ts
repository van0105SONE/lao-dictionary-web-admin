// src/hooks/useCurrentUser.ts
"use client";

import { useState, useEffect } from "react";

type CurrentUser = {
  id: number;
  email: string;
  status: string;
  role: "SuperAdmin" | "admin" | "editor" | "viewer";
};

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/auth/me", {
          credentials: "include",
        });

        if (res.ok) {
          const data = await res.json();
          console.log("user data: ", data);
          setUser(data);
        } else {
          setUser(null);
        }
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, []);

  return { user, loading };
}
