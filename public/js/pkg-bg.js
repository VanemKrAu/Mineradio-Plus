// ════════════════════════════════════════════════
//  PKG 壁纸多层 WebGL 背景渲染
// ════════════════════════════════════════════════
var pkgBg = {
  gl: null, canvas: null, prog: null, quadBuf: null, posLoc: -1,
  scene: null, layers: [], textures: {}, editMode: false, folderPath: '',
  vsh: 'attribute vec2 a_pos;varying vec2 v_uv;void main(){gl_Position=vec4(a_pos,0.,1.);v_uv=a_pos*.5+.5;}',
  fsh: 'precision highp float;varying vec2 v_uv;uniform sampler2D u_tex;uniform vec2 u_canvasSize;uniform float u_opacity;uniform vec3 u_tint;uniform vec2 u_offset;uniform vec2 u_scale;void main(){vec2 uv=(v_uv-u_offset)/u_scale+.5;if(uv.x<0.||uv.x>1.||uv.y<0.||uv.y>1.)discard;vec4 c=texture2D(u_tex,uv);gl_FragColor=vec4(c.rgb*u_tint,c.a*u_opacity);}'
};

function initPkgBg() {
  var c = document.getElementById('pkg-bg-canvas');
  if (!c) return;
  pkgBg.canvas = c;
  try { pkgBg.gl = c.getContext('webgl', { premultipliedAlpha: false, alpha: true }) || c.getContext('experimental-webgl', { premultipliedAlpha: false, alpha: true }); } catch(_) {}
  if (!pkgBg.gl) return;
  var gl = pkgBg.gl;
  function compile(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn('PKG shader error:', gl.getShaderInfoLog(s)); gl.deleteShader(s); return null; } return s; }
  var vs = compile(gl.VERTEX_SHADER, pkgBg.vsh);
  var fs = compile(gl.FRAGMENT_SHADER, pkgBg.fsh);
  if (!vs || !fs) return;
  pkgBg.prog = gl.createProgram();
  gl.attachShader(pkgBg.prog, vs); gl.attachShader(pkgBg.prog, fs);
  gl.linkProgram(pkgBg.prog);
  pkgBg.posLoc = gl.getAttribLocation(pkgBg.prog, 'a_pos');
  pkgBg.quadBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, pkgBg.quadBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
}

function loadPkgBgTexture(name, url) {
  return new Promise(function(ok, fail) {
    var img = new Image();
    img.onload = function() {
      var gl = pkgBg.gl, tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      // 不 generateMipmap：壁纸纹理多为非2的幂尺寸，会报 GL_INVALID_OPERATION
      gl.bindTexture(gl.TEXTURE_2D, null);
      pkgBg.textures[name] = tex;
      ok(tex);
    };
    img.onerror = fail;
    img.src = url;
  });
}

// 从 applyWallpaper 调用的入口
function loadPkgBgFromApply(wp) {
  if (!wp || !wp.folderPath) return;
  var api = window.desktopWindow;
  if (!api || typeof api.extractWallpaperScene !== 'function') {
    showToast('桌面API不可用');
    return;
  }
  showToast('正在解析壁纸场景...');
  api.extractWallpaperScene(wp.folderPath).then(function(scene) {
    if (scene && scene.ok && scene.layers && scene.layers.length > 0) {
      loadPkgBgScene(scene).then(function(ok) {
        if (ok) showToast('壁纸场景已加载 (' + scene.layers.length + '层)，按W编辑');
      });
    }
  }).catch(function(e) {
    console.warn('[PKG-BG] failed:', e);
  });
}

async function loadPkgBgScene(scene) {
  if (!scene || !scene.ok) return false;
  if (!pkgBg.gl) initPkgBg();
  if (!pkgBg.gl) return false;
  pkgBg.scene = scene;
  pkgBg.layers = (scene.layers || []).map(function(l){ return Object.assign({}, l, { hidden: false }); });
  pkgBg.folderPath = scene.folderPath || '';
  pkgBg.textures = {};
  // 恢复保存的状态
  try {
    var saved = JSON.parse(localStorage.getItem('mineradio-pkg-bg-' + pkgBg.folderPath) || '{}');
    var h = saved.hidden || [];
    for (var i = 0; i < pkgBg.layers.length; i++) { if (h.indexOf(pkgBg.layers[i].name) >= 0) pkgBg.layers[i].hidden = true; }
  } catch(_) {}
  // 加载纹理
  var promises = [];
  var matched = 0, missing = 0;
  for (var i = 0; i < pkgBg.layers.length; i++) {
    var layer = pkgBg.layers[i];
    if (!layer.imageFile) { console.log('[PKG-BG] layer ' + i + ' (' + layer.name + ') no imageFile, skipping'); continue; }
    var texEntry = null;
    for (var j = 0; j < (scene.textures || []).length; j++) { if (scene.textures[j].name === layer.imageFile) { texEntry = scene.textures[j]; break; } }
    if (!texEntry || !texEntry.url) { console.log('[PKG-BG] layer ' + i + ' (' + layer.name + ') imageFile=' + layer.imageFile + ' NO texture match or no url'); missing++; continue; }
    console.log('[PKG-BG] layer ' + i + ' (' + layer.name + ') matched texture: ' + texEntry.name + ' url=' + texEntry.url.slice(0,80));
    matched++;
    promises.push(loadPkgBgTexture(layer.imageFile, texEntry.url).catch(function(){}));
  }
  await Promise.all(promises);
  pkgBg.canvas.style.display = 'block';
  console.log('[PKG-BG] loaded', pkgBg.layers.length, 'layers,', Object.keys(pkgBg.textures).length, 'textures');
  return true;
}

