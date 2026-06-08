🧹 [code health improvement] Refactor generateCertificatePDF into smaller helper functions

🎯 **What:**
Refactored the `generateCertificatePDF` function in `src/lib/pdf/certificate-generator.ts` by extracting its long, monolithic body into four smaller, well-named private helper functions: `drawHeader`, `drawDetails`, `drawSignatures`, and `drawFooter`. Also created a `CertificateFonts` interface.

💡 **Why:**
The original `generateCertificatePDF` function was overly long, handling multiple different drawing concerns sequentially within the same scope. Breaking it into smaller helper functions significantly improves readability, reduces cognitive complexity, and makes future maintenance (like tweaking the header layout or footer text) much simpler.

✅ **Verification:**
Verified code correctness by checking that the TypeScript compiler passes and confirming no logic changes or side effects were introduced. The exact same arguments and variables are being passed to the underlying `pdf-lib` drawing functions.

✨ **Result:**
A much cleaner `generateCertificatePDF` orchestrator function that clearly documents the PDF creation process, backed by modular helper functions.
