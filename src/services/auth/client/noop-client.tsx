"use client";

import React from "react";
import type { ClientAuthService, UseAuthResult, UseUserResult } from "./types";

const AuthProvider: ClientAuthService["components"]["AuthProvider"] = ({ children }) => {
  return <>{children}</>;
};

function useAuth(): UseAuthResult {
  return {
    isLoaded: true,
    isSignedIn: true,
    userId: "default",
    organizationId: null,
    signOut: async () => {},
  };
}

function useUser<TUser = unknown>(): UseUserResult<TUser> {
  return {
    isLoaded: true,
    user: null,
  };
}

const SignIn: ClientAuthService["components"]["SignIn"] = () => null;
const SignUp: ClientAuthService["components"]["SignUp"] = () => null;
const UserButton: ClientAuthService["components"]["UserButton"] = () => null;
const OrganizationSwitcher: ClientAuthService["components"]["OrganizationSwitcher"] = () => null;

export const noopClientAuthService: ClientAuthService = {
  provider: "NONE",
  hooks: {
    useAuth,
    useUser,
  },
  components: {
    AuthProvider,
    SignIn,
    SignUp,
    UserButton,
    OrganizationSwitcher,
  },
};
