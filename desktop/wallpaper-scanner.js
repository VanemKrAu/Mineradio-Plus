const fs = require('fs');
const path = require('path');

const PREVIEW_NAMES = new Set(['preview.jpg', 'preview.jpeg', 'preview.png', 'preview.gif']);

function wallpaperKey(rootPath, folderName) {
  return rootPath + '::' + folderName;
}

function getFolderSize(folderPath, _depth) {
  if ((_depth || 0) > 8) return 0;
  let total = 0;
  let entries;
  try { entries = fs.readdirSync(folderPath, { withFileTypes: true }); }
  catch (_) { return 0; }
  for (const entry of entries) {
    const entryPath = path.join(folderPath, entry.name);
    if (entry.isFile() || entry.isSymbolicLink()) {
      try { total += fs.statSync(entryPath).size; } catch (_) {}
    } else if (entry.isDirectory()) {
      total += getFolderSize(entryPath, (_depth || 0) + 1);
    }
  }
  return total;
}

function readProjectMeta(folderPath) {
  try {
    var raw = fs.readFileSync(path.join(folderPath, 'project.json'), 'utf8');
    var json = JSON.parse(raw);
    return {
      title: String(json.title || '').trim(),
      type: String(json.type || 'scene').trim(),
      mainFile: String(json.file || 'scene.json').trim(),
      supportsVideo: !!json.supportsvideo,
      rating: String(json.contentrating || 'Everyone').trim(),
    };
  } catch (_) {
    return { title: '', type: '', mainFile: 'scene.json', supportsVideo: false, rating: '' };
  }
}

function scanLibrary(rootPath) {
  var entries;
  try { entries = fs.readdirSync(rootPath, { withFileTypes: true }); }
  catch (_) { return []; }
  const folders = entries.filter((entry) => entry.isDirectory());
  const wallpapers = [];
  for (const folder of folders) {
    const folderPath = path.join(rootPath, folder.name);
    let children;
    try {
      children = fs.readdirSync(folderPath, { withFileTypes: true });
    } catch (_) {
      continue;
    }
    const preview = children.find((child) => child.isFile() && PREVIEW_NAMES.has(child.name.toLowerCase()));
    if (!preview) continue;
    const previewPath = path.join(folderPath, preview.name);

    // check for mp4 video
    var mp4Files = [];
    for (var ci = 0; ci < children.length; ci++) {
      var c = children[ci];
      if (c.isFile() && /\.mp4$/i.test(c.name)) mp4Files.push(c.name);
    }

    // check for scene.pkg
    var hasPkg = children.some(function(c) { return c.isFile() && c.name.toLowerCase() === 'scene.pkg'; });
    var hasGifPkg = children.some(function(c) { return c.isFile() && c.name.toLowerCase() === 'gifscene.pkg'; });

    let stat;
    try { stat = fs.statSync(folderPath); } catch (_) { continue; }
    var meta = readProjectMeta(folderPath);
    wallpapers.push({
      id: wallpaperKey(rootPath, folder.name),
      name: meta.title || folder.name,
      originalName: folder.name,
      rating: meta.rating,
      rootPath: rootPath,
      rootName: path.basename(rootPath) || rootPath,
      folderPath: folderPath,
      previewPath: previewPath,
      previewType: path.extname(preview.name).toLowerCase(),
      mp4Files: mp4Files,
      hasPkg: hasPkg,
      hasGifPkg: hasGifPkg,
      wallpaperType: meta.type || 'unknown',
      modifiedAt: stat.mtimeMs,
      size: getFolderSize(folderPath),
    });
  }
  return wallpapers;
}

function scanLibraries(rootPaths) {
  const roots = Array.isArray(rootPaths) ? rootPaths.filter(function(p){ return p && String(p).trim(); }) : [];
  const result = [];
  for (const rootPath of roots) {
    try {
      result.push(...scanLibrary(rootPath));
    } catch (_) {}
  }
  return result;
}

