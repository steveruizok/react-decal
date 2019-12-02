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
  marker: number
  lastOffset: number
}

const Spline: React.FC = props => {
  const [
    {
      getSplineGradient,
      getSplinePoint,
      getNormalizedOffset,
      segmentLengths,
      splineLength,
      points,
      path
    },
    setPoints
  ] = useSpline([
    { x: 32, y: 32 },
    { x: 64, y: 128 },
    { x: 102, y: 44 },
    { x: 400, y: 250 },
    { x: 380, y: 300 }
  ])

  const draw = useCallback<DC<S>>(({ ctx, assets, info }) => {
    ctx.lineWidth = 3
    ctx.lineCap = "round"

    return {
      points,
      skipFrames: 2,
      marker: 0,
      lastOffset: 0
    }
  }, [])

  // Draw spline from points on each frame
  const onFrame: FC<S> = ({ ctx, state, info }) => {
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

    // Knobs
    const knobs = new Path2D()
    for (let point of points) {
      addCircleToPath(knobs, point)
    }

    ctx.save()
    ctx.fillStyle = "rgba(255, 255, 255, .5)"
    ctx.fill(knobs)
    ctx.stroke(knobs)
    ctx.restore()

    // Move marker based on user input
    if (info.keys.has("a")) {
      state.marker -= 2
      if (state.marker < 0) {
        state.marker += splineLength
      }
    } else if (info.keys.has("d")) {
      state.marker += 2
      if (state.marker > splineLength - 1) {
        state.marker -= splineLength
      }
    }

    // Calculate marker point, gradient and angle of gradient
    const offset = getNormalizedOffset(state.marker)
    state.lastOffset = offset

    const markerPoint = getSplinePoint(offset, false)
    const markerGradient = getSplineGradient(offset, false)
    const r = Math.atan2(-markerGradient.y, markerGradient.x)

    // Draw marker
    ctx.save()
    ctx.beginPath()
    ctx.moveTo(markerPoint.x, markerPoint.y)
    ctx.ellipse(markerPoint.x, markerPoint.y, 8, 8, -r, 0, Math.PI * 2)
    ctx.fillStyle = "rgba(255, 255, 255, .8)"
    ctx.fill()
    ctx.stroke()
    ctx.restore()
  }

  // Add mouse point to points every (3) frames
  const onMouseMove: MC<S> = ({ event, state, assets, info }) => {
    if (state.skipFrames > 0) {
      state.skipFrames--
      return
    }

    if (info.mouse.clicked) {
      state.skipFrames = 2
      state.points.push(info.mouse.point)
    }
  }

  // Clear points on mouse down
  const onMouseDown: MC<S> = ({ event, state, assets, info }) => {
    state.points = []
    state.marker = 0
    setPoints([])
  }

  const onClick: MC<S> = ({ event, state, assets, info }) => {
    setPoints(state.points)
  }

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

// Helpers

function addCircleToPath(
  path: Path2D,
  point: { x: number; y: number },
  radius = 8
) {
  path.moveTo(point.x + radius, point.y)
  path.arc(point.x, point.y, radius, 0, Math.PI * 2)
  return path
}
