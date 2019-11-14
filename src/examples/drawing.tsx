import React from 'react'
import Decal, { DC } from '../Decal'

const draw: DC = ({ ctx, info }) => {
	ctx.beginPath()
	ctx.moveTo(info.center.x, info.center.y)
	ctx.ellipse(info.center.x, info.center.y, 10, 10, 0, 0, Math.PI * 2)
	ctx.closePath()
	ctx.stroke()
}

const Template: React.FC = (props) => {
	return <Decal height={320} width={480} draw={draw} />
}

export default Template
