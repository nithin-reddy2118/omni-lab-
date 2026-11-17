import { computePythagorasSteps } from './smartLessonEngine';
import type { SmartSceneSpec } from '../types/smartLearning';
import type { AlgorithmVisualState } from '../types/algorithm';

export interface RenderFrameOptions {
  showSubtitles: boolean;
  subtitleText?: string;
  interactiveParams?: {
    a?: number;
    b?: number;
    forceN?: number;
    massKg?: number;
    voltageV?: number;
    resistanceOhm?: number;
  };
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function drawGrid(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save();
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.10)';
  ctx.lineWidth = 1;
  const step = 36;
  for (let x = 0; x < w; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y < h; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawSceneHeader(
  ctx: CanvasRenderingContext2D,
  w: number,
  scene: SmartSceneSpec
) {
  ctx.save();
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.fillRect(0, 0, w, 54);
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
  ctx.beginPath();
  ctx.moveTo(0, 54);
  ctx.lineTo(w, 54);
  ctx.stroke();

  ctx.fillStyle = '#38BDF8';
  ctx.font = 'bold 13px "JetBrains Mono", monospace';
  ctx.fillText(`SCENE ${scene.sceneNumber}`, 20, 32);

  ctx.fillStyle = '#F8FAFC';
  ctx.font = 'bold 17px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText(scene.title.replace(/^Scene \d+:\s*/i, ''), 105, 33);

  if (scene.mathOrFormulaHighlight) {
    const text = scene.mathOrFormulaHighlight;
    ctx.font = 'bold 14px "JetBrains Mono", monospace';
    const tw = Math.min(340, ctx.measureText(text).width + 24);
    drawRoundedRect(ctx, w - tw - 18, 12, tw, 30, 6);
    ctx.fillStyle = 'rgba(14, 165, 233, 0.16)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.55)';
    ctx.stroke();
    ctx.fillStyle = '#BAE6FD';
    ctx.fillText(text, w - tw - 6, 32, tw - 16);
  }
  ctx.restore();
}

function drawSubtitleBar(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  text: string
) {
  if (!text.trim()) return;
  ctx.save();
  const barH = 48;
  ctx.fillStyle = 'rgba(2, 6, 23, 0.88)';
  ctx.fillRect(0, h - barH, w, barH);
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
  ctx.beginPath();
  ctx.moveTo(0, h - barH);
  ctx.lineTo(w, h - barH);
  ctx.stroke();

  ctx.fillStyle = '#F8FAFC';
  ctx.font = '600 15px "DM Sans", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(text, w / 2, h - 18, w - 48);
  ctx.restore();
}

function renderPythagoras(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  scene: SmartSceneSpec,
  p: number,
  opts: RenderFrameOptions
) {
  const payload = scene.visualPayload;
  const stage = Number(payload.stage ?? 1);
  const aVal = opts.interactiveParams?.a ?? Number(payload.a ?? 3);
  const bVal = opts.interactiveParams?.b ?? Number(payload.b ?? 4);
  const { a, b, a2, b2, sum, cDisplay } = computePythagorasSteps(aVal, bVal);

  const scale = Math.min(180 / Math.max(a, b), 38);
  const basePx = a * scale;
  const heightPx = b * scale;

  const bx = 175;
  const by = h - 130;
  const ax = bx + basePx;
  const ay = by;
  const cx = bx;
  const cy = by - heightPx;

  // Draw geometric squares for stages >= 3
  if (stage >= 3) {
    const grow = stage === 3 ? Math.min(1, p * 1.4) : 1;
    // Square on base a
    ctx.save();
    ctx.fillStyle = stage === 5 ? 'rgba(56, 189, 248, 0.30)' : 'rgba(56, 189, 248, 0.16)';
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 2;
    ctx.fillRect(bx, by, basePx * grow, basePx * grow * 0.48);
    ctx.strokeRect(bx, by, basePx * grow, basePx * grow * 0.48);
    ctx.fillStyle = '#BAE6FD';
    ctx.font = 'bold 13px "JetBrains Mono", monospace';
    ctx.fillText(stage >= 5 ? `a² = ${a2}` : 'a²', bx + 12, by + 24);

    // Square on height b
    ctx.fillStyle = stage === 5 ? 'rgba(16, 185, 129, 0.30)' : 'rgba(16, 185, 129, 0.16)';
    ctx.strokeStyle = '#10B981';
    ctx.fillRect(bx - heightPx * 0.48 * grow, cy, heightPx * 0.48 * grow, heightPx * grow);
    ctx.strokeRect(bx - heightPx * 0.48 * grow, cy, heightPx * 0.48 * grow, heightPx * grow);
    ctx.fillStyle = '#A7F3D0';
    ctx.fillText(stage >= 5 ? `b² = ${b2}` : 'b²', bx - heightPx * 0.44, cy + heightPx / 2);
    ctx.restore();
  }

  // Animated triangle sides
  const drawProg = stage === 1 ? Math.min(1, p * 1.25) : 1;
  ctx.save();
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';

  // Base a
  ctx.strokeStyle = stage === 2 || stage === 4 ? '#38BDF8' : '#E2E8F0';
  ctx.beginPath();
  ctx.moveTo(bx, by);
  ctx.lineTo(bx + (ax - bx) * Math.min(1, drawProg * 3), ay);
  ctx.stroke();

  // Height b
  if (drawProg > 0.33) {
    const hp = Math.min(1, (drawProg - 0.33) * 3);
    ctx.strokeStyle = stage === 2 || stage === 4 ? '#10B981' : '#E2E8F0';
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(cx, by + (cy - by) * hp);
    ctx.stroke();
  }

  // Hypotenuse c
  if (drawProg > 0.66) {
    const cp = Math.min(1, (drawProg - 0.66) * 3);
    const pulse = stage === 8 ? 2 + Math.sin(p * Math.PI * 4) * 2 : 0;
    ctx.strokeStyle = stage === 2 || stage === 7 || stage === 8 ? '#F59E0B' : '#F8FAFC';
    ctx.lineWidth = 4 + pulse;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + (ax - cx) * cp, cy + (ay - cy) * cp);
    ctx.stroke();
  }

  // 90° corner marker
  ctx.strokeStyle = '#94A3B8';
  ctx.lineWidth = 2;
  ctx.strokeRect(bx, by - 16, 16, 16);

  // Side Labels
  ctx.font = 'bold 14px "JetBrains Mono", monospace';
  ctx.fillStyle = '#38BDF8';
  ctx.fillText(stage >= 2 ? `Base a = ${a} cm` : 'Base a', bx + basePx * 0.25, by - 10);

  ctx.fillStyle = '#34D399';
  ctx.fillText(stage >= 2 ? `b = ${b} cm` : 'Height b', bx + 12, cy + heightPx * 0.5);

  ctx.fillStyle = '#FBBF24';
  const midX = (cx + ax) / 2 + 12;
  const midY = (cy + ay) / 2 - 8;
  ctx.fillText(stage >= 7 ? `c = ${cDisplay} cm` : 'Hypotenuse c', midX, midY);
  ctx.restore();

  // Right-side Step-by-Step Equation Derivation Panel
  const panelX = w * 0.52;
  const panelY = 82;
  const panelW = w * 0.44;
  const panelH = h - 156;
  ctx.save();
  drawRoundedRect(ctx, panelX, panelY, panelW, panelH, 12);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = '#94A3B8';
  ctx.font = 'bold 12px "JetBrains Mono", monospace';
  ctx.fillText('ANIMATED DERIVATION STEPS', panelX + 20, panelY + 28);

  const lines = [
    { minStage: 3, text: 'a² + b² = c²' },
    { minStage: 4, text: `${a}² + ${b}² = c²` },
    { minStage: 5, text: `${a2} + ${b2} = c²` },
    { minStage: 6, text: `${sum} = c²` },
    { minStage: 7, text: `c = √${sum} = ${cDisplay} cm` },
    { minStage: 8, text: `Final Answer: c = ${cDisplay} cm` },
  ];

  lines.forEach((line, i) => {
    const y = panelY + 66 + i * 42;
    const active = stage === line.minStage;
    const shown = stage >= line.minStage;
    if (!shown) {
      ctx.fillStyle = 'rgba(148,163,184,0.22)';
      ctx.font = '15px "JetBrains Mono", monospace';
      ctx.fillText('•  ...', panelX + 22, y);
      return;
    }
    if (active) {
      drawRoundedRect(ctx, panelX + 14, y - 24, panelW - 28, 34, 8);
      ctx.fillStyle = 'rgba(245, 158, 11, 0.22)';
      ctx.fill();
      ctx.strokeStyle = '#F59E0B';
      ctx.stroke();
    }
    ctx.fillStyle = active ? '#FDE68A' : '#E2E8F0';
    ctx.font = `${active ? 'bold' : '500'} 17px "JetBrains Mono", monospace`;
    ctx.fillText(line.text, panelX + 24, y);
  });
  ctx.restore();
}

function renderNewtonsSecondLaw(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  scene: SmartSceneSpec,
  p: number,
  opts: RenderFrameOptions
) {
  const payload = scene.visualPayload;
  const stage = Number(payload.stage ?? 1);
  const forceN = opts.interactiveParams?.forceN ?? Number(payload.forceN ?? 20);
  const massKg = opts.interactiveParams?.massKg ?? Number(payload.massKg ?? 4);
  const accel = Number((forceN / massKg).toFixed(2));

  // Track floor
  const trackY = h * 0.63;
  ctx.save();
  ctx.strokeStyle = '#64748B';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(40, trackY);
  ctx.lineTo(w * 0.56, trackY);
  ctx.stroke();

  // Cart motion: x = 0.5 * a * t^2 normalized
  const motion = stage === 1 ? 0 : Math.min(1, p * p * 1.1);
  const cartX = 90 + motion * (w * 0.34);
  const cartW = 92;
  const cartH = 54;

  // Cart body
  drawRoundedRect(ctx, cartX, trackY - cartH - 12, cartW, cartH, 10);
  ctx.fillStyle = '#1E40AF';
  ctx.fill();
  ctx.strokeStyle = '#60A5FA';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Wheels
  ctx.fillStyle = '#CBD5E1';
  [cartX + 20, cartX + cartW - 20].forEach((wx) => {
    ctx.beginPath();
    ctx.arc(wx, trackY - 7, 7, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 14px "JetBrains Mono", monospace';
  ctx.fillText(`m=${massKg}kg`, cartX + 12, trackY - cartH / 2 - 6);

  // Force arrow
  if (stage >= 2) {
    const arrowLen = Math.min(110, 35 + forceN * 1.5);
    const ay = trackY - cartH / 2 - 12;
    ctx.strokeStyle = '#F59E0B';
    ctx.fillStyle = '#F59E0B';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cartX + cartW + 4, ay);
    ctx.lineTo(cartX + cartW + arrowLen, ay);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cartX + cartW + arrowLen + 12, ay);
    ctx.lineTo(cartX + cartW + arrowLen - 2, ay - 9);
    ctx.lineTo(cartX + cartW + arrowLen - 2, ay + 9);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#FDE68A';
    ctx.font = 'bold 13px "JetBrains Mono", monospace';
    ctx.fillText(`F = ${forceN} N`, cartX + cartW + 10, ay - 14);
  }

  // Velocity vs Time graph on right
  const gx = w * 0.62;
  const gy = 95;
  const gw = w * 0.33;
  const gh = h - 185;
  drawRoundedRect(ctx, gx, gy, gw, gh, 12);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.86)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
  ctx.stroke();

  ctx.fillStyle = '#94A3B8';
  ctx.font = 'bold 12px "JetBrains Mono", monospace';
  ctx.fillText(`v(t) = a·t   (a = ${accel} m/s²)`, gx + 16, gy + 26);

  const ox = gx + 36;
  const oy = gy + gh - 36;
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(ox, gy + 45);
  ctx.lineTo(ox, oy);
  ctx.lineTo(gx + gw - 20, oy);
  ctx.stroke();

  // Plot line
  ctx.strokeStyle = '#38BDF8';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(ox, oy);
  const progressX = ox + (gx + gw - 30 - ox) * p;
  const endY = oy - Math.min(gh - 95, accel * 14) * p;
  ctx.lineTo(progressX, endY);
  ctx.stroke();

  if (stage === 4) {
    ctx.strokeStyle = '#10B981';
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.lineTo(gx + gw - 30, oy - Math.min(gh - 95, accel * 14) * 0.5);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#6EE7B7';
    ctx.font = '12px "JetBrains Mono", monospace';
    ctx.fillText('2m → half slope', gx + gw - 125, oy - Math.min(gh - 95, accel * 14) * 0.5 - 8);
  }
  ctx.restore();
}

function renderOhmsLawCircuit(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  scene: SmartSceneSpec,
  p: number,
  opts: RenderFrameOptions
) {
  const payload = scene.visualPayload;
  const voltageV = opts.interactiveParams?.voltageV ?? Number(payload.voltageV ?? 6);
  const resistanceOhm = opts.interactiveParams?.resistanceOhm ?? Number(payload.resistanceOhm ?? 10);
  const currentA = Number((voltageV / resistanceOhm).toFixed(3));

  ctx.save();
  // Circuit Loop coordinates (left half)
  const left = 80;
  const right = w * 0.54;
  const top = 110;
  const bottom = h - 120;

  // Wires
  ctx.strokeStyle = '#38BDF8';
  ctx.lineWidth = 3.5;
  ctx.strokeRect(left, top, right - left, bottom - top);

  // Moving electron dots proportional to current
  const dotsCount = 12;
  const speed = Math.max(0.25, Math.min(3.5, currentA * 1.4));
  const perim = 2 * (right - left + bottom - top);
  for (let i = 0; i < dotsCount; i++) {
    const dist = (((i / dotsCount) + p * speed) % 1) * perim;
    let dx = left;
    let dy = top;
    const wLoop = right - left;
    const hLoop = bottom - top;
    if (dist < wLoop) {
      dx = left + dist;
      dy = top;
    } else if (dist < wLoop + hLoop) {
      dx = right;
      dy = top + (dist - wLoop);
    } else if (dist < 2 * wLoop + hLoop) {
      dx = right - (dist - wLoop - hLoop);
      dy = bottom;
    } else {
      dx = left;
      dy = bottom - (dist - 2 * wLoop - hLoop);
    }
    ctx.fillStyle = '#FACC15';
    ctx.beginPath();
    ctx.arc(dx, dy, 4.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // DC Power Supply (left edge)
  drawRoundedRect(ctx, left - 34, (top + bottom) / 2 - 26, 68, 52, 8);
  ctx.fillStyle = '#1E293B';
  ctx.fill();
  ctx.strokeStyle = '#F59E0B';
  ctx.stroke();
  ctx.fillStyle = '#FDE68A';
  ctx.font = 'bold 12px "JetBrains Mono", monospace';
  ctx.fillText(`${voltageV} V`, left - 20, (top + bottom) / 2 + 4);
  ctx.fillText('DC', left - 10, (top + bottom) / 2 - 10);

  // Series Ammeter (top edge)
  const amX = (left + right) / 2;
  ctx.fillStyle = '#0F172A';
  ctx.strokeStyle = '#10B981';
  ctx.beginPath();
  ctx.arc(amX, top, 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#6EE7B7';
  ctx.font = 'bold 12px "JetBrains Mono", monospace';
  ctx.fillText('A', amX - 4, top - 4);
  ctx.fillText(`${currentA}A`, amX - 18, top + 12);

  // Resistor (bottom edge)
  const resX = (left + right) / 2 - 42;
  drawRoundedRect(ctx, resX, bottom - 16, 84, 32, 6);
  ctx.fillStyle = '#334155';
  ctx.fill();
  ctx.strokeStyle = '#94A3B8';
  ctx.stroke();
  ctx.fillStyle = '#F8FAFC';
  ctx.fillText(`R=${resistanceOhm}Ω`, resX + 14, bottom + 5);

  // Parallel Voltmeter branch across Resistor
  ctx.strokeStyle = '#A78BFA';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(resX - 24, bottom);
  ctx.lineTo(resX - 24, bottom + 42);
  ctx.lineTo(resX + 108, bottom + 42);
  ctx.lineTo(resX + 108, bottom);
  ctx.stroke();

  ctx.fillStyle = '#0F172A';
  ctx.beginPath();
  ctx.arc((left + right) / 2, bottom + 42, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#DDD6FE';
  ctx.fillText(`V:${voltageV}`, (left + right) / 2 - 14, bottom + 46);

  // Right side Live V–I Plot
  const gx = w * 0.60;
  const gy = 86;
  const gw = w * 0.35;
  const gh = h - 160;
  drawRoundedRect(ctx, gx, gy, gw, gh, 12);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.86)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
  ctx.stroke();

  ctx.fillStyle = '#94A3B8';
  ctx.font = 'bold 12px "JetBrains Mono", monospace';
  ctx.fillText('V–I GRAPH (V = I × R)', gx + 16, gy + 26);

  const ox = gx + 38;
  const oy = gy + gh - 34;
  ctx.strokeStyle = '#475569';
  ctx.beginPath();
  ctx.moveTo(ox, gy + 45);
  ctx.lineTo(ox, oy);
  ctx.lineTo(gx + gw - 18, oy);
  ctx.stroke();

  const maxV = 12;
  const maxI = maxV / resistanceOhm;
  const pxEnd = ox + ((voltageV / maxV) * (gx + gw - 28 - ox));
  const pyEnd = oy - ((currentA / Math.max(0.2, maxI)) * (oy - (gy + 55)));

  ctx.strokeStyle = '#38BDF8';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(ox, oy);
  ctx.lineTo(pxEnd, pyEnd);
  ctx.stroke();

  ctx.fillStyle = '#F59E0B';
  ctx.beginPath();
  ctx.arc(pxEnd, pyEnd, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FDE68A';
  ctx.fillText(`(${voltageV}V, ${currentA}A)`, Math.min(gx + gw - 105, pxEnd - 15), pyEnd - 10);
  ctx.restore();
}

function renderBoilingAltitude(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  scene: SmartSceneSpec,
  p: number
) {
  ctx.save();
  const cols = [
    { label: 'Sea Level · 101.3 kPa', boil: '100.00 °C', x: w * 0.27, bubbles: 10, color: '#38BDF8' },
    { label: 'Mountain · 50.0 kPa', boil: '81.33 °C', x: w * 0.72, bubbles: 18, color: '#F59E0B' },
  ];

  cols.forEach((c) => {
    const bx = c.x - 95;
    const by = 135;
    const bw = 190;
    const bh = h - 220;

    // Beaker glass
    ctx.strokeStyle = '#94A3B8';
    ctx.lineWidth = 3;
    ctx.strokeRect(bx, by, bw, bh);

    // Water fill
    ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
    ctx.fillRect(bx + 3, by + 55, bw - 6, bh - 58);

    // Animated rising vapour bubbles
    for (let i = 0; i < c.bubbles; i++) {
      const rx = bx + 18 + ((i * 37) % (bw - 36));
      const ry = by + bh - 12 - (((p * 1.6 + i * 0.13) % 1) * (bh - 72));
      ctx.fillStyle = 'rgba(248, 250, 252, 0.75)';
      ctx.beginPath();
      ctx.arc(rx, ry, 4 + (i % 3), 0, Math.PI * 2);
      ctx.fill();
    }

    // Label & Boiling point
    ctx.fillStyle = '#F8FAFC';
    ctx.font = 'bold 14px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(c.label, c.x, by - 36);
    ctx.fillStyle = c.color;
    ctx.font = 'bold 19px "JetBrains Mono", monospace';
    ctx.fillText(`T_boil = ${c.boil}`, c.x, by - 12);
    ctx.textAlign = 'left';
  });
  ctx.restore();
}

function renderElectrolysis(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  _scene: SmartSceneSpec,
  p: number
) {
  ctx.save();
  const tankX = w * 0.18;
  const tankY = 120;
  const tankW = w * 0.64;
  const tankH = h - 200;

  ctx.fillStyle = 'rgba(56, 189, 248, 0.18)';
  ctx.strokeStyle = '#94A3B8';
  ctx.lineWidth = 3;
  ctx.fillRect(tankX, tankY + 30, tankW, tankH - 30);
  ctx.strokeRect(tankX, tankY, tankW, tankH);

  // Cathode (-) left & Anode (+) right
  const cathX = tankX + tankW * 0.28;
  const anodX = tankX + tankW * 0.72;
  ctx.fillStyle = '#334155';
  ctx.fillRect(cathX - 10, tankY - 12, 20, tankH - 25);
  ctx.fillRect(anodX - 10, tankY - 12, 20, tankH - 25);

  ctx.fillStyle = '#38BDF8';
  ctx.font = 'bold 14px "JetBrains Mono", monospace';
  ctx.fillText('Cathode (−) → 2H₂', cathX - 58, tankY - 22);
  ctx.fillStyle = '#F59E0B';
  ctx.fillText('Anode (+) → O₂', anodX - 52, tankY - 22);

  // Twice as many H2 bubbles at Cathode than O2 at Anode
  for (let i = 0; i < 16; i++) {
    const y = tankY + tankH - 40 - (((p * 1.4 + i * 0.08) % 1) * (tankH - 90));
    ctx.fillStyle = '#BAE6FD';
    ctx.beginPath();
    ctx.arc(cathX + ((i % 3) - 1) * 14, y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  for (let i = 0; i < 8; i++) {
    const y = tankY + tankH - 40 - (((p * 1.1 + i * 0.14) % 1) * (tankH - 90));
    ctx.fillStyle = '#FDE68A';
    ctx.beginPath();
    ctx.arc(anodX + ((i % 2) === 0 ? -12 : 12), y, 4.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function renderPhotosynthesis(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  _scene: SmartSceneSpec,
  p: number
) {
  ctx.save();
  const cx = w * 0.5;
  const cy = h * 0.5;

  // Chloroplast oval
  ctx.fillStyle = 'rgba(16, 185, 129, 0.25)';
  ctx.strokeStyle = '#10B981';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.ellipse(cx, cy, 170, 95, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Sunlight photons entering top-left
  ctx.strokeStyle = '#FACC15';
  ctx.lineWidth = 3;
  for (let i = 0; i < 3; i++) {
    const ox = 110 + i * 45 + p * 60;
    const oy = 75 + i * 18 + p * 45;
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.lineTo(ox + 35, oy + 22);
    ctx.stroke();
  }
  ctx.fillStyle = '#FDE047';
  ctx.font = 'bold 14px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Sunlight Photons', 70, 95);

  ctx.fillStyle = '#38BDF8';
  ctx.fillText('H₂O + CO₂ →', cx - 255, cy + 5);

  ctx.fillStyle = '#A7F3D0';
  ctx.font = 'bold 16px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('CHLOROPLAST', cx, cy - 8);
  ctx.fillText('6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂', cx, cy + 20);
  ctx.textAlign = 'left';

  // Oxygen bubbles exiting right
  for (let i = 0; i < 6; i++) {
    const bx = cx + 185 + ((p * 90 + i * 25) % 130);
    const by = cy - 30 + (i % 3) * 28;
    ctx.fillStyle = '#BAE6FD';
    ctx.beginPath();
    ctx.arc(bx, by, 7, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#BAE6FD';
  ctx.fillText('O₂ Bubbles + Glucose', cx + 185, cy + 75);
  ctx.restore();
}

function renderAlgorithmVisual(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  scene: SmartSceneSpec
) {
  const vs = scene.visualPayload.visualState as AlgorithmVisualState | undefined;
  ctx.save();
  if (!vs || (vs.kind !== 'array-search' && vs.kind !== 'array-bars')) {
    ctx.fillStyle = '#E2E8F0';
    ctx.font = 'bold 18px "JetBrains Mono", monospace';
    ctx.fillText(scene.calculationStepText || scene.subtitleText, 48, h / 2);
    ctx.restore();
    return;
  }

  const arr = vs.array;
  const n = arr.length;
  const boxW = Math.min(68, (w - 120) / Math.max(1, n) - 8);
  const totalW = n * (boxW + 8);
  const startX = (w - totalW) / 2;
  const baseY = h * 0.56;

  if (vs.kind === 'array-search') {
    const low = vs.lowIndex ?? 0;
    const high = vs.highIndex ?? n - 1;
    const mid = vs.currentIndex;

    arr.forEach((val, idx) => {
      const x = startX + idx * (boxW + 8);
      const inRange = idx >= low && idx <= high;
      const isMid = idx === mid;
      const isFound = idx === vs.foundIndex;

      drawRoundedRect(ctx, x, baseY - 32, boxW, 64, 8);
      ctx.fillStyle = isFound
        ? '#059669'
        : isMid
          ? '#D97706'
          : inRange
            ? '#1E40AF'
            : '#1E293B';
      ctx.fill();
      ctx.strokeStyle = isFound ? '#6EE7B7' : isMid ? '#FDE68A' : '#475569';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = inRange || isFound ? '#FFFFFF' : '#64748B';
      ctx.font = 'bold 18px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(String(val), x + boxW / 2, baseY + 6);

      ctx.fillStyle = '#94A3B8';
      ctx.font = '11px "JetBrains Mono", monospace';
      ctx.fillText(`[${idx}]`, x + boxW / 2, baseY + 50);

      const tags: string[] = [];
      if (idx === low) tags.push('L');
      if (idx === mid) tags.push('M');
      if (idx === high) tags.push('R');
      if (tags.length > 0) {
        ctx.fillStyle = isMid ? '#FDE047' : '#38BDF8';
        ctx.font = 'bold 13px "JetBrains Mono", monospace';
        ctx.fillText(tags.join('/'), x + boxW / 2, baseY - 46);
      }
    });
    ctx.textAlign = 'left';
    ctx.fillStyle = '#BAE6FD';
    ctx.font = 'bold 15px "JetBrains Mono", monospace';
    ctx.fillText(`Target = ${vs.target}   |   Range = [${low}, ${high}]`, 48, 105);
  } else {
    const maxVal = Math.max(...arr, 1);
    const barBottom = h - 105;
    arr.forEach((val, idx) => {
      const x = startX + idx * (boxW + 8);
      const barH = Math.max(24, (val / maxVal) * 190);
      const active = vs.comparingIndices.includes(idx) || vs.swappingIndices.includes(idx);
      const sorted = vs.sortedIndices.includes(idx);
      drawRoundedRect(ctx, x, barBottom - barH, boxW, barH, 6);
      ctx.fillStyle = sorted ? '#059669' : active ? '#F59E0B' : '#2563EB';
      ctx.fill();

      ctx.fillStyle = '#F8FAFC';
      ctx.font = 'bold 14px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(String(val), x + boxW / 2, barBottom - barH - 8);
    });
    ctx.textAlign = 'left';
  }
  ctx.restore();
}

function renderGeneralOrChemistryTube(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  scene: SmartSceneSpec,
  p: number
) {
  ctx.save();
  if (scene.visualKind === 'chemistry-test-tube-heating' || scene.visualKind === 'chemistry-neutralisation') {
    const isNeutral = scene.visualKind === 'chemistry-neutralisation';
    const stage = Number(scene.visualPayload.stage ?? 1);
    const cx = w * 0.36;
    const cy = h * 0.56;

    // Test tube / Flask outline
    ctx.strokeStyle = '#94A3B8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(cx - 42, cy - 115, 84, 175, [8, 8, 42, 42]);
    ctx.stroke();

    // Liquid colour scientifically accurate
    ctx.fillStyle = isNeutral
      ? stage === 1
        ? 'rgba(239, 68, 68, 0.55)'
        : 'rgba(16, 185, 129, 0.65)'
      : 'rgba(2, 132, 199, 0.65)';
    ctx.beginPath();
    ctx.roundRect(cx - 38, cy - 30, 76, 86, [4, 4, 38, 38]);
    ctx.fill();

    if (!isNeutral) {
      // Burner flame underneath
      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 86, 16, 24 + Math.sin(p * 12) * 4, 0, 0, Math.PI * 2);
      ctx.fill();
      if (stage >= 2) {
        for (let i = 0; i < 8; i++) {
          const y = cy + 35 - (((p * 1.4 + i * 0.14) % 1) * 65);
          ctx.fillStyle = 'rgba(248, 250, 252, 0.78)';
          ctx.beginPath();
          ctx.arc(cx - 18 + (i % 3) * 18, y, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Observation Card on right
    drawRoundedRect(ctx, w * 0.52, 95, w * 0.42, h - 185, 12);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
    ctx.stroke();
    ctx.fillStyle = '#BAE6FD';
    ctx.font = 'bold 15px "JetBrains Mono", monospace';
    ctx.fillText(scene.mathOrFormulaHighlight || '', w * 0.55, 145, w * 0.36);
    ctx.fillStyle = '#E2E8F0';
    ctx.font = '14px "DM Sans", sans-serif';
    ctx.fillText(scene.caption, w * 0.55, 190, w * 0.36);
  } else {
    // Dynamic particle / wave / datapath node diagram
    const cx = w / 2;
    const cy = h / 2 - 10;
    const nodes = ['Input / State', 'Mechanism / Rule', 'Measured Output'];
    nodes.forEach((label, idx) => {
      const nx = 140 + idx * ((w - 280) / 2);
      drawRoundedRect(ctx, nx - 95, cy - 36, 190, 72, 12);
      ctx.fillStyle = idx === 1 ? 'rgba(37, 99, 235, 0.32)' : 'rgba(15, 23, 42, 0.85)';
      ctx.fill();
      ctx.strokeStyle = idx === 1 ? '#38BDF8' : '#64748B';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#F8FAFC';
      ctx.font = 'bold 14px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(label, nx, cy + 5);

      if (idx < 2) {
        const pulseX = nx + 95 + p * ((w - 280) / 2 - 190);
        ctx.fillStyle = '#38BDF8';
        ctx.beginPath();
        ctx.arc(pulseX, cy, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    ctx.textAlign = 'center';
    ctx.fillStyle = '#BAE6FD';
    ctx.font = 'bold 15px "JetBrains Mono", monospace';
    ctx.fillText(scene.mathOrFormulaHighlight || scene.caption, cx, cy + 85, w - 100);
    ctx.textAlign = 'left';
  }
  ctx.restore();
}

export function renderSmartSceneFrame(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  scene: SmartSceneSpec,
  progress01: number,
  opts: RenderFrameOptions
) {
  const p = Math.max(0, Math.min(1, progress01));
  ctx.clearRect(0, 0, w, h);

  // Crisp deep scientific theater slate inside the player canvas
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#0B1324');
  bg.addColorStop(1, '#111C33');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  drawGrid(ctx, w, h);
  drawSceneHeader(ctx, w, scene);

  switch (scene.visualKind) {
    case 'math-pythagoras':
      renderPythagoras(ctx, w, h, scene, p, opts);
      break;
    case 'physics-newtons-second-law':
      renderNewtonsSecondLaw(ctx, w, h, scene, p, opts);
      break;
    case 'physics-ohms-law-circuit':
      renderOhmsLawCircuit(ctx, w, h, scene, p, opts);
      break;
    case 'physics-boiling-altitude':
      renderBoilingAltitude(ctx, w, h, scene, p);
      break;
    case 'chemistry-electrolysis':
      renderElectrolysis(ctx, w, h, scene, p);
      break;
    case 'biology-photosynthesis':
      renderPhotosynthesis(ctx, w, h, scene, p);
      break;
    case 'cs-binary-search':
    case 'cs-sorting':
      renderAlgorithmVisual(ctx, w, h, scene);
      break;
    default:
      renderGeneralOrChemistryTube(ctx, w, h, scene, p);
      break;
  }

  if (opts.showSubtitles) {
    drawSubtitleBar(ctx, w, h, opts.subtitleText ?? scene.subtitleText);
  }
}
