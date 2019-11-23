import React, { useCallback } from "react"
import Decal, { DC, FC, MC, KC } from "../../Decal"
import { useSpline } from "../hooks/useSpline2"

interface Point2 {
  x: number
  y: number
}

type S = {
  points: Point2[]
  selectedPoint: number
}

const Spline: React.FC = props => {
  const [points, setPoints] = React.useState<Point2[]>([
    { x: 32, y: 32 },
    { x: 64, y: 128 },
    { x: 102, y: 44 },
    { x: 400, y: 250 }
  ])
  const { spline, path } = useSpline(points)

  const draw = useCallback<DC<S>>(({ ctx, assets, info }) => {
    ctx.lineWidth = 3
    ctx.lineCap = "round"

    const points = [
      { x: 32, y: 32 },
      { x: 64, y: 128 },
      { x: 102, y: 44 },
      { x: 400, y: 250 }
    ]

    return {
      points,
      selectedPoint: 0
    }
  }, [])

  // Draw spline from points on each frame
  const onFrame = useCallback<FC<S>>(
    ({ ctx, state, assets, info }) => {
      // Spline path
      ctx.stroke(path)

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

      // Selected knob
      const selected = new Path2D()
      addCircleToPath(selected, points[state.selectedPoint])

      ctx.save()
      ctx.fillStyle = "#000"
      ctx.fill(selected)
      ctx.restore()
    },
    [points]
  )

  const onClick = useCallback<MC<S>>(
    ({ event, state, assets, info }) => {
      const { point } = info.mouse
      setPoints(points => [...points, point])
    },
    [setPoints]
  )

  const onKeyPress = useCallback<KC<S>>(
    ({ event, state, assets, info }) => {
      const point = points[state.selectedPoint]
      switch (event.key) {
        case "q": {
          if (state.selectedPoint === 0) {
            state.selectedPoint = points.length - 1
          } else {
            state.selectedPoint--
          }
          break
        }
        case "e": {
          if (state.selectedPoint === points.length - 1) {
            state.selectedPoint = 0
          } else {
            state.selectedPoint++
          }
          break
        }
        case "a": {
          point.x -= 5
          setPoints(() => [...points])
          break
        }
        case "d": {
          point.x += 5
          setPoints(() => [...points])
          break
        }
        case "w": {
          point.y -= 5
          setPoints(() => [...points])
          break
        }
        case "s": {
          point.y += 5
          setPoints(() => [...points])
          break
        }
      }
    },
    [setPoints, points]
  )

  return (
    <Decal
      width={480}
      height={320}
      draw={draw}
      onClick={onClick}
      onFrame={onFrame}
      onKeyPress={onKeyPress}
      wipe={true}
    />
  )
}

export default Spline

// Helpers

function addCircleToPath(path: Path2D, point: Point2, radius = 8) {
  path.moveTo(point.x + radius, point.y)
  path.arc(point.x, point.y, radius, 0, Math.PI * 2)
  return path
}
