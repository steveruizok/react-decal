/*
IN-COMPONENT TEMPLATE

Here's a template for projects where you want your callbacks to occur
inside of your component. You might want to do this, for example, if 
your callbacks need to respond to the component's props.

It's important that callbacks aren't generated fresh each time the 
component updates.  If the callback is dependent on the component's state 
or props, then place the callback inside of the component function's body 
and memoize it using the `useCallback` hook. Otherwise, if the callback 
has no dependencies, then move it outside of the component's function.
*/

import React, { useCallback } from "react"
import Decal, { DC, FC, MC, KC } from "../Decal"
import { useShadowcast } from "./hooks/useShadowcast"
import { castRay2d } from "./linesAndRays/castRay2d"

type S = {
  visibilityPolygon: Path2D
}

const width = 640
const height = 480

const figures = [
  { x: 16, y: 16, width: 16, height: 16 },
  { x: 100, y: 40, width: 16, height: 16 },
  { x: 160, y: 160, width: 16, height: 16 },
  { x: 300, y: 200, width: 16, height: 16 }
]

const rects = [
  { x: 32, y: 32, width: 32, height: 32 },
  { x: 64, y: 96, width: 32, height: 64 },
  { x: 320, y: 32, width: 64, height: 64 }
]

const rectsPath = new Path2D()
for (let { x, y, width, height } of rects) {
  rectsPath.rect(x, y, width, height)
}

function polygonToPath(polygon: number[][]) {
  const path = new Path2D()
  for (let point of polygon) {
    path.lineTo(point[0], point[1])
  }
  path.closePath()
  return path
}

const ShadowCaster: React.FC = props => {
  const getVisibilityPolgygon = useShadowcast(
    [...rects, ...figures],
    width,
    height
  )

  const draw = useCallback<DC<S>>(({ ctx, assets, info }) => {
    const points = getVisibilityPolgygon({ x: 320, y: 240 })
    const visibilityPolygon = polygonToPath(points)

    return {
      visibilityPolygon
    } // initial state
  }, [])

  const onFrame = useCallback<FC<S>>(({ ctx, state, assets, info }) => {
    const path = new Path2D(state.visibilityPolygon)
    path.rect(0, 0, info.size.width, info.size.height)

    ctx.fillStyle = "#333"
    ctx.fill(path, "evenodd")

    ctx.fillStyle = "#CCC"
    ctx.fill(rectsPath)

    for (let figure of figures) {
      ctx.save()

      const figurePath = new Path2D()
      figurePath.moveTo(figure.x, figure.y)
      figurePath.rect(figure.x, figure.y, figure.width, figure.height)

      let visibility = 0

      const corners = [
        { x: figure.x, y: figure.y },
        { x: figure.x + figure.width, y: figure.y },
        { x: figure.x + figure.width, y: figure.y + figure.height },
        { x: figure.x, y: figure.y + figure.height },
        { x: figure.x + figure.width / 2, y: figure.y + figure.height / 2 }
      ]

      for (let corner of corners) {
        const ray = castRay2d(
          info.mouse.point,
          {
            x: corner.x - info.mouse.point.x,
            y: corner.y - info.mouse.point.y
          },
          ({ point }) => {
            if (ctx.isPointInPath(rectsPath, point.x, point.y)) {
              return false
            }

            if (ctx.isPointInPath(figurePath, point.x, point.y)) {
              return figure
            }
          },
          400
        )

        if (ray.hit === figure) {
          ctx.beginPath()
          ctx.moveTo(info.mouse.point.x, info.mouse.point.y)
          ctx.lineTo(corner.x, corner.y)
          ctx.stroke()
          visibility += 1 / 5
        }
      }

      ctx.globalAlpha = visibility
      ctx.fillStyle = "#4ddfea"
      ctx.fill(figurePath)

      ctx.restore()
    }
  }, [])

  const onClick = useCallback<MC<S>>(({ event, state, assets, info }) => {}, [])

  const onMouseMove = useCallback<MC<S>>(({ event, state, assets, info }) => {
    const points = getVisibilityPolgygon(info.mouse.point)
    state.visibilityPolygon = polygonToPath(points)
  }, [])

  const onMouseEnter = useCallback<MC<S>>(
    ({ event, state, assets, info }) => {},
    []
  )

  const onMouseLeave = useCallback<MC<S>>(
    ({ event, state, assets, info }) => {},
    []
  )

  const onKeyPress = useCallback<KC<S>>(({ event, state, assets, info }) => {},
  [])

  return (
    <Decal
      height={320}
      width={480}
      draw={draw}
      onFrame={onFrame}
      // onClick={onClick}
      onMouseMove={onMouseMove}
      // onMouseLeave={onMouseLeave}
      // onMouseEnter={onMouseEnter}
      // onKeyPress={onKeyPress}
      wipe={true}
    />
  )
}

export default ShadowCaster
