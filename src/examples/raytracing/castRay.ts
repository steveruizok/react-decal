import { Point2, Point3 } from "./types"

function swap(collection: Record<string, number>, a: string, b: string) {
  let t = collection[a]
  collection[a] = collection[b]
  collection[b] = t
  return collection
}

function deltaIsGreater(a: number[], b: number[]) {
  return Math.abs(a[0] - a[1]) > Math.abs(b[0] - b[1])
}

export function castRay<T = any>(
  pointA: Point3,
  pointB: Point3,
  memo: T,
  onHit: (point: Point3, memo: T) => boolean | void,
  onEnd?: (point: Point3, memo: T, complete: boolean) => void
) {
  // Safty first kids...
  const pts = {
    x0: Math.round(pointA.x),
    y0: Math.round(pointA.y),
    z0: Math.round(pointA.z),
    x1: Math.round(pointB.x),
    y1: Math.round(pointB.y),
    z1: Math.round(pointB.z)
  }

  const swaps = {
    xy: false,
    xz: false
  }

  // We'll want our x plane to be the longest plane, so we'll
  // swap the other planes in order to make it so. Later, we'll
  // "undo" our swaps to get our actual points.

  swaps.xy = deltaIsGreater([pts.y0, pts.y1], [pts.x0, pts.x1])

  if (swaps.xy) {
    swap(pts, "x0", "y0")
    swap(pts, "x1", "y1")
  }

  swaps.xz = deltaIsGreater([pts.z0, pts.z1], [pts.x0, pts.x1])

  if (swaps.xz) {
    swap(pts, "x0", "z0")
    swap(pts, "z1", "z1")
  }

  // Delta is Length in each plane
  const delta = {
    x: Math.abs(pts.x1 - pts.x0),
    y: Math.abs(pts.y1 - pts.y0),
    z: Math.abs(pts.z1 - pts.z0)
  }

  // Drift controls when to step in 'shallow' planes.
  // The offset starting value keeps ray centred
  const drift = {
    xy: delta.x / 2,
    xz: delta.x / 2
  }

  // Direction / length of ray steps
  const step = {
    x: pts.x0 > pts.x1 ? -1 : 1,
    y: pts.y0 > pts.y1 ? -1 : 1,
    z: pts.z0 > pts.z1 ? -1 : 1
  }

  // Current / starting point
  const current = {
    x: pts.x0,
    y: pts.y0,
    z: pts.z0
  }

  // Step through longest delta (which we have swapped to x)
  // until we reach the end (or until we're interrupted)
  for (var x = pts.x0; x !== pts.x1; x += step.x) {
    // Update current
    current.x = x

    // Copy current point
    const pt = { ...current }

    // Unswap axes (in reverse)
    if (swaps.xz) swap(pt, "x", "z")
    if (swaps.xy) swap(pt, "x", "y")

    // passes through this point
    const stopEarly = onHit(pt, memo)

    if (stopEarly) {
      return { point: pt, memo, complete: false }
    }

    // Drift / step in y plane
    drift.xy -= delta.y

    if (drift.xy < 0) {
      current.y += step.y
      drift.xy += delta.x
    }

    // Drift / step in z plane
    drift.xz -= delta.z

    if (drift.xz < 0) {
      current.z += step.z
      drift.xz += delta.x
    }
  }

  const endPoint = { ...current, x: current.x + step.x }

  if (onEnd) {
    onEnd(endPoint, memo, true)
  }

  return {
    point: endPoint,
    memo,
    complete: true
  }
}

export function useRaycaster() {
  return castRay
}
