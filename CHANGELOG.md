# Changelog

All notable changes to this project will be documented in this file.

## [1.2.0] - 2025-07-06

### Added

- **PKG scene WebGL multi-layer renderer** — parses Wallpaper Engine `scene.json` (both 2D `layers` and 3D `objects` formats), resolves model→material→texture chains, and renders all image layers in-order with full blending support
- **PKG embedded video auto-detection** — `extractWallpaperScene` finds MP4/WEBM videos inside `.tex` files; when present, video takes priority over static textures
- **Smart wallpaper application** — detects whether a wallpaper contains video (sidecar `.mp4` or PKG-embedded) and applies the best available source automatically
- **5 blend modes** — `opaque`, `additive`, `translucent`, `multiply`, `screen` supported via D3D11/WebGL blend state switching
- Desktop wallpaper window now receives scene data (layers + textures + videos) from the main process
- `readWallpaperFile` now supports `.mp4` and `.webm` MIME types

### Fixed

- `scene.json` now parses `objects` array (3D scene format), not just `layers` (2D format)
- RePKG extraction switched to `-s` flat mode as primary; ensures `scene.json`, model JSONs, and material JSONs are extracted correctly alongside textures
- Sidecar `.mp4` video wallpapers no longer get overridden by PKG texture extraction
- `<video>` element z-order: moved above WebGL canvas, below particle overlay
- `wp.mp4File` (old single string) → `wp.mp4Files` (new string array) — video wallpapers now correctly detected

### Changed

- `wallpaper-scanner.js` major refactor:
  - New `extractWallpaperScene()` returns full scene descriptor with layers, textures, videos, audio
  - New `parseSceneJson()` supports both 2D `layers` and 3D `objects` formats with model→material→texture resolution
  - `extractWallpaperTexture()` now prefers video files when found
  - `extractPkgToCache()` uses `-s` flat extraction mode first
  - `scanLibrary()` returns `mp4Files` array + `hasPkg`/`hasGifPkg` flags
- `wallpaper.html` WebGL renderer: dedicated `gl` + `overlay` canvas separation; video takeover hides WebGL layer
- `index.html` wallpaper application flow: MP4 → PKG video → PKG texture fallback chain

## [1.1.2] - 2025-06-09

_Previous release — see git tag for details._

## [1.1.1-1] - 2025-06-07

_Initial tagged release._
