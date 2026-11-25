const YOUTUBE_HOSTS = new Set([
    'youtube.com',
    'www.youtube.com',
    'm.youtube.com',
    'youtu.be',
    'www.youtu.be',
    'youtube-nocookie.com',
    'www.youtube-nocookie.com'
]);

export function isYoutubeTrailerHost(hostname) {
    return typeof hostname === 'string' && YOUTUBE_HOSTS.has(hostname.toLowerCase());
}

export function youtubeTrailerId(value) {
    try {
        const url = new URL(value);
        if (url.protocol !== 'https:' || url.username || url.password) return null;
        const host = url.hostname.toLowerCase().replace(/^www\./, '');
        const short = host === 'youtu.be';
        if (!short && !['youtube.com', 'm.youtube.com', 'youtube-nocookie.com'].includes(host)) return null;
        const id = short
            ? url.pathname.match(/^\/([^/]+)\/?$/)?.[1]
            : url.pathname === '/watch'
                ? url.searchParams.get('v')
                : url.pathname.match(/^\/(?:embed|shorts)\/([^/]+)/)?.[1];
        return /^[\w-]{11}$/.test(id ?? '') ? id : null;
    } catch { return null; }
}
