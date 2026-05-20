import { getDatabase } from "../../../lib/server/bindings.js";
import { createSessionToken, sessionCookie, verifyPassword } from "../../../lib/server/auth.js";
import { badRequest, json, methodNotAllowed, serverError, unauthorized } from "../../../lib/server/http.js";

export const prerender = false;

const roleDestinations = {
  tech: "/portal/tech/dashboard",
  admin: "/portal/admin/dashboard",
  client: "/portal/client/dashboard",
  finance: "/portal/finance/dashboard"
};

async function readCredentials(request) {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return request.json();
  }

  if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    return {
      email: form.get("email"),
      password: form.get("password")
    };
  }

  return {};
}

export async function POST({ request }) {
  try {
    const body = await readCredentials(request);
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!email || !password) {
      return badRequest("Email and password are required.");
    }

    const db = getDatabase();
    const user = await db
      .prepare(
        `SELECT id, name, email, password_hash, role, site_id
         FROM users
         WHERE email = ?1 AND is_active = 1
         LIMIT 1`
      )
      .bind(email)
      .first();

    if (!user) {
      return unauthorized("Invalid email or password.");
    }

    const verified = await verifyPassword(password, user.password_hash);
    if (!verified) {
      return unauthorized("Invalid email or password.");
    }

    const token = await createSessionToken(user);
    const destination = roleDestinations[user.role] || "/portal/login";

    return json(
      {
        ok: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          siteId: user.site_id || null
        },
        redirectTo: destination
      },
      {
        status: 200,
        headers: {
          "Set-Cookie": sessionCookie(token)
        }
      }
    );
  } catch (error) {
    console.error("portal auth failed", error);
    return serverError("Authentication could not be completed.");
  }
}

export function ALL() {
  return methodNotAllowed(["POST"]);
}
