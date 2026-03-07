import React from "react";

export type AuthProviderName = "CUSTOM";

export type UseAuthResult = {
  isLoaded: boolean;
  isSignedIn: boolean;
  userId: string | null;
  organizationId?: string | null;
  signOut: (opts?: { redirectUrl?: string }) => Promise<void> | void;
};

export type UseUserResult<UserType = unknown> = {
  isLoaded: boolean;
  user: UserType | null;
};

export type AuthProviderComponent = React.ComponentType<{
  children?: React.ReactNode;
  [key: string]: unknown;
}>;

export type AuthUIComponent = React.ComponentType<Record<string, unknown>>;

export interface ClientAuthService {
  provider: AuthProviderName;
  hooks: {
    useAuth: () => UseAuthResult;
    useUser: <UserType = unknown>() => UseUserResult<UserType>;
  };
  components: {
    AuthProvider: AuthProviderComponent;
    SignIn: AuthUIComponent;
    SignUp: AuthUIComponent;
    UserButton: AuthUIComponent;
    OrganizationSwitcher: AuthUIComponent;
  };
}


