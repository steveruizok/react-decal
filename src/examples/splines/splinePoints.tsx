import React, { useCallback } from "react"
import Decal, { DC, FC, MC, KC } from "../../Decal"
import { useSpline } from "../hooks/useSpline2"

const Spline: React.FC = () => {
  const [{ points, path }, setPoints, movePoint] = useSpline([
    { x: 32, y: 32 },
    { x: 64, y: 128 },
    { x: 102, y: 44 },
    { x: 400, y: 250 },
    { x: 380, y: 300 }
  ])

  const [selectedIndex, setSelectedIndex] = React.useState(0)

  const draw: DC = ({ ctx }) => {
    ctx.lineWidth = 3
    ctx.lineCap = "round"

    // Spline
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
    addCircleToPath(selected, points[selectedIndex])

    ctx.save()
    ctx.fillStyle = "#000"
    ctx.fill(selected)
    ctx.restore()
  }

  const onClick: MC = ({ info }) => {
    setPoints([...points, info.mouse.point])
  }

  const onKeyPress: KC = ({ event }) => {
    switch (event.key) {
      case "q": {
        let next = selectedIndex - 1
        if (next < 0) next = points.length - 1
        setSelectedIndex(next)
        break
      }
      case "e": {
        let next = selectedIndex + 1
        if (next > points.length - 1) next = 0
        setSelectedIndex(next)
        break
      }
      case "a": {
        movePoint(selectedIndex, { x: -5, y: 0 })
        break
      }
      case "d": {
        movePoint(selectedIndex, { x: 5, y: 0 })
        break
      }
      case "w": {
        movePoint(selectedIndex, { x: 0, y: -5 })
        break
      }
      case "s": {
        movePoint(selectedIndex, { x: 0, y: 5 })
        break
      }
    }
  }

  return (
    <Decal
      width={480}
      height={320}
      draw={draw}
      onClick={onClick}
      onKeyPress={onKeyPress}
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