function autoDetectRoots() {
  const roots = [];
  const found = new Set();

  function normalizeKey(p) {
    return path.normalize(String(p || '')).replace(/\\+$/, '').toLowerCase();
  }

  var steamPath = '';
  try {
    var { execFileSync } = require('child_process');
    var output = execFileSync('reg', ['query', 'HKCU\\Software\\Valve\\Steam', '/v', 'SteamPath'], { encoding: 'utf8', timeout: 5000 });
    var match = output.match(/REG_SZ\s+(.+)/i);
    if (match) steamPath = match[1].trim();
  } catch (_) {}

  if (!steamPath || !fs.existsSync(steamPath)) {
    var common = [
      path.join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'Steam'),
      path.join(process.env['ProgramFiles'] || 'C:\\Program Files', 'Steam'),
      'C:\\Steam', 'D:\\Steam',
    ];
    for (var i = 0; i < common.length; i++) {
      if (fs.existsSync(common[i])) { steamPath = common[i]; break; }
    }
  }

  var libraryKeys = new Set();
  var libraryPaths = [];
  if (steamPath) {
    var key = normalizeKey(steamPath);
    libraryKeys.add(key);
    libraryPaths.push(steamPath);
  }
  try {
    var vdfPath = path.join(steamPath, 'steamapps', 'libraryfolders.vdf');
    if (steamPath && fs.existsSync(vdfPath)) {
      var vdf = fs.readFileSync(vdfPath, 'utf8');
      var pathRe = /"path"\s*"([^"]+)"/g;
      var m;
      while ((m = pathRe.exec(vdf)) !== null) {
        var lib = m[1].replace(/\\\\/g, '\\');
        if (!lib) continue;
        var libKey = normalizeKey(lib);
        if (!libraryKeys.has(libKey)) {
          libraryKeys.add(libKey);
          libraryPaths.push(lib);
        }
      }
    }
  } catch (_) {}

  var WE_APPID = '431960';
  for (var j = 0; j < libraryPaths.length; j++) {
    var lib = libraryPaths[j];
    if (!lib) continue;
    var workshopContent = path.join(lib, 'steamapps', 'workshop', 'content', WE_APPID);
    if (!fs.existsSync(workshopContent)) continue;
    var ck = normalizeKey(workshopContent);
    if (!found.has(ck)) {
      found.add(ck);
      roots.push(workshopContent);
    }
  }

  return roots;
}

// ────────────────────────────────────────────
//  PKG Extraction & Scene Parsing
// ────────────────────────────────────────────

const REPKG_EXE = path.join(__dirname, '..', 'build', 'tools', 'RePKG.exe');

/**
 * Run RePKG to extract scene.pkg into cache directory.
 * Returns path to cache dir or empty string on failure.
 */
function extractPkgToCache(folderPath) {
  var pkgFile = path.join(folderPath, 'scene.pkg');
  if (!fs.existsSync(pkgFile)) return '';
  var cacheDir = path.join(folderPath, '_repkg_cache');
  var cacheMarker = path.join(cacheDir, '.done');

  if (fs.existsSync(cacheMarker)) return cacheDir;

  try {
    var { execFileSync } = require('child_process');
    execFileSync(REPKG_EXE, ['extract', '-o', cacheDir, pkgFile], {
      encoding: 'utf8', stdio: 'pipe', timeout: 60000
    });
    fs.writeFileSync(cacheMarker, Date.now().toString());
    return cacheDir;
  } catch (e) {
    console.warn('[RePKG] extract failed for', folderPath, ':', e.message);
    // try legacy single-dir fallback
    try {
      var { execFileSync } = require('child_process');
      execFileSync(REPKG_EXE, ['extract', '-s', '-o', cacheDir, pkgFile], {
        encoding: 'utf8', stdio: 'pipe', timeout: 60000
      });
      fs.writeFileSync(cacheMarker, Date.now().toString());
      return cacheDir;
    } catch (e2) {
      console.warn('[RePKG] legacy extract also failed:', e2.message);
      return '';
    }
  }
}

/**
 * Walk a directory recursively, return flat list of {name, path}.
 */
function walkDir(dir, base) {
  base = base || dir;
  var results = [];
  var entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
  catch (_) { return results; }
  for (var i = 0; i < entries.length; i++) {
    var entry = entries[i];
    var fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push.apply(results, walkDir(fullPath, base));
    } else if (entry.isFile()) {
      results.push({
        name: path.relative(base, fullPath).replace(/\\/g, '/'),
        path: fullPath,
        ext: path.extname(entry.name).toLowerCase()
      });
    }
  }
  return results;
}

