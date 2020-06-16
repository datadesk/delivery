const oneMinute = 60;
const oneHour = 3600;
const oneYear = 31536000;

export const cacheLookup = new Map<string, number>();

// HTML
cacheLookup.set('text/html', oneMinute);

// CSS and JS
cacheLookup.set('text/css', oneYear);
cacheLookup.set('application/javascript', oneYear);

// images
cacheLookup.set('image/gif', oneYear);
cacheLookup.set('image/jpeg', oneYear);
cacheLookup.set('image/png', oneYear);
cacheLookup.set('image/svg+xml', oneYear);
cacheLookup.set('image/webp', oneYear);

// fonts
cacheLookup.set('font/woff2', oneYear);
cacheLookup.set('font/woff', oneYear);
cacheLookup.set('font/ttf', oneYear);
cacheLookup.set('font/otf', oneYear);

// videos
cacheLookup.set('video/mp4', oneYear);
cacheLookup.set('video/webm', oneYear);

// JSON
cacheLookup.set('application/json', oneHour);
