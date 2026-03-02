"use client";

import React from "react";
import { getClientAuthService } from "@/services/auth/client";

type Props = {
  children: React.ReactNode;
  [key: string]: unknown;
};

export default function AuthClientProvider({ children, ...rest }: Props) {
  const auth = getClientAuthService();
  const Provider = auth.components.AuthProvider;
  return <Provider {...rest}>{children}</Provider>;
}


