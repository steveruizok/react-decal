/*
MOUSE HUNTER

If your game does not require React, you're free to place your draw 
and onFrame callbacks outside of your React component.
*/

import * as React from 'react'
import { Vec2d } from '../utils'
import Decal, { DC, FC } from '../Decal'

const BOX_SIZE = 100

type S = {
	corners: Vec2d[]
	inner: Vec2d[]
}

const draw: DC<S> = ({ info }) => {
	const { width, height } = info.size

	return {
		corners: [
			new Vec2d(0, 0),
			new Vec2d(width, 0),
			new Vec2d(width, height),
			new Vec2d(0, height),
		],
		inner: [
			new Vec2d(0, 0),
			new Vec2d(BOX_SIZE, 0),
			new Vec2d(BOX_SIZE, BOX_SIZE),
			new Vec2d(0, BOX_SIZE),
		],
	}
}

const onFrame: FC<S> = ({ ctx, state, info }) => {
	const { corners, inner } = state

	ctx.beginPath()

	const mouse = new Vec2d(
		info.mouse.x - BOX_SIZE / 2,
		info.mouse.y - BOX_SIZE / 2
	)

	const iVerts = inner.map((v) => v.add(mouse))

	ctx.moveTo(iVerts[3].x, iVerts[3].y)

	iVerts.forEach((vert, i) => {
		ctx.lineTo(vert.x, vert.y)
	})

	corners.forEach((vert, i) => {
		ctx.moveTo(vert.x, vert.y)
		ctx.lineTo(iVerts[i].x, iVerts[i].y)
	})

	ctx.stroke()
}

const Hall: React.FC = () => {
	return <Decal height={320} width={480} draw={draw} onFrame={onFrame} />
}

export default Hall
