// Translations

export function lerp(x: number, y: number, a: number) {
  return x * (1 - a) + y * a
}
export function clamp(a: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, a))
}
export function invlerp(x: number, y: number, a: number) {
  return clamp((a - x) / (y - x))
}
export function transform(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  a: number
) {
  return lerp(x2, y2, invlerp(x1, y1, a))
}

export function rotatePoint(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  angle: number
) {
  const s = Math.sin(angle)
  const c = Math.cos(angle)

  const px = x2 - x1
  const py = y2 - y1

  const nx = px * c - py * s
  const ny = px * s + py * c

  return [nx + x1, ny + y1]
}

export function degreesToRadians(degrees: number) {
  return (degrees * Math.PI) / 180
}

export function radiansToDegrees(radians: number) {
  return (radians * 180) / Math.PI
}

// Path2D

export function pointsToPath(...points: { x: number; y: number }[]) {
  const [start, ...rest] = points
  return new Path2D(
    `M${start.x},${start.y}` + rest.map(p => `L${p.x},${p.y}`).join(" ")
  )
}

export function pointsToPolygon(...points: { x: number; y: number }[]) {
  const path = pointsToPath(...points)
  path.closePath()

  return path
}

export function pointToCircle(point: Vec2d, radius: number = 4) {
  const path = new Path2D()
  path.moveTo(point.x + radius, point.y)
  path.ellipse(point.x, point.y, radius, radius, 0, 0, Math.PI * 2)
  return path
}

function ccw(A: number[], B: number[], C: number[]) {
  return (C[1] - A[1]) * (B[0] - A[0]) > (B[1] - A[1]) * (C[0] - A[0])
}

export function intersect(A: number[], B: number[], C: number[], D: number[]) {
  return ccw(A, C, D) !== ccw(B, C, D) && ccw(A, B, C) !== ccw(A, B, D)
}

// Vector 2D

export class Vec2d {
  x: number = 0
  y: number = 0

  constructor(x: number, y: number) {
    this.x = x
    this.y = y
  }

  set(x: number, y: number) {
    this.x = x
    this.y = y
  }

  snapTo(v: Vec2d) {
    this.x = v.x
    this.y = v.y
  }

  // gets angle between point and another point
  angleTo(v: Vec2d): number {
    return Math.atan2(v.y - this.y, v.x - this.x)
  }

  interpolate(v: Vec2d, f: number) {
    return new Vec2d(this.x * (1 - f) + v.x * f, this.y * (1 - f) + v.y * f)
  }

  // moves the point in a direction by a certain length
  push(length: number, angle: number) {
    this.x += length * Math.cos(angle)
    this.y += length * Math.sin(angle)
  }

  add(v: Vec2d): Vec2d {
    return new Vec2d(this.x + v.x, this.y + v.y)
  }

  equals(v: Vec2d) {
    return this.x === v.x && this.y === v.y
  }

  copy(): Vec2d {
    return new Vec2d(this.x, this.y)
  }

  distance(v: Vec2d) {
    return v.subtract(this).norm()
  }

  mult(scalar: number) {
    return new Vec2d(this.x * scalar, this.y * scalar)
  }

  // The length of a hypotenuse between 0,0 and x,y
  length() {
    return Math.sqrt(this.x * this.x + this.y * this.y)
  }

  // The slope of a line between 0,0 and x,y
  norm() {
    const length = this.length()

    return new Vec2d(this.x / length, this.y / length)
  }

  dot(v: Vec2d) {
    return this.x * v.x + this.y * v.y
  }

  normalize() {
    let length = this.length()

    return new Vec2d(this.x / length, this.y / length)
  }

  subtract(v: Vec2d) {
    return new Vec2d(this.x - v.x, this.y - v.y)
  }

  scalarMult(a: number) {
    return new Vec2d(this.x * a, this.y * a)
  }

  toArray() {
    return [this.x, this.y]
  }

  toString() {
    return "(" + this.x + ", " + this.y + ")"
  }

