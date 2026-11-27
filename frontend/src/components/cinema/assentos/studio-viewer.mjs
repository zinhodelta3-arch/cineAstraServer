import { Mat, V, hexRgb, studioGraphics, studioParts } from './studio-geometry.mjs';
import { STUDIO_PLACE_TYPES } from './studio-builder.mjs';

const OVERVIEW_FOV = Math.PI / 4.2;
const LANDMARK_TYPES = new Set(['screen', 'stage', 'stage360', 'turf']);

function overviewFrame(objects) {
  const front = [Infinity, Infinity, Infinity];
  const back = [-Infinity, -Infinity, -Infinity];
  let hasPlaces = false;
  for (const object of objects) {
    if (STUDIO_PLACE_TYPES.has(object.type)) hasPlaces = true;
    else if (!LANDMARK_TYPES.has(object.type)) continue;
    for (const part of object.parts) {
      const [x, y, z] = part.scale;
      const cos = Math.abs(Math.cos(part.rot));
      const sin = Math.abs(Math.sin(part.rot));
      const extents = [cos * x + sin * z, y, sin * x + cos * z];
      for (let axis = 0; axis < 3; axis++) {
        front[axis] = Math.min(front[axis], part.pos[axis] - extents[axis] / 2);
        back[axis] = Math.max(back[axis], part.pos[axis] + extents[axis] / 2);
      }
    }
  }
  if (!hasPlaces) return null;
  const center = V.scale(V.add(front, back), .5);
  const corners = [];
  for (const x of [front[0], back[0]]) {
    for (const y of [front[1], back[1]]) {
      for (const z of [front[2], back[2]]) corners.push(V.sub([x, y, z], center));
    }
  }
  return { center, corners };
}

function fitDistance(corners, direction, aspect) {
  const right = V.norm(V.cross([0, 1, 0], direction));
  const up = V.cross(direction, right);
  const vertical = Math.tan(OVERVIEW_FOV / 2) * .87;
  return Math.max(...corners.map(point => V.dot(direction, point) + Math.max(
    Math.abs(V.dot(up, point)) / vertical,
    Math.abs(V.dot(right, point)) / (vertical * aspect),
  )));
}

function mixColor(base, accent, weight = 0.55) {
  const rgb = typeof base === 'string' ? hexRgb(base) : base;
  return [
    rgb[0] * (1 - weight) + accent[0] * weight,
    rgb[1] * (1 - weight) + accent[1] * weight,
    rgb[2] * (1 - weight) + accent[2] * weight,
  ];
}

export function openStudio(canvas, scene, onLost, { seatSelection = false } = {}) {
  const gl = canvas.getContext('webgl2', { alpha: false, antialias: true });
  if (!gl) throw new Error('WebGL indisponível.');
  const { program, loc, draw, dispose } = studioGraphics(gl);

  let currentScene = scene;
  let objects = [];
  let seats = new Map();
  let pickingSeats = new Map();
  let pickingObjects = new Map();
  let distance = 30;
  let center = [0, 2, 0];
  let frame = null;

  function loadSceneData(nextScene) {
    currentScene = nextScene;
    objects = nextScene.objects.map(object => ({ ...object, parts: studioParts(object, nextScene.environment) }));
    seats = new Map(objects.filter(object => object.seatId).map(object => [object.seatId, object]));
    pickingSeats = new Map(Array.from(seats.values(), object => [object.id, object.seatId]));
    pickingObjects = new Map(objects.map(object => [object.id, object.id]));
    distance = nextScene.sceneSize * (nextScene.environment === 'stadium' ? 1.92 : 1.59);
    center = [0, 2, 0];
    frame = seatSelection && nextScene.environment !== 'cinema' ? overviewFrame(objects) : null;
    if (frame) {
      center = frame.center;
      return;
    }
    const screen = nextScene.environment === 'stadium' && objects.find(object => object.type === 'screen');
    if (screen) {
      const rows = objects.filter(object => STUDIO_PLACE_TYPES.has(object.type));
      if (rows.length) {
        const rearRow = Math.max(...rows.map(object => object.z));
        center = [0, 2, (screen.z + rearRow) / 2];
      }
    }
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

  const overviewCamera = zoom => ({ mode: 'overview', yaw: .38, pitch: frame ? 1.05 : .71, zoom });
  let camera = overviewCamera(1);
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
    gl.renderbufferStorage(gl.RENDERBUFFER, frame ? gl.DEPTH_COMPONENT24 : gl.DEPTH_COMPONENT16, w, h);
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
    const aspect = width / height;
    const overviewDistance = !inside && frame
      ? fitDistance(frame.corners, direction, aspect)
      : distance * Math.max(1, .9 / aspect);
    const eye = inside ? position : V.add(center, V.scale(direction, overviewDistance * zoomFactor));
    const target = inside ? V.add(eye, direction) : center;
    gl.uniformMatrix4fv(loc.uView, false, Mat.lookAt(eye, target));
    gl.uniformMatrix4fv(loc.uProj, false, Mat.perspective(inside ? Math.PI / 2.8 : OVERVIEW_FOV, aspect, .12, 10000));
    gl.uniform3fv(loc.uCamera, eye);
    gl.uniform3fv(loc.uBackdrop, palette.bg);
    for (const object of objects) {
      // No mapa geral de compra, a estrutura não pode encobrir a área de clique dos lugares.
      if (frame && !inside && pickMode === 'seat' && !object.seatId) continue;
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
    overview() { camera = overviewCamera(camera.zoom ?? 1); repaint(); },
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
