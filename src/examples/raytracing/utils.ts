import { Point2, Point3 } from "./types"

export const transform = (
  value: number,
  rangeA: number[],
  rangeB: number[],
  clamp = true
) => {
  const [a0, a1] = rangeA
  const [b0, b1] = rangeB

  const r = b0 + ((value - a0) / (a1 - a0)) * (b1 - b0)

  if (clamp) {
    return Math.max(b0, Math.min(b1, r))
  } else {
    return r
  }
}

export function createPoint(x: number, y: number, z = 0) {
  return { x: x, y: y, z: z }
}

export function pointsAreEqual(pointA: Point3, pointB: Point3) {
  return pointA.x === pointB.x && pointA.y === pointB.y
}

export function addPoints2(p1: Point2, p2: Point2) {
  return {
    x: p1.x + p2.x,
    y: p1.y + p2.y
  }
}

export function addPoints3(p1: Point3, p2: Point3) {
  return {
    x: p1.x + p2.x,
    y: p1.y + p2.y,
    z: p1.z + p2.z
  }
}

export function subtractPoints(point1: Point3, point2: Point3) {
  return {
    x: point1.x - point2.x,
    y: point1.y - point2.y,
    z: point1.z - point2.z
  }
}

export function multiplyPoints(point1: Point3, point2: Point3) {
  return {
    x: point1.x * point2.x,
    y: point1.y * point2.y,
    z: (point1.z || 0) * (point2.z || 0)
  }
}

export function dotPoints(point1: Point3, point2: Point3) {
  return (
    point1.x * point2.x +
    point1.y * point2.y +
    (point1.z || 0) * (point2.z || 0)
  )
}

export function rotateYPoint(point: Point3, ang: number) {
  var cos = Math.cos(ang)
  var sin = Math.sin(ang)
  return createPoint(
    sin * (point.z || 0) + cos * point.x,
    point.y,
    cos * (point.z || 0) - sin * point.x
  )
}

export function rotateXPoint(point: Point3, ang: number) {
  var cos = Math.cos(ang)
  var sin = Math.sin(ang)
  return createPoint(
    point.x,
    cos * point.y - sin * (point.z || 0),
    sin * point.y + cos * (point.z || 0)
  )
}

export function rotateZPoint(point: Point3, ang: number) {
  var cos = Math.cos(ang)
  var sin = Math.sin(ang)
  return createPoint(
    cos * point.x - sin * point.y,
    sin * point.x + cos * point.y,
    point.z || 0
  )
}

export function dupPoint(point: Point3) {
  return createPoint(point.x, point.y, point.z || 0)
}
