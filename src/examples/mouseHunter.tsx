/*
MOUSE HUNTER

If your game does not require React, you're free to place your draw 
and onFrame callbacks outside of your React component.
*/

import * as React from 'react'
import { Vec2d } from '../utils'
import Decal, { DC, FC } from '../Decal'

const SHIP_RADIUS = 10

type S = {
	mover: {
		point: Vec2d
		rotation: number
	}
	mouse: Vec2d
}

const draw: DC<S> = ({ ctx, assets, info }) => {
	const { center } = info

	return {
		mover: {
			point: new Vec2d(center.x, center.y),
			rotation: 0,
		},
		mouse: new Vec2d(info.mouse.x, info.mouse.y),
	}
}

const onFrame: FC<S> = ({ ctx, state, assets, info }) => {
	const { mover, mouse } = state

	mouse.set(info.mouse.x, info.mouse.y)
	mover.rotation = mover.point.angleTo(mouse)

	// Paint ship
	ctx.beginPath()
	ctx.moveTo(mover.point.x, mover.point.y)
	ctx.ellipse(
		mover.point.x,
		mover.point.y,
		SHIP_RADIUS,
		SHIP_RADIUS,
		mover.rotation,
		0,
		Math.PI * 2
	)
	ctx.closePath()
	ctx.stroke()
}

const MouseHunter: React.FC = (props) => {
	return <Decal height={320} width={480} draw={draw} onFrame={onFrame} />
}

export default MouseHunter