/**
 * Parse a Wallpaper Engine scene.json and return simplified layer list.
 */
function parseSceneJson(scenePath, cacheDir) {
  var scene;
  try {
    scene = JSON.parse(fs.readFileSync(scenePath, 'utf8'));
  } catch (_) {
    return null;
  }

  var layers = [];
  var rawLayers = scene.layers || [];

  function resolveFilePath(rawPath) {
    // scene.json paths like "materials/bg.tex" → after RePKG → "materials/bg.png"
    var ext = path.extname(rawPath).toLowerCase();
    if (ext === '.tex') {
      return rawPath.replace(/\.tex$/i, '.png');
    }
    return rawPath;
  }

  function processLayer(layer) {
    var type = (layer.type || 'image').toLowerCase();

    // composition layers act as containers
    if (type === 'composition' && Array.isArray(layer.layers)) {
      for (var k = 0; k < layer.layers.length; k++) {
        processLayer(layer.layers[k]);
      }
      return;
    }

    // skip non-visual layers
    if (type === 'camera' || type === 'sound') return;

    if (layer.visible === false) return;

    var entry = {
      name: layer.name || '',
      type: type,
      visible: layer.visible !== false,
      opacity: typeof layer.opacity === 'number' ? Math.min(1, Math.max(0, layer.opacity)) : 1,
      blending: layer.blending || 'opaque',
      origin: Array.isArray(layer.origin) ? layer.origin.slice(0, 2) : [0.5, 0.5],
      scale: Array.isArray(layer.scale) ? layer.scale.slice(0, 2) : [1, 1],
      angles: Array.isArray(layer.angles) ? layer.angles.slice(0, 3) : [0, 0, 0],
      tint: Array.isArray(layer.tint) ? layer.tint.slice(0, 3) : [1, 1, 1],
      effects: Array.isArray(layer.effects) ? layer.effects : [],
    };

    // resolve file path
    if (layer.file) {
      var resolved = resolveFilePath(layer.file);
      var fullPath = path.join(cacheDir, resolved);
      if (fs.existsSync(fullPath)) {
        entry.imageFile = resolved;
      }
    }

    // video layer support
    if (type === 'fullscreen' && layer.file && /\.mp4$/i.test(layer.file)) {
      var videoPath = path.join(cacheDir, layer.file);
      if (fs.existsSync(videoPath)) {
        entry.videoFile = layer.file;
      }
    }

    // textures array (for effect/sprite layers)
    if (Array.isArray(layer.textures)) {
      entry.textures = [];
      for (var t = 0; t < layer.textures.length; t++) {
        var texResolved = resolveFilePath(layer.textures[t]);
        if (fs.existsSync(path.join(cacheDir, texResolved))) {
          entry.textures.push(texResolved);
        }
      }
    }

    // particle system
    if (type === 'particle') {
      entry.particleSystem = layer.particleSystem || null;
    }

    layers.push(entry);
  }

  for (var i = 0; i < rawLayers.length; i++) {
    processLayer(rawLayers[i]);
  }

  return layers;
}

/**
 * Extract and parse a scene wallpaper from its PKG.
 * Returns a rich scene descriptor object.
 */
