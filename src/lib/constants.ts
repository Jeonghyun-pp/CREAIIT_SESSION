export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export const ALLOWED_EXTENSIONS = [
  ".pdf", ".pptx", ".ppt", ".key",
  ".zip", ".tar.gz",
  ".py", ".ipynb", ".ts", ".js", ".tsx", ".jsx",
  ".png", ".jpg", ".jpeg", ".gif", ".svg",
  ".md", ".txt", ".csv",
] as const;

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-powerpoint",
  "application/zip",
  "application/x-tar",
  "application/gzip",
  "text/plain",
  "text/csv",
  "text/markdown",
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/svg+xml",
  "application/octet-stream",
] as const;
