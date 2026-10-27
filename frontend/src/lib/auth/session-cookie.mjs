export function sessionCookieOptions(request, publicOrigin = process.env.AUTH_PUBLIC_ORIGIN) {
 const protocol = publicOrigin ? new URL(publicOrigin).protocol
  : request.headers.get('x-forwarded-proto') ? `${request.headers.get('x-forwarded-proto')}:`
  : new URL(request.url).protocol;
 return {httpOnly:true, secure:protocol !== 'http:', sameSite:'lax', path:'/'};
}