  angleBetween(b: Vec2d) {
    return Math.acos((this.dot(b) / this.length()) * b.length())
  }

  distanceTo(b: Vec2d) {
    return Math.hypot(this.x - b.x, this.y - b.y)
  }

  edgeTo(b: Vec2d) {
    return new Edge2d(this, b)
  }
}

export function flattenVectors(...points: Vec2d[]) {
  return points.map(p => p.toArray())
}

function vecCCW(A: Vec2d, B: Vec2d, C: Vec2d) {
  return (C.y - A.y) * (B.x - A.x) > (B.y - A.y) * (C.x - A.x)
}

// Edge

export class Edge2d {
  start: Vec2d
  end: Vec2d

  constructor(start: Vec2d, end: Vec2d) {
    this.start = start.copy()
    this.end = end.copy()
  }

  get path() {
    return pointsToPath(this.start, this.end)
  }

  get midPoint() {
    return new Vec2d(
      (this.start.x + this.end.x) / 2,
      (this.start.y + this.end.y) / 2
    )
  }

  get radians() {
    return Math.atan2(this.end.y - this.start.y, this.end.x - this.start.x)
  }

  get angle() {
    return (
      (Math.atan2(this.end.y - this.start.y, this.end.x - this.start.x) * 180) /
      Math.PI
    )
  }

  get distance() {
    return Math.hypot(this.end.x - this.start.x, this.end.y - this.start.y)
  }

  get length() {
    return Math.abs(this.end.length() - this.start.length())
  }

  get offset() {
    return new Vec2d(this.end.x - this.start.x, this.end.y - this.start.y)
  }

  get normal() {
    return this.offset.normalize()
  }

  /* --------------------- Public --------------------- */

  copy() {
    return new Edge2d(this.start.copy(), this.end.copy())
  }

  flipHorizontal() {
    const { x: x1 } = this.start
    const { x: x2 } = this.end

    this.start.x = x2
    this.end.x = x1
    return this
  }

  flipVertical() {
    const { x: x1, y: y1 } = this.start
    const { x: x2, y: y2 } = this.end

    this.start.y = y2
    this.end.y = y1
    return this
  }

  rotate(angle: number, point = 0.5) {
    const radians = (Math.PI / 180) * angle
    const { x: x1, y: y1 } = this.start
    const { x: x2, y: y2 } = this.end
    const { x: mx, y: my } = this.getPoint(point)

    const [sx, sy] = rotatePoint(mx, my, x1, y1, radians)
    const [ex, ey] = rotatePoint(mx, my, x2, y2, radians)

    this.start.set(sx, sy)
    this.end.set(ex, ey)

    return this
  }

  scale(n: number) {
    const { offset } = this
    let ox = offset.x / 2
    let oy = offset.y / 2

    const { x, y } = this.midPoint

    this.start.set(x - ox * n, y - oy * n)
    this.end.set(x + ox * n, y + oy * n)
    return this
  }

  flip() {
    const { x: x1, y: y1 } = this.start
    const { x: x2, y: y2 } = this.end

    this.start.x = x2
    this.end.x = x1
    this.start.y = y2
    this.end.y = y1
    return this
  }

  getPoint(distance: number) {
    const dx = this.end.x - this.start.x
    const dy = this.end.y - this.start.y
    return new Vec2d(this.start.x + dx * distance, this.start.y + dy * distance)
  }

  set(start: Vec2d, end: Vec2d) {
    this.start.set(start.x, start.y)
    this.end.set(end.x, end.y)
  }

  intersects(b: Edge2d) {
    return (
      vecCCW(this.start, b.start, b.end) !== vecCCW(this.end, b.start, b.end) &&
      vecCCW(this.start, this.end, b.start) !==
        vecCCW(this.start, this.end, b.end)
    )
  }

  intersect(b: Edge2d) {
    const { x: x1, y: y1 } = this.start
    const { x: x2, y: y2 } = this.end
    const { x: x3, y: y3 } = b.start
    const { x: x4, y: y4 } = b.end

    const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1)
    const numeA = (x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)
    const numeB = (x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)

