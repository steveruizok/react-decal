import { Point2 } from "../raytracing/types"

export function castRay2d<T = any>(
  from: Point2,
  direction: Point2,
  hitTest: (info: {
    point: Point2
    distance: number
    position: Point2
    positions: Point2[]
  }) => T,
  maxDistance?: number,
  minDistance?: number
): {
  hit?: T
  point: Point2
  normal: Point2
  distance: number
  position: Point2
  positions: Point2[]
}

export function castRay2d<T = any>(
  from: Point2,
  direction: number,
  hitTest: (info: {
    point: Point2
    distance: number
    position: Point2
    positions: Point2[]
  }) => T,
  maxDistance?: number,
  minDistance?: number
): {
  hit?: T
  point: Point2
  normal: Point2
  distance: number
  position: Point2
  positions: Point2[]
}

export function castRay2d<T = any>(
  from: Point2,
  direction: Point2 | number,
  hitTest: (info: {
    point: Point2
    distance: number
    position: Point2
    positions: Point2[]
  }) => T,
  maxDistance = 10,
  minDistance = 1e-8
): {
  hit?: T
  point: Point2
  normal: Point2
  distance: number
  position: Point2
  positions: Point2[]
} {
  // Direction is an angle
  if (typeof direction === "number") {
    direction = {
      x: Math.cos((direction * Math.PI) / 180),
      y: Math.sin((direction * Math.PI) / 180)
    }
  }

  let stepLength = Math.hypot(direction.x, direction.y)

  if (stepLength < minDistance) {
    return {
      hit: undefined,
      point: { ...from },
      normal: { x: 0, y: 0 },
      position: { ...from },
      positions: [],
      distance: 0
    }
  }

  const position = {
    x: Math.floor(from.x) | 0,
    y: Math.floor(from.y) | 0
  }

  const delta = {
    x: direction.x / stepLength,
    y: direction.y / stepLength
  }

  const positionDelta = {
    x: delta.x > 0 ? 1 : -1,
    y: delta.y > 0 ? 1 : -1
  }

  const stepDelta = {
    x: Math.abs(1 / delta.x),
    y: Math.abs(1 / delta.y)
  }

  const stepped = {
    x: stepDelta.x < Infinity ? stepDelta.x : Infinity,
    y: stepDelta.y < Infinity ? stepDelta.y : Infinity
  }

  let hit: any
  let point: Point2 = { ...from }
  let normal: Point2 = { x: 0, y: 0 }
  let positions: Point2[] = [{ ...position }]

  let steppedDistance = 0.0
  let steppedIndex = -1
  let distance = 0

  function moveAlongXAxis() {
    position.x += positionDelta.x
    stepped.x += stepDelta.x
    steppedDistance = stepped.x
    steppedIndex = 0
  }

  function moveAlongYAxis() {
    position.y += positionDelta.y
    stepped.y += stepDelta.y
    steppedDistance = stepped.y
    steppedIndex = 1
  }

  while (steppedDistance <= maxDistance) {
    distance++

    stepped.x < stepped.y ? moveAlongXAxis() : moveAlongYAxis()

    positions.push({ ...position })

    point.x = from.x + steppedDistance * delta.x
    point.y = from.y + steppedDistance * delta.y

    normal.x = steppedIndex === 0 ? -positionDelta.x : 0
    normal.y = steppedIndex === 1 ? -positionDelta.y : 0

    hit = hitTest({
      point,
      distance,
      position,
      positions
    })

    if (hit !== undefined) {
      return {
        hit,
        point,
        normal,
        position,
        positions,
        distance
      }
    }
  }

  return {
    hit,
    point,
    normal,
    position,
    positions,
    distance
  }
}
