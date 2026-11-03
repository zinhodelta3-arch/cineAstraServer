export function youtubeTrailerId(value) {
    try {
        const url = new URL(value);
        if (url.protocol !== 'https:' || url.username || url.password) return null;
        const id = url.hostname === 'youtu.be' ? url.pathname.slice(1)
            : ['www.youtube.com', 'youtube.com'].includes(url.hostname) && url.pathname === '/watch' ? url.searchParams.get('v') : null;
        return /^[\w-]{11}$/.test(id ?? '') ? id : null;
    } catch { return null; }
}
