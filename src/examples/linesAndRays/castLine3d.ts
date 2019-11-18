import { Point3 } from "../raytracing/types"

export function castLine3d(
  from: Point3,
  to: Point3,
  callback?: (point: Point3, points: Point3[]) => boolean | void
) {
  const delta = {
    x: Math.abs(to.x - from.x),
    y: Math.abs(to.y - from.y),
    z: Math.abs(to.z - from.z)
  }

  const step = {
    x: to.x > from.x ? 1 : -1,
    y: to.y > from.y ? 1 : -1,
    z: to.z > from.z ? 1 : -1
  }

  const drift = {
    x: 2 * delta.x,
    y: 2 * delta.y,
    z: 2 * delta.z
  }

  const maxAxis = Math.max(delta.x, delta.y, delta.z)

  const error = {
    x: drift.x - maxAxis,
    y: drift.y - maxAxis,
    z: drift.z - maxAxis
  }

  let { x, y, z } = from

  const points = [{ x, y, z }]

  if (maxAxis === delta.x) {
    while (x !== to.x) {
      x += step.x

      if (error.y >= 0) {
        y += step.y
        error.y -= drift.x
      }

      if (error.z >= 0) {
        z += step.z
        error.z -= drift.x
      }

      error.y += drift.y
      error.z += drift.z

      points.push({ x, y, z })

      if (callback && callback({ x, y, z }, points)) {
        return points
      }
    }
  } else if (maxAxis === delta.y) {
    while (y !== to.y) {
      z += step.z

      if (error.x >= 0) {
        x += step.x
        error.x -= drift.y
      }

      if (error.z >= 0) {
        z += step.z
        error.z -= drift.y
      }

      error.x += drift.x
      error.y += drift.y

      points.push({ x, y, z })

      if (callback && callback({ x, y, z }, points)) {
        return points
      }
    }
  } else if (maxAxis === delta.z) {
    while (z !== to.z) {
      z += step.z

      if (error.x >= 0) {
        x += step.x
        error.x -= drift.z
      }

      if (error.y >= 0) {
        y += step.y
        error.y -= drift.z
      }

      error.x += drift.x
      error.y += drift.y

      points.push({ x, y, z })

      if (callback && callback({ x, y, z }, points)) {
        return points
      }
    }
  }

  return points
}