function extractWallpaperScene(folderPath) {
  var result = {
    ok: false,
    folderPath: folderPath,
    cacheDir: '',
    project: null,
    scene: null,
    layers: [],
    textures: [],
    videos: [],
    audio: [],
    error: '',
  };

  // read project.json first
  try {
    var projectRaw = fs.readFileSync(path.join(folderPath, 'project.json'), 'utf8');
    result.project = JSON.parse(projectRaw);
  } catch (_) {}

  // extract PKG
  var cacheDir = extractPkgToCache(folderPath);
  if (!cacheDir) {
    result.error = 'PKG extraction failed or no scene.pkg found';
    return result;
  }
  result.cacheDir = cacheDir;
  result.ok = true;

  // walk extracted files
  var allFiles = walkDir(cacheDir);
  for (var i = 0; i < allFiles.length; i++) {
    var f = allFiles[i];
    if (f.ext === '.png' || f.ext === '.jpg' || f.ext === '.jpeg' || f.ext === '.gif' || f.ext === '.webp') {
      result.textures.push(f);
    } else if (f.ext === '.mp4' || f.ext === '.webm') {
      result.videos.push(f);
    } else if (f.ext === '.ogg' || f.ext === '.mp3' || f.ext === '.wav') {
      result.audio.push(f);
    }
  }

  // find and parse scene.json
  var sceneFile = (result.project && result.project.file) ? result.project.file : 'scene.json';
  var scenePath = path.join(cacheDir, sceneFile);
  if (!fs.existsSync(scenePath)) {
    // try common alternatives
    var alts = ['scene.json', 'Scene.json'];
    for (var a = 0; a < alts.length; a++) {
      var altPath = path.join(cacheDir, alts[a]);
      if (fs.existsSync(altPath)) { scenePath = altPath; break; }
    }
  }

  if (fs.existsSync(scenePath)) {
    try {
      result.scene = JSON.parse(fs.readFileSync(scenePath, 'utf8'));
    } catch (_) {}
    result.layers = parseSceneJson(scenePath, cacheDir) || [];
  }

  // if no layers parsed, fall back to flat image list
  if (result.layers.length === 0 && result.textures.length > 0) {
    // sort by file size descending to find main background
    result.textures.sort(function(a, b) {
      try { return fs.statSync(b.path).size - fs.statSync(a.path).size; }
      catch(_) { return 0; }
    });
    var mainTex = result.textures[0];
    result.layers.push({
      name: 'main',
      type: 'image',
      visible: true,
      opacity: 1,
      blending: 'opaque',
      origin: [0.5, 0.5],
      scale: [1, 1],
      angles: [0, 0, 0],
      tint: [1, 1, 1],
      effects: [],
      imageFile: mainTex.name,
    });
  }

  return result;
}

// backward-compatible simple extraction (returns path to best PNG)
function extractWallpaperTexture(folderPath) {
  var scene = extractWallpaperScene(folderPath);
  if (!scene.ok) return '';

  // find largest texture as the "main" image
  var bestPath = '';
  var bestSize = 0;
  for (var i = 0; i < scene.textures.length; i++) {
    try {
      var st = fs.statSync(scene.textures[i].path);
      if (st.size > bestSize) {
        bestSize = st.size;
        bestPath = scene.textures[i].path;
      }
    } catch (_) {}
  }
  return bestPath;
}

function clearWallpaperCache(roots) {
  var cleaned = 0, bytes = 0;
  for (var r = 0; r < roots.length; r++) {
    try {
      var entries = fs.readdirSync(roots[r], { withFileTypes: true });
      for (var e = 0; e < entries.length; e++) {
        if (!entries[e].isDirectory()) continue;
        var cacheDir = path.join(roots[r], entries[e].name, '_repkg_cache');
        if (fs.existsSync(cacheDir)) {
          try {
            var files = fs.readdirSync(cacheDir);
            for (var f = 0; f < files.length; f++) {
              var fp = path.join(cacheDir, files[f]);
              try { bytes += fs.statSync(fp).size; } catch(__) {}
              try { fs.unlinkSync(fp); cleaned++; } catch(__) {}
            }
            try { fs.rmdirSync(cacheDir); } catch(__) {}
          } catch(__) {}
        }
      }
    } catch(__) {}
  }
  return { cleaned: cleaned, bytes: bytes };
}

function pickBestTexture(files, dir) {
  var best = { path: '', size: 0 };
  for (var i = 0; i < files.length; i++) {
    var f = files[i];
    if (!/\.png$/i.test(f)) continue;
    var fp = path.join(dir, f);
    var stat = fs.statSync(fp);
    if (stat.size > best.size) { best.size = stat.size; best.path = fp; }
  }
  return best.path;
}

module.exports = {
  scanLibrary,
  scanLibraries,
  autoDetectRoots,
  extractWallpaperTexture,
  extractWallpaperScene,
  clearWallpaperCache,
};
