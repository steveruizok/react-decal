import React from 'react'
import { Vec2d } from '../utils'
import Decal, { FC, DC, MC } from '../Decal'

const assets = {
	kitten: 'kitten.jpg',
}

type S = {
	point: Vec2d
	direction: number
}

const draw: DC<S> = () => {
	return {
		point: new Vec2d(0, 0),
		direction: 1,
	}
}

const onFrame: FC<S> = (ctx, state, assets, info) => {
	ctx.drawImage(assets.kitten, state.point.x, state.point.y)

	if (info.hovered) {
		state.point.y = info.mouse.y - assets.kitten.height / 2
	} else {
		state.point.y = 0
	}

	if (state.point.x < -assets.kitten.width / 2) {
		state.direction = 1
	} else if (state.point.x > info.size.width - assets.kitten.width / 2) {
		state.direction = -1
	}

	state.point.x += state.direction
}

const Assets: React.FC = () => {
	return (
		<Decal
			height={320}
			width={480}
			draw={draw}
			onFrame={onFrame}
			assets={assets}
		/>
	)
}

export default Assets
