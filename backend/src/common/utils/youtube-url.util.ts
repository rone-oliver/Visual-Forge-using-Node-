export function getYouTubeEmbedUrl(url: string): string {
    if (!url) {
        return '';
    }

    let videoId: string | null = null;

    try {
        const urlObject = new URL(url);
        const hostname = urlObject.hostname;

        if (hostname.includes('youtube.com')) {
            videoId = urlObject.searchParams.get('v');
        } else if (hostname.includes('youtu.be')) {
            videoId = urlObject.pathname.substring(1);
        }
    } catch (error) {
        // Fallback for non-standard URLs that the URL constructor might fail on.
    }

    // If URL parsing failed or didn't yield a videoId, try regex.
    if (!videoId) {
        const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
        const match = url.match(regex);
        if (match && match[1]) {
            videoId = match[1];
        }
    }

    if (videoId) {
        // Clean up any extra parameters that might be attached to the video ID
        const ampersandPosition = videoId.indexOf('&');
        if (ampersandPosition !== -1) {
            videoId = videoId.substring(0, ampersandPosition);
        }
        return `https://www.youtube.com/embed/${videoId}`;
    }

    // Return an empty string if no valid video ID could be extracted.
    return '';
}