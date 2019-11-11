/*
SHIP

If your game does not require React, you're free to place your draw 
and onFrame callbacks outside of your React component.
*/

import * as React from 'react'
import { Vec2d } from '../utils'
import Decal, { DC, FC } from '../Decal'

const SHIP_RADIUS = 10,
	ROTATION_RATE = Math.PI / 28,
	THRUST_RATE = 1,
	MAX_THRUST = 5,
	FRICTION = 0.24

type State = {
	ship: {
		point: Vec2d
		rotation: number
		velocity: number
	}
}

const draw: DC<State> = (state, assets, info) => {
	const { center } = info

	return {
		ship: {
			point: new Vec2d(center.x, center.y),
			rotation: 0,
			velocity: 0,
		},
	}
}

const onFrame: FC<State> = (ctx, state, assets, info) => {
	const { keys } = info
	const { ship } = state

	// Respond to inputs
	if (keys.has('a')) {
		ship.rotation -= ROTATION_RATE
	}

	if (keys.has('d')) {
		ship.rotation += ROTATION_RATE
	}

	if (keys.has('w')) {
		ship.velocity += THRUST_RATE
		if (ship.velocity > MAX_THRUST) {
			ship.velocity = MAX_THRUST
		}
	}

	// Move the ship
	ship.point.push(ship.velocity, ship.rotation)

	ship.velocity -= FRICTION
	if (ship.velocity < 0) {
		ship.velocity = 0
	}

	const { width, height } = info.size
	const r = SHIP_RADIUS
	const d = r * 2

	// Wrap position
	if (ship.point.x < -d) {
		ship.point.x = width + r
	} else if (ship.point.x > width + d) {
		ship.point.x = -r
	}

	if (ship.point.y < -d) {
		ship.point.y = height + r
	} else if (ship.point.y > height + d) {
		ship.point.y = -r
	}

	// Paint ship
	ctx.beginPath()
	ctx.moveTo(ship.point.x, ship.point.y)
	ctx.ellipse(
		ship.point.x,
		ship.point.y,
		SHIP_RADIUS,
		SHIP_RADIUS,
		ship.rotation,
		0,
		Math.PI * 2
	)
	ctx.closePath()
	ctx.stroke()
}

const Ship: React.FC = (props) => {
	return <Decal height={320} width={480} draw={draw} onFrame={onFrame} wipe />
}

export default Ship
