import React, { useCallback } from "react"
import Decal, { DC, FC, MC, KC } from "../../Decal"
import { useSpline } from "../hooks/useSpline2"

interface Point2 {
  x: number
  y: number
}

type S = {
  points: Point2[]
  skipFrames: number
}

const Spline: React.FC = props => {
  const [points, setPoints] = React.useState<Point2[]>([])
  const { spline, path } = useSpline(points)

  const draw = useCallback<DC<S>>(({ ctx, assets, info }) => {
    ctx.lineWidth = 3
    ctx.lineCap = "round"
    return {
      points: [],
      skipFrames: 2
    }
  }, [])

  // Draw spline from points on each frame
  const onFrame = useCallback<FC<S>>(
    ({ ctx, state, assets, info }) => {
      if (info.mouse.clicked) {
        if (state.points.length < 2) return
        ctx.beginPath()
        for (let point of state.points) {
          ctx.lineTo(point.x, point.y)
        }
        ctx.stroke()
        return
      } else {
        if (points.length < 2) return
        ctx.stroke(path)
      }
    },
    [points]
  )

  // Add mouse point to points every (3) frames
  const onMouseMove = useCallback<MC<S>>(
    ({ event, state, assets, info }) => {
      if (state.skipFrames > 0) {
        state.skipFrames--
        return
      }

      if (info.mouse.clicked) {
        state.skipFrames = 2
        state.points.push(info.mouse.point)
      }
    },
    [setPoints]
  )

  // Clear points on mouse down
  const onMouseDown = useCallback<MC<S>>(
    ({ event, state, assets, info }) => {
      state.points = []
      setPoints(points => [])
    },
    [setPoints]
  )

  const onClick = useCallback<MC<S>>(
    ({ event, state, assets, info }) => {
      setPoints(points => state.points)
    },
    [setPoints]
  )

  return (
    <Decal
      height={320}
      width={480}
      draw={draw}
      onClick={onClick}
      onFrame={onFrame}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      wipe={true}
    />
  )
}

export default Spline
