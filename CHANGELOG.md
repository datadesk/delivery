# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `Delivery` can now be passed a `shouldBeCached` function to customize the logic that selects files to receive long-lived cache headers. This function is passed a single parameter — the input file path — and should return `true` or `false`.
- `.topojson` files will now get the content header of `application/json` thanks to a custom type addition to `mime`.

### Changed

- Delivery now uses `mime` instead of `mime-types`. It's smaller and makes it easy to add custom types.
- `maxAgeOverride` is now `cacheControlOverride` and expects you to provide the full string, not just the seconds for `max-age=`.
- The logic for what gets a long-lived cache header is no longer entirely based on content type and instead decided by whether a file shows signs of being hashed. By default this is a regular expression check looking for an eight-character [hexadecimal](https://en.wikipedia.org/wiki/Hexadecimal) hash in the filename. Filenames that pass this test will receive a `public, max-age=31536000, immutable` value. Files that match the `text/html` content type will instead get an explicit `no-cache` header. Files that do not pass either test get nothing and are at the mercy of upstream decisions.

## [0.5.0] - 2020-06-16

### Added

- Added the ability to pass a `maxAgeOverride` parameter to `uploadFile` and `uploadFiles`. If `shouldCache` is `true` and `maxAgeOverride` is provided, the upload functions will use this value instead to set the cache control header.

## [0.4.0] - 2020-01-26

### Added

- Added flag for using the [Accelerate endpoint with S3](https://docs.aws.amazon.com/AmazonS3/latest/dev/transfer-acceleration.html). `useAccelerateEndpoint` can now be passed when initializing the `Delivery` class. It will depend on the S3 bucket already having it active, however.

## [0.3.0] - 2020-01-16

### Added

- **Video files** (`.mp4`, `.webm`) now receive cache headers.

## [0.2.0] - 2019-12-06

### Added

- **Font files** (`.woff2`, `.woff`, `.ttf`, `.otf`) now receive cache headers.

### Changed

- JSON files are now cached for **one hour**.
- Images are now cached for **one year**.
- Minimum Node.js support is now `v10`. It may still work on `v8`, but no promises.
- This package is now available on `npm` as `@datagraphics/delivery` instead of `@datadesk/delivery`, which has been deprecated.

## [0.1.0] - 2019-08-19

### Added

- Initial release!
