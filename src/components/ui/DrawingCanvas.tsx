import React, { useEffect, useRef, useState } from 'react';
import { Eraser, Pen, RotateCcw } from 'lucide-react';

interface DrawingCanvasProps {
  value?: string;
  onChange: (dataUrl: string) => void;
}

export function DrawingCanvas({ value, onChange }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [color, setColor] = useState('#1D4ED8');
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle engineering graph grid
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.22)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= canvas.width; x += 24) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= canvas.height; y += 24) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    if (value) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
      };
      img.src = value;
    }
  }, []);

  const getCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.setPointerCapture(e.pointerId);
    const { x, y } = getCoords(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = tool === 'eraser' ? 14 : 3;
    ctx.strokeStyle = tool === 'eraser' ? '#FFFFFF' : color;
    setDrawing(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCoords(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handlePointerUp = () => {
    if (!drawing) return;
    setDrawing(false);
    if (canvasRef.current) {
      onChange(canvasRef.current.toDataURL('image/png'));
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.22)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= canvas.width; x += 24) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= canvas.height; y += 24) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    onChange('');
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTool('pen')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 border ${
              tool === 'pen'
                ? 'bg-blue-50 border-blue-600 text-blue-700'
                : 'border-slate-300 text-slate-600 hover:text-slate-900 bg-white'
            }`}
          >
            <Pen className="w-3.5 h-3.5" />
            Draw
          </button>
          <button
            type="button"
            onClick={() => setTool('eraser')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 border ${
              tool === 'eraser'
                ? 'bg-blue-50 border-blue-600 text-blue-700'
                : 'border-slate-300 text-slate-600 hover:text-slate-900 bg-white'
            }`}
          >
            <Eraser className="w-3.5 h-3.5" />
            Erase
          </button>
          <div className="flex items-center gap-1.5 ml-2">
            {['#1D4ED8', '#0D9488', '#059669', '#D97706', '#0F172A'].map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`Select color ${c}`}
                onClick={() => {
                  setColor(c);
                  setTool('pen');
                }}
                className={`w-6 h-6 rounded-full border-2 ${
                  color === c && tool === 'pen' ? 'border-slate-900 scale-110' : 'border-slate-200'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={clearCanvas}
          className="px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 border border-slate-300 text-slate-700 hover:bg-slate-100 bg-white"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Clear Sketch
        </button>
      </div>
      <canvas
        ref={canvasRef}
        width={640}
        height={300}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="w-full h-auto rounded-xl border border-slate-300 cursor-crosshair touch-none bg-white"
      />
    </div>
  );
}
