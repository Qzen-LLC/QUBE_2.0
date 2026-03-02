"use client";

import React from "react";
import { getClientAuthService } from "@/services/auth/client";

/**
 * Unified OrganizationSwitcher component that proxies to the configured auth service.
 * This provides a consistent interface regardless of the underlying auth provider.
 */
export const OrganizationSwitcher: React.FC<Record<string, unknown>> = (props) => {
  const authService = getClientAuthService();
  const OrganizationSwitcherComponent = authService.components.OrganizationSwitcher;
  
  return <OrganizationSwitcherComponent {...props} />;
};

export default OrganizationSwitcher;
