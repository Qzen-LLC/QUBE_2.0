// Unified auth components - proxy to configured auth service
export { SignIn } from "./SignIn";
export { SignUp } from "./SignUp";
export { UserButton } from "./UserButton";
export { OrganizationSwitcher } from "./OrganizationSwitcher";

// Re-export types for convenience
export type { UseAuthResult, UseUserResult } from "@/services/auth/client/types";
