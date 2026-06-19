export function verifyAdminSecret(request: Request): boolean {
  const secret = process.env.SMNT_ADMIN_SECRET;
  if (!secret) return false;
  return request.headers.get("x-smnt-admin-secret") === secret;
}

export function adminSecretConfigured(): boolean {
  return Boolean(process.env.SMNT_ADMIN_SECRET);
}
