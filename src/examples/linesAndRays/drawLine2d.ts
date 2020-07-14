import { Point2 } from "../raytracing/types"

export function drawEdge2d(from: Point2, to: Point2) {
  const delta = {
    x: Math.abs(to.x - from.x),
    y: Math.abs(to.y - from.y)
  }

  const step = {
    x: to.x > from.x ? 1 : -1,
    y: to.y > from.y ? 1 : -1
  }

  const drift = {
    x: 2 * delta.x,
    y: 2 * delta.y
  }

  const error = {
    x: drift.x - delta.y,
    y: drift.y - delta.x
  }

  let { x, y } = from

  const points = [{ x, y }]

  if (delta.x >= delta.y) {
    while (x !== to.x) {
      x += step.x

      if (error.y >= 0) {
        y += step.y
        error.y -= drift.x
      }

      error.y += drift.y

      points.push({ x, y })
    }
  } else {
    while (y !== to.y) {
      y += step.y

      if (error.x >= 0) {
        x += step.x
        error.x -= drift.y
      }

      error.x += drift.x

      points.push({ x, y })
    }
  }

  return points
}
