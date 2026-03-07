"use client";

import React, { useEffect } from "react";
import { getClientAuthService } from "@/services/auth/client";
import { installFetchInterceptor } from "@/lib/auth-fetch";

type Props = {
  children: React.ReactNode;
  [key: string]: unknown;
};

export default function AuthClientProvider({ children, ...rest }: Props) {
  useEffect(() => {
    installFetchInterceptor();
  }, []);

  const auth = getClientAuthService();
  const Provider = auth.components.AuthProvider;
  return <Provider {...rest}>{children}</Provider>;
}
