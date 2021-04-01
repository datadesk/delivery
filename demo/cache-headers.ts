/**
 * This Cache-Control header will require browsers to validate with browsers
 * on each request. Good for HTML.
 *
 * @private
 */
export const requireRevalidation = 'no-cache';

/**
 * This Cache-Control header will tell browsers to cache this resource for
 * one year. Only makes sense with versioned files.
 *
 * @private
 */
export const longLiveCache = 'public, max-age=31536000, immutable';
