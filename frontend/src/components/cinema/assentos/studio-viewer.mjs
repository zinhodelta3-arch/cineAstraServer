import { Mat, V, hexRgb, studioGraphics, studioParts } from './studio-geometry.mjs';

export function openStudio(canvas, scene, onLost) {
  const gl = canvas.getContext('webgl2', { alpha: false, antialias: true });
  if (!gl) throw new Error('WebGL indisponível.');
  const { program, loc, draw, dispose } = studioGraphics(gl);
  const objects = scene.objects.map(object => ({ ...object, parts: studioParts(object, scene.environment) }));
  const seats = new Map(objects.filter(object => object.seatId).map(object => [object.seatId, object]));
  const picking = new Map(Array.from(seats.values(), object => [object.id, object.seatId]));
  const buffer = gl.createFramebuffer(), color = gl.createTexture(), depth = gl.createRenderbuffer();
  gl.bindTexture(gl.TEXTURE_2D, color);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.bindFramebuffer(gl.FRAMEBUFFER, buffer);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, color, 0);
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depth);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  const center = [0, 2, 0];
  const distance = scene.sceneSize * (scene.environment === 'stadium' ? 1.92 : 1.59);
  let camera = { mode: 'overview', yaw: .38, pitch: .71 };
  let pending = 0, width = 0, height = 0;
  let marks = { selected: new Set(), unavailable: new Set(), inspectedId: '' };
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

  function render(pick = false) {
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
    const eye = inside ? position : V.add(center, V.scale(direction, distance * Math.max(1, .9 * height / width)));
    const target = inside ? V.add(eye, direction) : center;
    gl.uniformMatrix4fv(loc.uView, false, Mat.lookAt(eye, target));
    gl.uniformMatrix4fv(loc.uProj, false, Mat.perspective(inside ? Math.PI / 2.8 : Math.PI / 4.2, width / height, .12, 10000));
    gl.uniform3fv(loc.uCamera, eye);
    gl.uniform3fv(loc.uBackdrop, palette.bg);
    for (const object of objects) {
      const inspected = object.seatId && object.seatId === marks.inspectedId;
      const selected = object.seatId && marks.selected.has(object.seatId);
      const unavailable = object.seatId && marks.unavailable.has(object.seatId);
      const shade = selected ? palette.selected : unavailable ? [.39,.39,.39] : inspected ? palette.inspected : null;
      for (const part of object.parts) {
        draw(part.geo, part.pos, part.scale, shade ?? part.color, part.rot, object.seatId ? object.id : 0, pick ? 1 : part.alpha, pick);
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
  return {
    setSeats({ selected, unavailable, inspectedId }) {
      marks = { selected: new Set(selected), unavailable: new Set(unavailable), inspectedId };
      repaint();
    },
    setTheme(bg, selected, inspected) {
      palette = { bg: hexRgb(bg), selected: hexRgb(selected), inspected: hexRgb(inspected) };
      repaint();
    },
    overview() { camera = { mode: 'overview', yaw: .38, pitch: .71 }; repaint(); },
    inside(id) {
      const seat = seats.get(id);
      if (!seat) return;
      const yaw = seat.rotation;
      // Coordenadas locais da altura dos olhos e do centro da almofada no Studio.
      const stadiumSeat = scene.environment === 'stadium' && seat.type === 'seat' && seat.label?.startsWith('Setor ');
      const eyeHeight = seat.type === 'car' ? 2.45 : seat.type === 'bench' ? 2.65 : stadiumSeat ? 2.25 : 3.1;
      const offset = (seat.type === 'car' ? -.2 : seat.type === 'bench' ? .05 : .23) * seat.sz;
      camera = { mode: 'inside', yaw, pitch: 0, position: [
        seat.x + Math.sin(yaw) * offset,
        seat.y + eyeHeight * seat.sy,
        seat.z + Math.cos(yaw) * offset
      ] };
      repaint();
    },
    look(dx, dy) {
      const inside = camera.mode === 'inside';
      camera.yaw -= dx * .008;
      camera.pitch = Math.max(inside ? -1.2 : .18, Math.min(inside ? 1.2 : 1.5, camera.pitch + dy * .008));
      repaint();
    },
    pick(clientX, clientY) {
      render(true);
      const rect = canvas.getBoundingClientRect(), pixel = new Uint8Array(4);
      const x = Math.min(width-1, Math.max(0, Math.floor((clientX-rect.left)*width/rect.width)));
      const y = Math.min(height-1, Math.max(0, height-1-Math.floor((clientY-rect.top)*height/rect.height)));
      gl.readPixels(x,y,1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixel);
      gl.bindFramebuffer(gl.FRAMEBUFFER,null);
      return picking.get(pixel[0]+(pixel[1]<<8)+(pixel[2]<<16));
    },
    close() {
      cancelAnimationFrame(pending); observer.disconnect();
      canvas.removeEventListener('webglcontextlost', onLost);
      gl.deleteFramebuffer(buffer); gl.deleteTexture(color); gl.deleteRenderbuffer(depth); dispose();
    }
  };
}