    if (denom == 0) {
      if (numeA == 0 && numeB == 0) {
        return undefined // Colinear
      }
      return undefined // Parallel;
    }

    const uA = numeA / denom
    const uB = numeB / denom

    if (uA >= 0 && uA <= 1 && uB >= 0 && uB <= 1) {
      return new Vec2d(x1 + uA * (x2 - x1), y1 + uA * (y2 - y1))
    }

    return undefined // No intersection
  }

  // split(a: Vec2d) {
  //   console.log(this.start.norm, this.end.norm, a.norm)
  // }
}

// Box

export type BoxCorner = "topRight" | "bottomRight" | "bottomLeft" | "topLeft"
export type BoxEdge = "top" | "left" | "right" | "bottom"

export class Box2d {
  readonly point: Vec2d
  readonly center: Vec2d
  readonly size: Vec2d

  readonly corners: Record<BoxCorner, Vec2d>
  readonly edges: Record<BoxEdge, Edge2d>

  path: Path2D

  constructor(x: number, y: number, width: number, height: number) {
    this.point = new Vec2d(x, y)
    this.size = new Vec2d(width, height)

    this.center = new Vec2d(x + width / 2, y + height / 2)

    this.corners = {
      topRight: new Vec2d(this.maxX, this.y),
      bottomRight: new Vec2d(this.maxX, this.maxY),
      bottomLeft: new Vec2d(this.x, this.maxY),
      topLeft: new Vec2d(this.x, this.y)
    }

    this.edges = {
      top: new Edge2d(this.corners.topLeft, this.corners.topRight),
      right: new Edge2d(this.corners.topRight, this.corners.bottomRight),
      bottom: new Edge2d(this.corners.bottomRight, this.corners.bottomLeft),
      left: new Edge2d(this.corners.bottomLeft, this.corners.topLeft)
    }

    this.path = pointsToPolygon(
      this.corners.topRight,
      this.corners.bottomRight,
      this.corners.bottomLeft,
      this.corners.topLeft
    )
  }

  protected update() {}

  private updateCore() {
    this.center.set(this.x + this.width / 2, this.y + this.height / 2)

    this.corners.topRight.set(this.maxX, this.y)
    this.corners.bottomRight.set(this.maxX, this.maxY)
    this.corners.bottomLeft.set(this.x, this.maxY)
    this.corners.topLeft.set(this.x, this.y)

    this.edges.top.set(this.corners.topLeft, this.corners.topRight)
    this.edges.right.set(this.corners.topRight, this.corners.bottomRight)
    this.edges.bottom.set(this.corners.bottomRight, this.corners.bottomLeft)
    this.edges.left.set(this.corners.bottomLeft, this.corners.topLeft)

    this.path = pointsToPolygon(
      this.corners.topRight,
      this.corners.bottomRight,
      this.corners.bottomLeft,
      this.corners.topLeft
    )

    this.update()
  }

  // Getters

  get width() {
    return this.size.x
  }

  get height() {
    return this.size.y
  }

  get x() {
    return this.point.x
  }

  get minX() {
    return this.point.x
  }

  get maxX() {
    return this.x + this.width
  }
  get midX() {
    return this.x + this.width / 2
  }

  get y() {
    return this.point.y
  }

  get minY() {
    return this.point.y
  }

  get maxY() {
    return this.y + this.height
  }

  get midY() {
    return this.y + this.height / 2
  }

  // Setters

  set x(n: number) {
    this.point.x = n
    this.updateCore()
  }

  set y(n: number) {
    this.point.y = n
    this.updateCore()
  }

  set width(n: number) {
    this.size.x = n
    this.updateCore()
  }

  set height(n: number) {
    this.size.y = n
    this.updateCore()
  }

  /* --------------------- Public --------------------- */

  getOffset(offset: number) {
    return new Frame2d(
      this.x - offset,
      this.y - offset,
      this.width + offset * 2,
      this.height + offset * 2
    )
  }

