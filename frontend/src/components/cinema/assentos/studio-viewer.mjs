import { Mat, V, hexRgb, studioGraphics, studioParts } from './studio-geometry.mjs';

function mixColor(base, accent, weight = 0.55) {
  const rgb = typeof base === 'string' ? hexRgb(base) : base;
  return [
    rgb[0] * (1 - weight) + accent[0] * weight,
    rgb[1] * (1 - weight) + accent[1] * weight,
    rgb[2] * (1 - weight) + accent[2] * weight,
  ];
}

export function openStudio(canvas, scene, onLost) {
  const gl = canvas.getContext('webgl2', { alpha: false, antialias: true });
  if (!gl) throw new Error('WebGL indisponível.');
  const { program, loc, draw, dispose } = studioGraphics(gl);

  let currentScene = scene;
  let objects = [];
  let seats = new Map();
  let pickingSeats = new Map();
  let pickingObjects = new Map();
  let distance = 30;

  function loadSceneData(nextScene) {
    currentScene = nextScene;
    objects = nextScene.objects.map(object => ({ ...object, parts: studioParts(object, nextScene.environment) }));
    seats = new Map(objects.filter(object => object.seatId).map(object => [object.seatId, object]));
    pickingSeats = new Map(Array.from(seats.values(), object => [object.id, object.seatId]));
    pickingObjects = new Map(objects.map(object => [object.id, object.id]));
    distance = nextScene.sceneSize * (nextScene.environment === 'stadium' ? 1.92 : 1.59);
  }
  loadSceneData(scene);

  const buffer = gl.createFramebuffer(), color = gl.createTexture(), depth = gl.createRenderbuffer();
  gl.bindTexture(gl.TEXTURE_2D, color);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.bindFramebuffer(gl.FRAMEBUFFER, buffer);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, color, 0);
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depth);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  const center = [0, 2, 0];
  let camera = { mode: 'overview', yaw: .38, pitch: .71, zoom: 1 };
  let pending = 0, width = 0, height = 0;
  let marks = { selected: new Set(), unavailable: new Set(), inspectedId: '', selectedObjectId: null };
  let palette = { bg: [.08,.05,.05], selected: [.93,.69,.25], inspected: [.96,.91,.87] };

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const w = Math.max(1, Math.round(canvas.clientWidth * dpr)), h = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (w === width && h === height) return;
    canvas.width = width = w; canvas.height = height = h;
    gl.bindTexture(gl.TEXTURE_2D, color);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, depth);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, w, h);
  }

  function render(pickMode = false) {
    const pick = Boolean(pickMode);
    resize();
    gl.bindFramebuffer(gl.FRAMEBUFFER, pick ? buffer : null);
    if (pick) gl.disable(gl.DITHER);
    else gl.enable(gl.DITHER);
    gl.viewport(0, 0, width, height);
    gl.clearColor(...(pick ? [0,0,0] : palette.bg), 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(program);
    const { yaw, pitch, position } = camera;
    const direction = [Math.sin(yaw)*Math.cos(pitch), Math.sin(pitch), Math.cos(yaw)*Math.cos(pitch)];
    const inside = camera.mode === 'inside';
    const zoomFactor = camera.zoom ?? 1;
    const eye = inside ? position : V.add(center, V.scale(direction, distance * zoomFactor * Math.max(1, .9 * height / width)));
    const target = inside ? V.add(eye, direction) : center;
    gl.uniformMatrix4fv(loc.uView, false, Mat.lookAt(eye, target));
    gl.uniformMatrix4fv(loc.uProj, false, Mat.perspective(inside ? Math.PI / 2.8 : Math.PI / 4.2, width / height, .12, 10000));
    gl.uniform3fv(loc.uCamera, eye);
    gl.uniform3fv(loc.uBackdrop, palette.bg);
    for (const object of objects) {
      const inspected = object.seatId && object.seatId === marks.inspectedId;
      const selected = object.seatId && marks.selected.has(object.seatId);
      const unavailable = object.seatId && marks.unavailable.has(object.seatId);
      const editorSelected = marks.selectedObjectId != null && object.id === marks.selectedObjectId;
      const shade = selected ? palette.selected : unavailable ? [.39,.39,.39] : inspected ? palette.inspected : null;
      const pickId = pickMode === 'object' ? object.id : (object.seatId ? object.id : 0);
      for (const part of object.parts) {
        const colorValue = editorSelected ? mixColor(part.color, palette.selected, 0.58) : (shade ?? part.color);
        draw(part.geo, part.pos, part.scale, colorValue, part.rot, pickId, pick ? 1 : part.alpha, pick);
      }
    }
  }

  function repaint() {
    if (!pending) pending = requestAnimationFrame(() => { pending = 0; render(); });
  }
  const observer = new ResizeObserver(repaint);
  observer.observe(canvas);
  canvas.addEventListener('webglcontextlost', onLost);
  repaint();

  function pickAt(clientX, clientY, mode) {
    render(mode);
    const rect = canvas.getBoundingClientRect(), pixel = new Uint8Array(4);
    const x = Math.min(width-1, Math.max(0, Math.floor((clientX-rect.left)*width/rect.width)));
    const y = Math.min(height-1, Math.max(0, height-1-Math.floor((clientY-rect.top)*height/rect.height)));
    gl.readPixels(x,y,1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixel);
    gl.bindFramebuffer(gl.FRAMEBUFFER,null);
    const rawId = pixel[0]+(pixel[1]<<8)+(pixel[2]<<16);
    return mode === 'object' ? pickingObjects.get(rawId) ?? null : pickingSeats.get(rawId);
  }

  function moveInsideObject(object) {
    if (!object) return;
    const yaw = object.rotation;
    // Coordenadas locais da altura dos olhos e do centro da almofada no Studio.
    const stadiumSeat = currentScene.environment === 'stadium' && object.type === 'seat' && object.label?.startsWith('Setor ');
    const eyeHeight = object.type === 'car' ? 2.45 : object.type === 'bench' ? 2.65 : stadiumSeat ? 2.25 : 3.1;
    const offset = (object.type === 'car' ? -.2 : object.type === 'bench' ? .05 : .23) * object.sz;
    camera = { mode: 'inside', yaw, pitch: 0, zoom: camera.zoom ?? 1, position: [
      object.x + Math.sin(yaw) * offset,
      object.y + eyeHeight * object.sy,
      object.z + Math.cos(yaw) * offset
    ] };
    repaint();
  }

  return {
    updateScene(nextScene) {
      loadSceneData(nextScene);
      repaint();
    },
    setSeats({ selected = [], unavailable = [], inspectedId = '', selectedObjectId = null }) {
      marks = { selected: new Set(selected), unavailable: new Set(unavailable), inspectedId, selectedObjectId };
      repaint();
    },
    setTheme(bg, selected, inspected) {
      palette = { bg: hexRgb(bg), selected: hexRgb(selected), inspected: hexRgb(inspected) };
      repaint();
    },
    overview() { camera = { mode: 'overview', yaw: .38, pitch: .71, zoom: camera.zoom ?? 1 }; repaint(); },
    zoom(deltaFactor) {
      camera.zoom = Math.max(0.35, Math.min(2.4, (camera.zoom ?? 1) * deltaFactor));
      repaint();
    },
    inside(id) {
      moveInsideObject(seats.get(id) ?? objects.find(item => item.id === id));
    },
    look(dx, dy) {
      const inside = camera.mode === 'inside';
      camera.yaw -= dx * .008;
      camera.pitch = Math.max(inside ? -1.2 : .18, Math.min(inside ? 1.2 : 1.5, camera.pitch + dy * .008));
      repaint();
    },
    pick(clientX, clientY) {
      return pickAt(clientX, clientY, 'seat');
    },
    pickObject(clientX, clientY) {
      return pickAt(clientX, clientY, 'object');
    },
    close() {
      cancelAnimationFrame(pending); observer.disconnect();
      canvas.removeEventListener('webglcontextlost', onLost);
      gl.deleteFramebuffer(buffer); gl.deleteTexture(color); gl.deleteRenderbuffer(depth); dispose();
    }
  };
}
