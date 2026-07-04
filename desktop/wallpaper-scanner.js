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
      rating: String(json.contentrating || 'Everyone').trim()
    };
  } catch (_) {
    return { title: '', rating: '' };
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
    var mp4File = '';
    var mp4Child = children.find(function(c){ return c.isFile() && /\.mp4$/i.test(c.name); });
    if (mp4Child) mp4File = path.join(folderPath, mp4Child.name);
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
      mp4File: mp4File,
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

module.exports = { scanLibrary, scanLibraries, autoDetectRoots, extractWallpaperTexture, clearWallpaperCache };

// -- RePKG integration: extract high-quality texture from scene.pkg --
const REPKG_EXE = path.join(__dirname, '..', 'build', 'tools', 'RePKG.exe');
function extractWallpaperTexture(folderPath) {
  try {
    var pkgFile = path.join(folderPath, 'scene.pkg');
    if (!fs.existsSync(pkgFile)) return '';
    var cacheDir = path.join(folderPath, '_repkg_cache');
    var cacheMarker = path.join(cacheDir, '.done');
    // use cache if already extracted
    if (fs.existsSync(cacheMarker)) {
      var files = [];
      try { files = fs.readdirSync(cacheDir); } catch(e) { return ''; }
      var bestFile = pickBestTexture(files, cacheDir);
      return bestFile;
    }
    // run repkg
    var { execFileSync } = require('child_process');
    execFileSync(REPKG_EXE, ['extract', '-s', '-o', cacheDir, pkgFile], { encoding: 'utf8', stdio: 'pipe', timeout: 30000 });
    // clean up non-PNG files to save space
    try {
      var allFiles = fs.readdirSync(cacheDir);
      for (var fi = 0; fi < allFiles.length; fi++) {
        if (!/\.png$/i.test(allFiles[fi]) && allFiles[fi] !== '.done') {
          try { fs.unlinkSync(path.join(cacheDir, allFiles[fi])); } catch(e) {}
        }
      }
    } catch(e) {}
    fs.writeFileSync(cacheMarker, Date.now().toString());
    var files = [];
    try { files = fs.readdirSync(cacheDir); } catch(e) {}
    return pickBestTexture(files, cacheDir);
  } catch (e) {
    console.warn('[RePKG] extract failed for', folderPath, ':', e.message);
    return '';
  }
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
