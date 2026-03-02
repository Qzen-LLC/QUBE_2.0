"use client";

import React from "react";
import { getClientAuthService } from "@/services/auth/client";

/**
 * Unified SignUp component that proxies to the configured auth service.
 * This provides a consistent interface regardless of the underlying auth provider.
 */
export const SignUp: React.FC<Record<string, unknown>> = (props) => {
  const authService = getClientAuthService();
  const SignUpComponent = authService.components.SignUp;
  
  return <SignUpComponent {...props} />;
};

export default SignUp;
