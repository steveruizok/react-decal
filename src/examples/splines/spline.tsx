import React, { useCallback } from "react"
import Decal, { DC, FC, MC, KC } from "../../Decal"
import { useSpline } from "../hooks/useSpline"

type S = {
  points: { x: number; y: number }[]
  skipFrames: number
}

const Spline: React.FC = props => {
  const curve = useSpline(25)

  const draw = useCallback<DC<S>>(({ ctx, assets, info }) => {
    ctx.lineWidth = 4
    ctx.globalAlpha = 1

    return {
      points: [],
      skipFrames: 2
    }
  }, [])

  // Draw spline from points on each frame
  const onFrame = useCallback<FC<S>>(({ ctx, state, assets, info }) => {
    if (state.points.length < 2) return

    if (info.mouse.clicked) {
      ctx.beginPath()
      for (let point of state.points) {
        ctx.lineTo(point.x, point.y)
      }
      ctx.stroke()
      return
    } else {
      const spline = curve(state.points)

      ctx.beginPath()
      for (let point of spline) {
        ctx.lineTo(point.x, point.y)
      }
      ctx.stroke()
    }
  }, [])

  // Add mouse point to points every (3) frames
  const onMouseMove = useCallback<MC<S>>(({ event, state, assets, info }) => {
    if (state.skipFrames > 0) {
      state.skipFrames--
      return
    }

    if (info.mouse.clicked) {
      state.skipFrames = 2
      state.points.push(info.mouse.point)
    }
  }, [])

  // Clear points on mouse down
  const onMouseDown = useCallback<MC<S>>(({ event, state, assets, info }) => {
    state.points = []
  }, [])

  return (
    <Decal
      height={320}
      width={480}
      draw={draw}
      onFrame={onFrame}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      wipe={true}
    />
  )
}

export default Spline
