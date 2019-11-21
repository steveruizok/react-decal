/*
TEMPLATE

Here's a general template for new projects.

You don't have to use all of the callbacks provided -- at minimum, a
Decal component only needs a `height`, `width`, and `draw`. The engine
also takes care of mouse location and pressed keys, so there's no need
to manage that data yourself.
*/

import React from "react"
import Decal, { DC, FC, MC, KC } from "../../Decal"
import { Point2 } from "../types"
import { curve } from "./cardinal"

type S = { points: Point2[]; snap: number }

const draw: DC<S> = ({ ctx, assets, info }) => {
  const points = [
    { x: 0, y: 136 },
    { x: 177, y: 170 },
    { x: 179, y: 180 },
    { x: 186, y: 199 }
  ]

  const path = curve(points)

  ctx.beginPath()
  ctx.moveTo(path[0].x, path[0].y)

  for (let point of path) {
    ctx.lineTo(point.x, point.y)
  }

  ctx.stroke()

  return {
    points,
    snap: 0
  } // initial state
}

const onFrame: FC<S> = ({ ctx, state, assets, info }) => {
  ctx.clearRect(0, 0, info.size.width, info.size.height)

  if (state.points.length > 0) {
    const path = curve(state.points)
    ctx.beginPath()
    ctx.moveTo(path[0].x, path[0].y)
    for (let point of path) {
      ctx.lineTo(point.x, point.y)
    }

    ctx.stroke()
  }
}

const onClick: MC<S> = ({ event, ctx, state, assets, info }) => {
  state.points = []
}

const onMouseMove: MC<S> = ({ event, ctx, state, assets, info }) => {
  if (state.snap > 2) {
    state.points.push(info.mouse.point)
    state.snap = 0
  } else {
    state.snap++
  }
}

const onMouseEnter: MC<S> = ({ event, ctx, state, assets, info }) => {}

const onMouseLeave: MC<S> = ({ event, ctx, state, assets, info }) => {}

const onKeyPress: KC<S> = ({ event, ctx, state, assets, info }) => {}

const Splines: React.FC = props => {
  return (
    <Decal
      height={320}
      width={480}
      draw={draw}
      onFrame={onFrame}
      onClick={onClick}
      onMouseMove={onMouseMove}
      // onMouseLeave={onMouseLeave}
      // onMouseEnter={onMouseEnter}
      // onKeyPress={onKeyPress}
      // wipe={true}
    />
  )
}

export default Splines
