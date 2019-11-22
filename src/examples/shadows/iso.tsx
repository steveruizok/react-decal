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
import Decal, { DC, FC, MC, KC } from "../../Decal"
import { useShadowcast } from "../useShadowcast"
import { castRay2d } from "../linesAndRays/castRay2d"
import {
  getIsoWorld,
  makeCube,
  World,
  Cube,
  Point2,
  Point3,
  Verts,
  screenToSpace,
  spaceToScreen,
  paintCube
} from "../../iso"

type S = {
  visibilityPolygon: Path2D
  origin: Point2
  world: World
}

const width = 640
const height = 480

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

    const points = getVisibilityPolgygon({ x: 0, y: 0 })
    const pts = points.map(p => spaceToScreen({ x: p[0], y: p[1], z: 1 }))
    const visibilityPolygon = polygonToPath(
      pts.map(p => [p.x + 160, p.y + 160])
    )

    console.log(pts)
    return {
      visibilityPolygon,
      origin,
      world
    } // initial state
  }, [])

  const onFrame = useCallback<FC<S>>(({ ctx, state, assets, info }) => {
    const { world, origin } = state

    for (let cube of world.cubes()) {
      paintCube(ctx, origin, cube, "#ccc")
    }
    ctx.save()
    const path = new Path2D(state.visibilityPolygon)
    path.rect(0, 0, info.size.width, info.size.height)
    ctx.globalCompositeOperation = "source-atop"
    ctx.fillStyle = "#333"
    ctx.fill(path, "evenodd")
    ctx.restore()

    for (let block of blocks) {
      const cube = makeCube(block)
      paintCube(ctx, origin, cube, "#ccc")
    }
  }, [])

  const onClick = useCallback<MC<S>>(({ event, state, assets, info }) => {}, [])

  const onMouseMove = useCallback<MC<S>>(({ event, state, assets, info }) => {
    const pt = screenToSpace(
      {
        x: info.mouse.point.x - state.origin.x,
        y: info.mouse.point.y - state.origin.y,
        z: 1
      },
      false
    )

    const points = getVisibilityPolgygon({ x: pt.x, y: pt.y })
    const pts = points.map(p => spaceToScreen({ x: p[0], y: p[1], z: 1 }))
    state.visibilityPolygon = polygonToPath(
      pts.map(p => [p.x + state.origin.x, p.y + state.origin.y])
    )
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

// Painting
