"use client";

import React from "react";
import { getClientAuthService } from "@/services/auth/client";

/**
 * Unified UserButton component that proxies to the configured auth service.
 * This provides a consistent interface regardless of the underlying auth provider.
 */
export const UserButton: React.FC<Record<string, unknown>> = (props) => {
  const authService = getClientAuthService();
  const UserButtonComponent = authService.components.UserButton;
  
  return <UserButtonComponent {...props} />;
};

export default UserButton;
