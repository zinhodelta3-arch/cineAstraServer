// Use Host, preserved by the reverse proxy, rather than Next's internal URL.
// A fixed origin also supports proxies that rewrite Host.
export function isAllowedAuthOrigin(request, publicOrigin = process.env.AUTH_PUBLIC_ORIGIN) {
 const origin = request.headers.get('origin');
 if (!origin || origin === 'null') return false;
 try {
  const source = new URL(origin);
  if (!['http:', 'https:'].includes(source.protocol) || source.origin !== origin) return false;
  if (publicOrigin) {
   const configured = new URL(publicOrigin);
   return ['http:', 'https:'].includes(configured.protocol) && configured.origin === publicOrigin && origin === publicOrigin;
  }
  const internal = new URL(request.url);
  const host = request.headers.get('host') || internal.host;
  const forwardedProto = request.headers.get('x-forwarded-proto');
  const protocol = forwardedProto ? `${forwardedProto}:` : internal.protocol;
  if (!['http:', 'https:'].includes(protocol)) return false;
  return origin === `${protocol}//${host}`;
 } catch {
  return false;
 }
}
