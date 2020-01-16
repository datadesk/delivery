# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
