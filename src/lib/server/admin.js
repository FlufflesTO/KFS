import { forbidden } from "./http.js";

export function requireAdmin(user) {
  if (!user || user.role !== "admin") {
    return forbidden("Only admin accounts can perform this action.");
  }
  return null;
}

export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

export function cleanText(value, fieldName, options = {}) {
  const min = options.min ?? 0;
  const max = options.max ?? 500;
  const required = options.required ?? true;
  const text = String(value || "").trim();

  if (!text && !required) return "";
  if (text.length < min || text.length > max) {
    throw new Error(`${fieldName} must be between ${min} and ${max} characters.`);
  }

  return text;
}

export function cleanId(value, fieldName, options = {}) {
  const required = options.required ?? true;
  const id = String(value || "").trim();
  if (!id && !required) return null;
  if (!/^[A-Za-z0-9_-]{3,120}$/.test(id)) {
    throw new Error(`${fieldName} is invalid.`);
  }
  return id;
}

export function cleanEmail(value, fieldName, options = {}) {
  const required = options.required ?? true;
  const email = String(value || "").trim().toLowerCase();
  if (!email && !required) return null;
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 160) {
    throw new Error(`${fieldName} must be a valid email address.`);
  }
  return email;
}

export function cleanDate(value, fieldName) {
  const date = String(value || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error(`${fieldName} must use YYYY-MM-DD format.`);
  }
  return date;
}

export function cleanChoice(value, fieldName, allowed) {
  const choice = String(value || "").trim();
  if (!allowed.includes(choice)) {
    throw new Error(`${fieldName} is invalid.`);
  }
  return choice;
}

export function cleanBoolean(value) {
  return value === true || value === 1 || value === "1" || value === "true" ? 1 : 0;
}
