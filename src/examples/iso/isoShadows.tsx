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
  origin: Point2
  world: World
}

const blocks = [
  { x: 2, y: 0, z: 1 },
  { x: 3, y: 3, z: 1 },
  { x: 0, y: 2, z: 1 }
]

const rectangles = blocks.map(block => ({
  x: block.x * 1,
  y: block.y * 1,
  width: 1,
  height: 1
}))

function polygonToPath(polygon: number[][]) {
  const path = new Path2D()
  for (let point of polygon) {
    path.lineTo(point[0], point[1])
  }
  path.closePath()
  return path
}

const ShadowCaster: React.FC = props => {
  const getVisibilityPolgygon = useShadowcast(rectangles, 5, 5)

  const draw = useCallback<DC<S>>(({ ctx, assets, info }) => {
    // Iso world
    const world = getIsoWorld(5, 5, 1, ({ x, y, z }) => true)

    // Drawing origin
    const origin = {
      x: info.center.x,
      y: 64
    }

    // Initial paint
    for (let cube of world.cubes()) {
      paintCube(ctx, origin, cube, "#ccc")
    }

    // Visibility polygon
    const points = getVisibilityPolgygon({ x: 0, y: 0 })
    const pts = points.map(p => spaceToScreen({ x: p[0], y: p[1], z: 1 }))
    const visibilityPolygon = polygonToPath(
      pts.map(p => [p.x + 160, p.y + 160])
    )

    return {
      visibilityPolygon,
      origin,
      world
    } // initial state
  }, [])

  const onFrame = useCallback<FC<S>>(({ ctx, state, assets, info }) => {
    const { world, origin } = state

    // First layer of blocks
    for (let cube of world.cubes()) {
      paintCube(ctx, origin, cube, "#ccc")
    }

    // Shadow
    ctx.save()
    const path = new Path2D(state.visibilityPolygon)
    path.rect(0, 0, info.size.width, info.size.height)
    ctx.globalCompositeOperation = "source-atop"
    ctx.fillStyle = "#333"
    ctx.fill(path, "evenodd")
    ctx.restore()

    // Second layer of blocks
    for (let block of blocks) {
      const cube = makeCube(block)
      paintCube(ctx, origin, cube, "#ccc")
    }
  }, [])

  const onMouseMove = useCallback<MC<S>>(({ event, state, assets, info }) => {
    // Hovered position
    const pt = screenToSpace(
      {
        x: info.mouse.point.x - state.origin.x,
        y: info.mouse.point.y - state.origin.y,
        z: 1
      },
      false
    )

    // Visibility polygon
    const points = getVisibilityPolgygon({ x: pt.x, y: pt.y })
    const pts = points.map(p => spaceToScreen({ x: p[0], y: p[1], z: 1 }))
    state.visibilityPolygon = polygonToPath(
      pts.map(p => [p.x + state.origin.x, p.y + state.origin.y])
    )
  }, [])

  return (
    <Decal
      height={320}
      width={480}
      draw={draw}
      onFrame={onFrame}
      onMouseMove={onMouseMove}
      wipe={true}
    />
  )
}

export default ShadowCaster
