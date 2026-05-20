const password = process.argv[2];

if (!password || password.length < 12) {
  console.error("Usage: node scripts/hash-password.mjs \"minimum-12-character-password\"");
  process.exit(1);
}

const encoder = new TextEncoder();

function base64UrlEncode(input) {
  const bytes = input instanceof Uint8Array ? input : encoder.encode(String(input));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return Buffer.from(binary, "binary").toString("base64").replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

const salt = crypto.randomUUID();
const iterations = 210000;
const keyMaterial = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
const derived = await crypto.subtle.deriveBits(
  {
    name: "PBKDF2",
    hash: "SHA-256",
    salt: encoder.encode(salt),
    iterations
  },
  keyMaterial,
  256
);

console.log(`pbkdf2_sha256$${iterations}$${base64UrlEncode(salt)}$${base64UrlEncode(new Uint8Array(derived))}`);
