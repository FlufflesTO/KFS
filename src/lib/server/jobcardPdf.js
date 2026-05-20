const encoder = new TextEncoder();

function escapePdfText(value) {
  return String(value ?? "")
    .replaceAll("\\", "\\\\")
    .replaceAll("(", "\\(")
    .replaceAll(")", "\\)")
    .replaceAll("\r", " ")
    .replaceAll("\n", " ");
}

function dataUriToBytes(dataUri) {
  if (typeof dataUri !== "string") {
    throw new Error("signatureBase64 must be a string.");
  }

  const match = dataUri.match(/^data:image\/(png|jpeg|jpg);base64,(?<data>[A-Za-z0-9+/=]+)$/);
  const base64 = match?.groups?.data || dataUri;
  if (!/^[A-Za-z0-9+/=]+$/.test(base64)) {
    throw new Error("signatureBase64 is not valid base64 image data.");
  }

  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);

  if (bytes.length < 32) {
    throw new Error("signature image data is too small.");
  }

  return bytes;
}

async function sha256Hex(bytes) {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function buildJobcardPdf({ jobId, systemId, technician, techComments, signatureBase64, completedAt }) {
  const signatureBytes = dataUriToBytes(signatureBase64);
  const signatureHash = await sha256Hex(signatureBytes);
  const lines = [
    "KHARON FIRE AND SECURITY SOLUTIONS (PTY) LTD",
    "Field Service Jobcard Closure",
    `Job ID: ${jobId}`,
    `System ID: ${systemId}`,
    `Technician: ${technician.name} (${technician.email})`,
    `Completed At: ${completedAt}`,
    `Signature SHA-256: ${signatureHash}`,
    `Technician Comments: ${techComments}`
  ];

  const content = [
    "BT",
    "/F1 13 Tf",
    "50 790 Td",
    "18 TL",
    ...lines.map((line, index) => `${index === 0 ? "" : "T*"}(${escapePdfText(line).slice(0, 220)}) Tj`),
    "ET"
  ].join("\n");

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${encoder.encode(content).length} >>\nstream\n${content}\nendstream`
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  for (let index = 0; index < objects.length; index += 1) {
    offsets.push(encoder.encode(pdf).length);
    pdf += `${index + 1} 0 obj\n${objects[index]}\nendobj\n`;
  }

  const xrefOffset = encoder.encode(pdf).length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let index = 1; index < offsets.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return {
    pdfBytes: encoder.encode(pdf),
    signatureBytes,
    signatureHash
  };
}
