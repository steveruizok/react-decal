export const movePointInDirection = (
	point: { x: number; y: number },
	angle: number,
	distance: number
) => {
	return {
		x: point.x + distance * Math.cos((angle * Math.PI) / 180),
		y: point.y + distance * Math.sin((angle * Math.PI) / 180),
	}
}

export function degreesToRadians(degrees: number) {
	return (degrees * Math.PI) / 180
}

export function radiansToDegrees(radians: number) {
	return (radians * 180) / Math.PI
}

export const getAngleBetweenPoints = (
	pointA: { x: number; y: number },
	pointB: { x: number; y: number },
	type: "radians" | "degrees" = "radians"
) => {
	const radians = Math.atan2(pointA.y - pointB.y, pointA.x - pointB.x)
	if (type === "degrees") {
		return radiansToDegrees(radians)
	} else return radians
}

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

	angle(v: Vec2d): number {
		return Math.atan2(v.y - this.y, v.x - this.x)
	}

	push(length: number, angle: number) {
		this.x += length * Math.cos(angle)
		this.y += length * Math.sin(angle)
	}

	add(v: Vec2d): Vec2d {
		return new Vec2d(this.x + v.x, this.y + v.y)
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

	norm() {
		return Math.sqrt(this.x * this.x + this.y * this.y)
	}

	normalize(): Vec2d {
		let norm = this.norm()

		return new Vec2d(this.x / norm, this.y / norm)
	}

	subtract(v: Vec2d): Vec2d {
		return new Vec2d(this.x - v.x, this.y - v.y)
	}

	scalarMult(a: number): Vec2d {
		return new Vec2d(this.x * a, this.y * a)
	}

	toString(): string {
		return "(" + this.x + ", " + this.y + ")"
	}
}
