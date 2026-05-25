const encoder = new TextEncoder();

function escapePdfText(value) {
  return String(value ?? "")
    .replaceAll("\\", "\\\\")
    .replaceAll("(", "\\(")
    .replaceAll(")", "\\)")
    .replaceAll("\r", " ")
    .replaceAll("\n", " ");
}

function wrapText(value, width = 86) {
  const words = String(value || "").replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  const lines = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > width && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }

  if (current) lines.push(current);
  return lines.length ? lines : ["Not recorded"];
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

function normalizeSignatureStrokes(strokes) {
  if (!Array.isArray(strokes)) return [];

  return strokes
    .map((stroke) => {
      if (!Array.isArray(stroke)) return [];
      return stroke
        .map((point) => ({
          x: Math.min(1, Math.max(0, Number(point?.x))),
          y: Math.min(1, Math.max(0, Number(point?.y)))
        }))
        .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
    })
    .filter((stroke) => stroke.length >= 2)
    .slice(0, 80);
}

function signatureCommands(strokes, box) {
  const normalized = normalizeSignatureStrokes(strokes);
  if (!normalized.length) return [];

  const commands = [
    "0.08 w",
    "0.10 0.10 0.10 RG"
  ];

  for (const stroke of normalized) {
    const [first, ...rest] = stroke;
    commands.push(`${(box.x + first.x * box.width).toFixed(2)} ${(box.y + (1 - first.y) * box.height).toFixed(2)} m`);
    for (const point of rest) {
      commands.push(`${(box.x + point.x * box.width).toFixed(2)} ${(box.y + (1 - point.y) * box.height).toFixed(2)} l`);
    }
    commands.push("S");
  }

  return commands;
}

function textLine(value, x, y, size = 10) {
  return [
    "BT",
    `/F1 ${size} Tf`,
    `${x} ${y} Td`,
    `(${escapePdfText(value).slice(0, 180)}) Tj`,
    "ET"
  ];
}

function pdfCircle(cx, cy, r, colorCmd) {
  const k = +(0.5523 * r).toFixed(2);
  const [x, y] = [+cx.toFixed(2), +cy.toFixed(2)];
  const rr = +r.toFixed(2);
  return [
    colorCmd,
    `${x + rr} ${y} m`,
    `${x + rr} ${y + k} ${x + k} ${y + rr} ${x} ${y + rr} c`,
    `${x - k} ${y + rr} ${x - rr} ${y + k} ${x - rr} ${y} c`,
    `${x - rr} ${y - k} ${x - k} ${y - rr} ${x} ${y - rr} c`,
    `${x + k} ${y - rr} ${x + rr} ${y - k} ${x + rr} ${y} c`,
    "h f"
  ].join("\n");
}

export async function buildJobcardPdf({
  jobId,
  systemId,
  technician,
  techComments,
  signatureBase64,
  signatureStrokes = [],
  completedAt,
  evidence = {}
}) {
  const signatureBytes = dataUriToBytes(signatureBase64);
  const signatureHash = await sha256Hex(signatureBytes);
  const signatureBox = { x: 54, y: 112, width: 250, height: 86 };
  const comments = wrapText(techComments, 92).slice(0, 7);
  const followUp = wrapText(evidence.followUpActions, 82).slice(0, 4);

  const content = [
    "0.95 0.96 0.97 rg",
    "0 0 595 842 re f",
    // Letterhead-style header
    "0.04 0.05 0.06 rg",
    "0 768 595 74 re f",
    "0.12 0.31 0.47 rg",
    "0 762 595 6 re f",
    // Verified mark approximation: blue ring, transparent center, purple disk and dark base.
    pdfCircle(549, 805, 27, "0.23 0.45 0.74 rg"),
    pdfCircle(549, 805, 19, "0.04 0.05 0.06 rg"),
    pdfCircle(549, 805, 12, "0.29 0.10 0.49 rg"),
    "0.13 0.12 0.13 rg",
    "525 778 48 10 re f",
    // Header text
    "1 1 1 rg",
    ...textLine("KHARON", 44, 816, 16),
    ...textLine("FIRE & SECURITY SOLUTIONS", 44, 797, 9),
    ...textLine("Field Service Jobcard Closure", 44, 780, 10),
    ...textLine(`Completed: ${completedAt}`, 300, 780, 9),
    "0.30 0.18 0.51 rg",
    "44 724 507 20 re f",
    "1 1 1 rg",
    ...textLine("Operational Evidence", 54, 730, 10),
    "0.04 0.05 0.06 rg",
    ...textLine(`Job ID: ${jobId}`, 54, 700, 10),
    ...textLine(`Job Type: ${evidence.jobType || "Maintenance"}`, 54, 682, 10),
    ...textLine(`Technician: ${technician.name} (${technician.email})`, 54, 664, 10),
    ...textLine(`Client/Site: ${evidence.ownerCompanyName || "Not recorded"}`, 54, 636, 10),
    ...textLine(`Address: ${evidence.physicalAddress || "Not recorded"}`, 54, 618, 9),
    ...textLine(`System: ${evidence.systemType || "Not recorded"} / ${evidence.coverageArea || "Not recorded"}`, 54, 590, 10),
    ...textLine(`System ID: ${systemId}`, 54, 572, 9),
    ...textLine(`Scheduled Date: ${evidence.scheduledDate || "Not recorded"}`, 54, 554, 9),
    ...textLine(`Fault Category: ${evidence.faultCategory || "Not recorded"}`, 54, 526, 10),
    ...textLine(`Parts Used: ${evidence.partsUsed || "None recorded"}`, 54, 508, 10),
    ...textLine("Technician Comments", 54, 472, 11),
    ...comments.flatMap((line, index) => textLine(line, 54, 452 - index * 15, 9)),
    ...textLine("Follow-up Actions", 54, 326, 11),
    ...followUp.flatMap((line, index) => textLine(line, 54, 306 - index * 15, 9)),
    "0.82 0.84 0.86 RG",
    "0.5 w",
    `${signatureBox.x} ${signatureBox.y} ${signatureBox.width} ${signatureBox.height} re S`,
    ...textLine("Client / responsible person signature", 54, 206, 9),
    ...signatureCommands(signatureStrokes, signatureBox),
    ...textLine(`Signature SHA-256: ${signatureHash}`, 54, 76, 7),
    // Footer separator
    "0.75 0.76 0.78 RG",
    "0.5 w",
    "44 62 m 551 62 l S",
    // Footer banner
    "0.04 0.05 0.06 rg",
    "0 0 595 52 re f",
    "1 1 1 rg",
    ...textLine("Kharon Fire and Security Solutions (Pty) Ltd  |  Reg: 2016/313076/07", 44, 36, 8),
    ...textLine("Unit 58, M5 Freeway Park, Cnr Uppercamp & Berkley Rd, Ndabeni, Maitland, 7405", 44, 22, 7),
    ...textLine("T: 061 545 8830   E: admin@kharon.co.za   W: www.kharon.co.za", 44, 10, 7)
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
