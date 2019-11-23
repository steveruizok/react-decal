import React, { useCallback } from "react"
import Decal, { DC, FC, MC, KC } from "../../Decal"
import { useShadowcast } from "../hooks/useShadowcast"
import {
  getIsoWorld,
  makeCube,
  World,
  Point2,
  screenToSpace,
  spaceToScreen,
  paintCube
} from "../../iso"

type S = {
  visibilityPolygon: Path2D
}

const ShadowCaster: React.FC = props => {
  const [rectangles, setRectangles] = React.useState([
    { x: 200, y: 40, width: 32, height: 32 },
    { x: 300, y: 100, width: 32, height: 32 },
    { x: 40, y: 100, width: 32, height: 32 }
  ])

  const getVisibilityPolgygon = useShadowcast(rectangles, 640, 480)

  const draw = useCallback<DC<S>>(
    ({ ctx, assets, info }) => {
      // Visibility polygon
      const points = getVisibilityPolgygon(info.mouse.point)
      const polygon = polygonToPath(points)

      return {
        visibilityPolygon: polygon
      } // initial state
    },
    [getVisibilityPolgygon]
  )

  const onFrame = useCallback<FC<S>>(
    ({ ctx, state, assets, info }) => {
      // Shadow
      ctx.save()
      const path = new Path2D(state.visibilityPolygon)
      path.rect(0, 0, info.size.width, info.size.height)
      ctx.fillStyle = "#333"
      ctx.fill(path, "evenodd")
      ctx.restore()

      // Blocks
      ctx.fillStyle = "#CCC"
      for (let rect of rectangles) {
        ctx.fillRect(rect.x, rect.y, rect.width, rect.height)
      }
    },
    [getVisibilityPolgygon]
  )

  const onMouseMove = useCallback<MC<S>>(
    ({ event, state, assets, info }) => {
      // Get visibility polygon for mouse position
      const points = getVisibilityPolgygon(info.mouse.point)
      state.visibilityPolygon = polygonToPath(points)
    },
    [getVisibilityPolgygon]
  )

  const onClick = useCallback<MC<S>>(
    ({ event, state, assets, info }) => {
      // Get visibility polygon for mouse position
      setRectangles([
        ...rectangles,
        {
          x: info.mouse.point.x - 16,
          y: info.mouse.point.y - 16,
          width: 32,
          height: 32
        }
      ])
    },
    [rectangles]
  )

  return (
    <Decal
      height={320}
      width={480}
      draw={draw}
      onClick={onClick}
      onFrame={onFrame}
      onMouseMove={onMouseMove}
      wipe={true}
    />
  )
}

export default ShadowCaster

// Helpers

function polygonToPath(polygon: number[][]) {
  const path = new Path2D()
  for (let point of polygon) {
    path.lineTo(point[0], point[1])
  }
  path.closePath()
  return path
}
