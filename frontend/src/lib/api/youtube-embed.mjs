export function youtubeEmbed(src) {
  if (!src) return null;
  try {
    const url = new URL(src);
    if (url.protocol !== 'https:' || url.username || url.password) return null;
    const host = url.hostname.replace(/^www\./, '');
    const short = host === 'youtu.be';
    if (!short && !['youtube.com', 'm.youtube.com', 'youtube-nocookie.com'].includes(host)) return null;
    const id = short ? url.pathname.split('/')[1]
      : url.searchParams.get('v') ?? url.pathname.match(/^\/(?:embed|shorts)\/([^/]+)/)?.[1];
    return /^[\w-]{11}$/.test(id ?? '') ? `https://www.youtube-nocookie.com/embed/${id}?playsinline=1&rel=0` : null;
  } catch {
    return null;
  }
}
