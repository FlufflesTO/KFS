import { forbidden } from "./http.ts";

export function requireFinance(user) {
  if (!user || (user.role !== "finance" && user.role !== "admin")) {
    return forbidden("Only finance or admin accounts can perform this action.");
  }
  return null;
}

export function requireAdminOrFinance(user) {
  return requireFinance(user);
}
