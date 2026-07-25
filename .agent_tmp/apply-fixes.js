var fs = require('fs');
var path = require('path');
var base = 'E:/WorkSpace/Mineradio+/';

function replace(file, pairs) {
  var fp = base + file;
  var c = fs.readFileSync(fp, 'utf8');
  var changed = false;
  pairs.forEach(function(p) {
    var b = c;
    c = c.split(p[0]).join(p[1]);
    if (c !== b) changed = true;
  });
  if (changed) fs.writeFileSync(fp, c, 'utf8');
  console.log(file + ' ' + (changed ? 'CHANGED' : 'unchanged'));
}

// 1. main.js - add wallpaperScanner require
replace('desktop/main.js', [
  ['const systemMemory = require(\'./system-memory\');\nconst {', 'const systemMemory = require(\'./system-memory\');\nconst wallpaperScanner = require(\'./wallpaper-scanner\');\nconst {'],
  // Add IPC handlers before mineradio-cache-get-settings
  ['ipcMain.handle(\'mineradio-cache-get-settings\'', '// --- PKG extraction for daily review ---\nipcMain.handle(\'mineradio-wallpaper-extract-scene\', async (_event, folderPath) => {\n  try { return wallpaperScanner.extractWallpaperScene(folderPath); }\n  catch (e) { return { ok: false, error: e.message }; }\n});\n\nipcMain.handle(\'mineradio-wallpaper-read-file\', async (_event, filePath) => {\n  try {\n    if (!filePath || !fs.existsSync(filePath)) return { ok: false, error: \'FILE_NOT_FOUND\' };\n    var stat = fs.statSync(filePath);\n    if (!stat.isFile()) return { ok: false, error: \'NOT_A_FILE\' };\n    var ext = path.extname(filePath).toLowerCase();\n    var mime = { \'.jpg\':\'image/jpeg\',\'.jpeg\':\'image/jpeg\',\'.png\':\'image/png\',\'.mp4\':\'video/mp4\',\'.webm\':\'video/webm\' }[ext] || \'application/octet-stream\';\n    if (stat.size > 50 * 1024 * 1024) {\n      var proxyUrl = \'http://127.0.0.1:\' + (process.env.PORT || 3000) + \'/api/wallpaper/serve-extracted?path=\' + encodeURIComponent(path.resolve(filePath));\n      return { ok: true, dataUrl: proxyUrl, proxy: true };\n    }\n    var data = fs.readFileSync(filePath);\n    return { ok: true, dataUrl: \'data:\' + mime + \';base64,\' + data.toString(\'base64\') };\n  } catch (e) { return { ok: false, error: e.message }; }\n});\n\nipcMain.handle(\'mineradio-cache-get-settings\'']
]);

// 2. preload.js - add bridges
replace('desktop/preload.js', [
  ['readLyricCache:', 'extractWallpaperScene: (folderPath) => ipcRenderer.invoke(\'mineradio-wallpaper-extract-scene\', String(folderPath || \'\')),\n  readWallpaperFile: (filePath) => ipcRenderer.invoke(\'mineradio-wallpaper-read-file\', String(filePath || \'\')),\n  readLyricCache:']
]);

// 3. wallpaper-engine-library.js - add folderPath to getProjectDetails
replace('desktop/wallpaper-engine-library.js', [
  ['workshopId,', 'workshopId,\n      folderPath: record.projectRoot,']
]);

// 4. index.html - add buttons
replace('public/index.html', [
  // Add 壁纸视频 button to daily review card
  ['<button id=\"home-dashboard-video-choose\" type=\"button\" onclick=\"openHomeDashboardVideoPicker()\">选择 MP4</button>',
   '<button id=\"home-dashboard-video-choose\" type=\"button\" onclick=\"openHomeDashboardVideoPicker()\">选择 MP4</button>\n              <button type=\"button\" onclick=\"openWeForDailyReviewVideo()\">壁纸视频</button>'],
  // Add rating filter dropdown to WE library toolbar
  ['<div class=\"wallpaper-engine-toolbar\">\n          <input id=\"wallpaper-engine-search\"',
   '<div class=\"wallpaper-engine-toolbar\">\n          <div class=\"we-rating-dropdown\" id=\"we-rating-dropdown\" style=\"position:relative;display:inline-flex;align-items:center;margin-right:6px\">\n            <button class=\"fx-mini-btn ghost\" id=\"we-rating-dropdown-btn\" type=\"button\" style=\"display:flex;align-items:center;gap:4px\">\n              <span id=\"we-rating-label\">全部</span>\n              <span style=\"font-size:7px;opacity:.6;margin-top:1px\">▾</span>\n            </button>\n            <div id=\"we-rating-menu\" style=\"display:none;position:absolute;top:calc(100% + 4px);left:0;min-width:100px;background:rgba(14,15,20,.98);border:1px solid rgba(255,255,255,.12);border-radius:10px;padding:4px;z-index:30;box-shadow:0 12px 32px rgba(0,0,0,.45)\">\n              <button class=\"we-rating-item active\" data-we-rating=\"all\" type=\"button\" style=\"display:block;width:100%;padding:6px 10px;border:0;border-radius:7px;background:transparent;color:rgba(255,255,255,.82);font:inherit;font-size:11px;text-align:left;cursor:pointer\">全部</button>\n              <button class=\"we-rating-item\" data-we-rating=\"Everyone\" type=\"button\" style=\"display:block;width:100%;padding:6px 10px;border:0;border-radius:7px;background:transparent;color:rgba(255,255,255,.82);font:inherit;font-size:11px;text-align:left;cursor:pointer\">全年龄</button>\n              <button class=\"we-rating-item\" data-we-rating=\"Questionable\" type=\"button\" style=\"display:block;width:100%;padding:6px 10px;border:0;border-radius:7px;background:transparent;color:rgba(255,255,255,.82);font:inherit;font-size:11px;text-align:left;cursor:pointer\">可疑</button>\n              <button class=\"we-rating-item\" data-we-rating=\"Mature\" type=\"button\" style=\"display:block;width:100%;padding:6px 10px;border:0;border-radius:7px;background:transparent;color:rgba(255,255,255,.82);font:inherit;font-size:11px;text-align:left;cursor:pointer\">成人</button>\n            </div>\n          </div>\n          <input id=\"wallpaper-engine-search\"']
]);

// 5. Revert unnecessary changes in original files (splash-wordmark etc)
// The server.js already has serve-extracted route (from backup)

console.log('--- DONE ---');
