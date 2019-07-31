const oneMinute = 'max-age=60';
const fiveMinutes = 'max-age=300';
const oneHour = 'max-age=3600';
const oneWeek = 'max-age=604800';
const oneYear = 'max-age=31536000';

export const cacheLookup = new Map<string, string>();

// HTML
cacheLookup.set('text/html', oneMinute);

// CSS and JS
cacheLookup.set('text/css', oneYear);
cacheLookup.set('application/javascript', oneYear);

// images
cacheLookup.set('image/gif', oneWeek);
cacheLookup.set('image/jpeg', oneWeek);
cacheLookup.set('image/png', oneWeek);
cacheLookup.set('image/svg+xml', oneWeek);
cacheLookup.set('image/webp', oneWeek);

// JSON
cacheLookup.set('application/json', fiveMinutes);
