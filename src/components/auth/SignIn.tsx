"use client";

import React from "react";
import { getClientAuthService } from "@/services/auth/client";

/**
 * Unified SignIn component that proxies to the configured auth service.
 * This provides a consistent interface regardless of the underlying auth provider.
 */
export const SignIn: React.FC<Record<string, unknown>> = (props) => {
  const authService = getClientAuthService();
  const SignInComponent = authService.components.SignIn;
  
  return <SignInComponent {...props} />;
};

export default SignIn;