function renderPkgBg() {
  if (!pkgBg.scene || !pkgBg.gl || !pkgBg.prog) return;
  var gl = pkgBg.gl, c = pkgBg.canvas;
  if (c.width !== innerWidth || c.height !== innerHeight) { c.width = innerWidth; c.height = innerHeight; }
  gl.viewport(0, 0, c.width, c.height);
  gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
  gl.useProgram(pkgBg.prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, pkgBg.quadBuf);
  var uCS = gl.getUniformLocation(pkgBg.prog, 'u_canvasSize');
  gl.uniform2f(uCS, innerWidth, innerHeight);
  gl.enableVertexAttribArray(pkgBg.posLoc);
  gl.vertexAttribPointer(pkgBg.posLoc, 2, gl.FLOAT, false, 0, 0);
  gl.enable(gl.BLEND);
  for (var i = 0; i < pkgBg.layers.length; i++) {
    var layer = pkgBg.layers[i];
    if (!layer.visible) continue;
    if (layer.hidden) continue;
    var tex = pkgBg.textures[layer.imageFile];
    if (!tex) continue;
    var blend = (layer.blending || 'opaque').toLowerCase();
    if (blend === 'additive') { gl.blendFunc(gl.SRC_ALPHA, gl.ONE); gl.blendEquation(gl.FUNC_ADD); }
    else if (blend === 'translucent') { gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); }
    else { gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); }
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.uniform1i(gl.getUniformLocation(pkgBg.prog, 'u_tex'), 0);
    gl.uniform1f(gl.getUniformLocation(pkgBg.prog, 'u_opacity'), typeof layer.opacity === 'number' ? layer.opacity : 1);
    gl.uniform2f(gl.getUniformLocation(pkgBg.prog, 'u_offset'), (layer.origin||[0.5,0.5])[0], (layer.origin||[0.5,0.5])[1]);
    gl.uniform2f(gl.getUniformLocation(pkgBg.prog, 'u_scale'), (layer.scale||[1,1])[0], (layer.scale||[1,1])[1]);
    gl.uniform3f(gl.getUniformLocation(pkgBg.prog, 'u_tint'), (layer.tint||[1,1,1])[0], (layer.tint||[1,1,1])[1], (layer.tint||[1,1,1])[2]);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
}

function pkgBgSaveState() {
  if (!pkgBg.folderPath) return;
  var hidden = [];
  for (var i = 0; i < pkgBg.layers.length; i++) { if (pkgBg.layers[i].hidden) hidden.push(pkgBg.layers[i].name); }
  try { localStorage.setItem('mineradio-pkg-bg-' + pkgBg.folderPath, JSON.stringify({ hidden: hidden })); } catch(_) {}
}

function pkgBgDeleteLayer() {
  for (var i = pkgBg.layers.length - 1; i >= 0; i--) {
    if (pkgBg.layers[i].hidden || !pkgBg.layers[i].imageFile) continue;
    pkgBg.layers[i].hidden = true;
    pkgBgSaveState();
    showToast('隐藏图层: ' + (pkgBg.layers[i].name || '#' + i));
    return;
  }
  showToast('没有可删除的图层');
}

function pkgBgAddLayer() {
  for (var i = 0; i < pkgBg.layers.length; i++) {
    if (pkgBg.layers[i].hidden) {
      pkgBg.layers[i].hidden = false;
      pkgBgSaveState();
      showToast('恢复图层: ' + (pkgBg.layers[i].name || '#' + i));
      return;
    }
  }
  showToast('没有可恢复的图层');
}

function pkgBgToggleEdit() {
  pkgBg.editMode = !pkgBg.editMode;
  if (pkgBg.editMode) {
    var v = 0;
    for (var i = 0; i < pkgBg.layers.length; i++) { if (!pkgBg.layers[i].hidden && pkgBg.layers[i].imageFile) v++; }
    showToast('编辑模式 (Q恢复/E删除/W退出) · ' + v + ' 层可见');
  } else {
    pkgBgSaveState();
    showToast('编辑已保存');
  }
}

initPkgBg();
