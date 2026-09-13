/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import type { ReactNode } from "react";

export interface InstrumentPoint { x: number; y: number }
export interface InstrumentSize { width: number; height: number }
export interface InstrumentRect extends InstrumentPoint, InstrumentSize { id: string }

const INSTRUMENT_GAP = 8;

export function instrumentRectsIntersect(a: InstrumentRect, b: InstrumentRect): boolean {
  return a.x < b.x + b.width + INSTRUMENT_GAP &&
    a.x + a.width + INSTRUMENT_GAP > b.x &&
    a.y < b.y + b.height + INSTRUMENT_GAP &&
    a.y + a.height + INSTRUMENT_GAP > b.y;
}

export function clampInstrumentPoint(
  point: InstrumentPoint,
  viewport: InstrumentSize,
  size: InstrumentSize,
): InstrumentPoint {
  return {
    x: Math.min(Math.max(0, point.x), Math.max(0, viewport.width - size.width)),
    y: Math.min(Math.max(0, point.y), Math.max(0, viewport.height - size.height)),
  };
}

function candidatePoints(
  preferred: InstrumentPoint,
  viewport: InstrumentSize,
  size: InstrumentSize,
  placed: readonly InstrumentRect[],
): InstrumentPoint[] {
  const xs = new Set([0, preferred.x, viewport.width - size.width]);
  const ys = new Set([0, preferred.y, viewport.height - size.height]);
  for (const rect of placed) {
    xs.add(rect.x - size.width - INSTRUMENT_GAP);
    xs.add(rect.x + rect.width + INSTRUMENT_GAP);
    ys.add(rect.y - size.height - INSTRUMENT_GAP);
    ys.add(rect.y + rect.height + INSTRUMENT_GAP);
  }
  const result: InstrumentPoint[] = [];
  for (const x of xs) for (const y of ys) {
    result.push(clampInstrumentPoint({ x, y }, viewport, size));
  }
  return result.sort((a, b) => {
    const ad = (a.x - preferred.x) ** 2 + (a.y - preferred.y) ** 2;
    const bd = (b.x - preferred.x) ** 2 + (b.y - preferred.y) ** 2;
    return ad - bd || a.y - b.y || a.x - b.x;
  });
}

export function resolveInstrumentLayout(
  instruments: readonly { id: string; preferred: InstrumentPoint; size: InstrumentSize }[],
  viewport: InstrumentSize,
  priorityId?: string,
): Readonly<Record<string, InstrumentPoint>> {
  const ordered = [...instruments].sort((a, b) =>
    (a.id === priorityId ? -1 : b.id === priorityId ? 1 : a.id.localeCompare(b.id)),
  );
  const placed: InstrumentRect[] = [];
  const result: Record<string, InstrumentPoint> = {};
  for (const item of ordered) {
    const candidates = candidatePoints(item.preferred, viewport, item.size, placed);
    const point = candidates.find(candidate => {
      const rect = { id: item.id, ...candidate, ...item.size };
      return placed.every(other => !instrumentRectsIntersect(rect, other));
    }) ?? candidates[0] ?? { x: 0, y: 0 };
    result[item.id] = point;
    placed.push({ id: item.id, ...point, ...item.size });
  }
  return result;
}

interface RegisteredInstrument {
  preferred: InstrumentPoint;
  size: InstrumentSize;
}

interface InstrumentLayerValue {
  position(id: string, fallback: InstrumentPoint): InstrumentPoint;
  register(id: string, preferred: InstrumentPoint, size: InstrumentSize): void;
  unregister(id: string): void;
  move(id: string, preferred: InstrumentPoint): void;
  settle(id: string): void;
  isForeground(id: string): boolean;
}

const InstrumentLayerContext = createContext<InstrumentLayerValue | null>(null);

export function useManifoldInstrumentLayer(): InstrumentLayerValue | null {
  return useContext(InstrumentLayerContext);
}

export default function ManifoldInstrumentLayer({
  children,
  viewport,
  projectionMode,
}: {
  children: ReactNode;
  viewport: InstrumentSize;
  projectionMode: "2D" | "3D";
}) {
  const [registry, setRegistry] = useState(() => new Map<string, RegisteredInstrument>());
  const [priorityId, setPriorityId] = useState<string>();

  const register = useCallback((id: string, preferred: InstrumentPoint, size: InstrumentSize) => {
    setRegistry(current => {
      const previous = current.get(id);
      if (previous && previous.preferred.x === preferred.x && previous.preferred.y === preferred.y &&
        previous.size.width === size.width && previous.size.height === size.height) return current;
      const next = new Map(current);
      next.set(id, { preferred, size });
      return next;
    });
    setPriorityId(id);
  }, []);
  const unregister = useCallback((id: string) => {
    setRegistry(current => {
      if (!current.has(id)) return current;
      const next = new Map(current);
      next.delete(id);
      return next;
    });
  }, []);
  const move = useCallback((id: string, preferred: InstrumentPoint) => {
    setRegistry(current => {
      const item = current.get(id);
      if (!item) return current;
      const next = new Map(current);
      next.set(id, { ...item, preferred });
      return next;
    });
    setPriorityId(id);
  }, []);
  const settle = useCallback((id: string) => {
    setPriorityId(id);
  }, []);

  const layout = useMemo(() => {
    // Projection changes are an explicit placement invalidation boundary even
    // when the physical viewport happens to retain the same dimensions.
    void projectionMode;
    return resolveInstrumentLayout(
      [...registry].map(([id, item]) => ({ id, ...item })),
      viewport,
      priorityId,
    );
  }, [registry, viewport, priorityId, projectionMode]);

  const value = useMemo<InstrumentLayerValue>(() => ({
    position: (id, fallback) => layout[id] ?? fallback,
    register,
    unregister,
    move,
    settle,
    isForeground: id => id === priorityId,
  }), [layout, register, unregister, move, settle, priorityId]);

  return <InstrumentLayerContext.Provider value={value}>{children}</InstrumentLayerContext.Provider>;
}
