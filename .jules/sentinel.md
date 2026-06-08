## 2024-06-08 - Added server-side validation of file content types using magic numbers

**Vulnerability:**
Missing server-side validation of file content types allowed attackers to bypass client-side MIME type checks by uploading malicious payloads disguised as allowed file types (e.g., an HTML or SVG payload with a `.jpg` extension).

**Learning:**
Client-provided MIME types and file extensions can be easily forged. Server-side validation based solely on the `Content-Type` header or file extension is insufficient to prevent malicious file uploads.

**Prevention:**
Always verify the actual contents of the uploaded file on the server using magic numbers (file signatures) to ensure the file type matches the allowed types before processing or storing the file.
