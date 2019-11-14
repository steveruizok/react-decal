// Translations

export function degreesToRadians(degrees: number) {
  return (degrees * Math.PI) / 180;
}

export function radiansToDegrees(radians: number) {
  return (radians * 180) / Math.PI;
}

// Path2D

export function pointsToPath(...points: { x: number; y: number }[]) {
  const [start, ...rest] = points;
  return new Path2D(
    `M${start.x},${start.y}` + rest.map(p => `L${p.x},${p.y}`).join(" ")
  );
}

export function pointsToPolygon(...points: { x: number; y: number }[]) {
  const path = pointsToPath(...points);
  path.closePath();

  return path;
}

export function pointToCircle(point: Vec2d, radius: number) {
  const path = new Path2D();
  path.moveTo(point.x - 2, point.y - 2);
  path.ellipse(point.x - 2, point.y - 2, radius, radius, 0, 0, Math.PI * 2);
  return path;
}

// Vector 2D

export class Vec2d {
  x: number = 0;
  y: number = 0;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  set(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  snapTo(v: Vec2d) {
    this.x = v.x;
    this.y = v.y;
  }

  // gets angle between point and another point
  angleTo(v: Vec2d): number {
    return Math.atan2(v.y - this.y, v.x - this.x);
  }

  interpolate(v: Vec2d, f: number) {
    return new Vec2d(this.x * (1 - f) + v.x * f, this.y * (1 - f) + v.y * f);
  }

  // moves the point in a direction by a certain length
  push(length: number, angle: number) {
    this.x += length * Math.cos(angle);
    this.y += length * Math.sin(angle);
  }

  add(v: Vec2d): Vec2d {
    return new Vec2d(this.x + v.x, this.y + v.y);
  }

  equals(v: Vec2d) {
    return this.x === v.x && this.y === v.y;
  }

  copy(): Vec2d {
    return new Vec2d(this.x, this.y);
  }

  distance(v: Vec2d) {
    return v.subtract(this).norm();
  }

  mult(scalar: number) {
    return new Vec2d(this.x * scalar, this.y * scalar);
  }

  norm() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  normalize() {
    let norm = this.norm();

    return new Vec2d(this.x / norm, this.y / norm);
  }

  subtract(v: Vec2d) {
    return new Vec2d(this.x - v.x, this.y - v.y);
  }

  scalarMult(a: number) {
    return new Vec2d(this.x * a, this.y * a);
  }

  toArray() {
    return [this.x, this.y];
  }

  toString() {
    return "(" + this.x + ", " + this.y + ")";
  }
}