  offset(v: Vec2d): void
  offset(x: number, y: number): void
  offset(x: number | Vec2d, y?: number): void {
    if (typeof x === "number" && typeof y === "number") {
      this.x += x as number
      this.y += y as number
    } else {
      this.point.add(x as Vec2d)
    }
  }

  containsVec(b: Vec2d) {
    return !(
      b.x <= this.x ||
      b.y <= this.y ||
      b.x >= this.maxX ||
      b.y >= this.maxY
    )
  }

  contains(b: Box2d) {
    return !(
      b.x < this.x ||
      b.y < this.y ||
      b.maxX > this.maxX ||
      b.maxY > this.maxY
    )
  }

  distanceTo(b: Box2d) {
    return Math.hypot(this.midX - b.midX, this.midY - b.midY)
  }

  touches(b: Box2d) {
    // has horizontal gap
    if (this.x > b.maxX || b.x > this.maxX) return false

    // has vertical gap
    if (this.y > b.maxY || b.y > this.maxY) return false

    return true
  }

  overlaps(b: Box2d) {
    // no horizontal overlap
    if (this.x >= b.maxX || b.x >= this.maxX) return false

    // no vertical overlap
    if (this.y >= b.maxY || b.y >= this.maxY) return false

    return true
  }

  relationTo(b: Box2d) {
    return {
      x: getRangeRelation(this.minX, this.maxX, b.minX, b.maxX),
      y: getRangeRelation(this.minY, this.maxY, b.minY, b.maxY)
    }
  }

  intersect(e: Edge2d) {
    return {
      top: e.intersect(this.edges.top),
      right: e.intersect(this.edges.right),
      bottom: e.intersect(this.edges.bottom),
      left: e.intersect(this.edges.left)
    }
  }
}

export class Frame2d extends Box2d {
  connections: Record<BoxEdge, Vec2d>

  constructor(x: number, y: number, width: number, height: number) {
    super(x, y, width, height)

    this.connections = {
      top: new Vec2d(this.midX, this.y),
      right: new Vec2d(this.maxX, this.midY),
      bottom: new Vec2d(this.midX, this.maxY),
      left: new Vec2d(this.x, this.midY)
    }

    this.path = pointsToPolygon(
      this.corners.topRight,
      this.corners.bottomRight,
      this.corners.bottomLeft,
      this.corners.topLeft
    )
  }

  update() {
    this.connections.top.set(this.midX, this.y)
    this.connections.right.set(this.maxX, this.midY)
    this.connections.bottom.set(this.midX, this.maxY)
    this.connections.left.set(this.x, this.midY)
  }
}

export type RangeRelation =
  | "a before b"
  | "a after b"
  | "a aligns b"
  | "a aligns b start"
  | "a aligns b end"
  | "a overlaps b start"
  | "a overlaps b end"
  | "a contains b"
  | "a contains b aligns start"
  | "a contains b aligns end"
  | "a contained by b"
  | "a contained by b aligns start"
  | "a contained by b aligns end"
  | "something else"

function getRangeRelation(
  minA: number,
  maxA: number,
  minB: number,
  maxB: number
): RangeRelation {
  if (maxA < minB) return "a before b"
  if (minA > maxB) return "a after b"
  if (maxA === minB) return "a aligns b start"
  if (minA === maxB) return "a aligns b end"
  if (minA === minB && maxA === maxB) return "a aligns b"
  if (minA < minB && maxA > maxB) return "a contains b"
  if (minA > minB && maxA < maxB) return "a contained by b"
  if (minA === minB && maxA < maxB) return "a contained by b aligns start"
  if (minA > minB && maxA === maxB) return "a contained by b aligns end"
  if (minA === minB && maxA > maxB) return "a contains b aligns start"
  if (minA < minB && maxA === maxB) return "a contains b aligns end"
  if (minA < minB && maxA > minB && maxA < maxB) return "a overlaps b start"
  if (minA > minB && minA < maxB && maxA > minB) return "a overlaps b end"

  return "something else"
}
