import { Point3 } from "../raytracing/types"

export function castRay2d(
  from: Point3,
  delta: Point3,
  callback: (info: {
    point: Point3
    distance: number
    position: Point3
    positions: Point3[]
  }) => any,
  distance = 10,
  epsilon = 1e-8
) {
  let { x: px, y: py, z: pz } = from
  let { x: dx, y: dy, z: dz } = delta

  let stepDistance = Math.hypot(dx, dy, dz)

  if (stepDistance < epsilon) {
    return {
      hit: undefined,
      distance: 0,
      point: { ...from },
      position: { ...from },
      positions: [],
      normal: { x: 0, y: 0, z: 0 }
    }
  }

  dx /= stepDistance
  dy /= stepDistance
  dz /= stepDistance

  const pos = {
    x: Math.floor(px) | 0,
    y: Math.floor(py) | 0,
    z: Math.floor(pz) | 0
  }

  const step = {
    x: dx > 0 ? 1 : -1,
    y: dy > 0 ? 1 : -1,
    z: dz > 0 ? 1 : -1
  }

  const tDelta = {
    x: Math.abs(1 / dx),
    y: Math.abs(1 / dy),
    z: Math.abs(1 / dz)
  }

  const tDist = {
    x: step.x > 0 ? pos.x + 1 - px : px - pos.x,
    y: step.y > 0 ? pos.y + 1 - py : py - pos.y,
    z: step.z > 0 ? pos.z + 1 - pz : pz - pos.z
  }

  const tMax = {
    x: tDelta.x < Infinity ? tDelta.x * tDist.x : Infinity,
    y: tDelta.y < Infinity ? tDelta.y * tDist.y : Infinity,
    z: tDelta.z < Infinity ? tDelta.z * tDist.z : Infinity
  }

  let t = 0.0
  let steppedIndex = -1
  let dist = 0
  let point: Point3 = { ...from }
  let position: Point3 = { ...from }
  let positions: Point3[] = [{ ...pos }]

  while (t <= distance) {
    dist++

    // advance t to next nearest voxel boundary
    if (tMax.x < tMax.y) {
      if (tMax.x < tMax.z) {
        pos.x += step.x
        t = tMax.x
        tMax.x += tDelta.x
        steppedIndex = 0
      } else {
        pos.z += step.z
        t = tMax.z
        tMax.z += tDelta.z
        steppedIndex = 2
      }
    } else {
      if (tMax.y < tMax.z) {
        pos.y += step.y
        t = tMax.y
        tMax.y += tDelta.y
        steppedIndex = 1
      } else {
        pos.z += step.z
        t = tMax.z
        tMax.z += tDelta.z
        steppedIndex = 2
      }
    }

    positions.push({ ...pos })
    point = { x: px + t * dx, y: py + t * dy, z: pz + t * dz }

    var hit = callback({
      point,
      distance: dist,
      position: pos,
      positions
    })

    if (hit !== undefined) {
      const normal = {
        x: steppedIndex === 0 ? -step.x : 0,
        y: steppedIndex === 1 ? -step.y : 0,
        z: steppedIndex === 2 ? -step.z : 0
      }

      return {
        hit,
        distance,
        point,
        position,
        positions,
        normal
      }
    }
  }

  return {
    hit: undefined,
    distance,
    point,
    position: pos,
    positions,
    normal: { x: 0, y: 0, z: 0 }
  }
}
