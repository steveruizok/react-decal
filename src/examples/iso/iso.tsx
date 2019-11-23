import React, { useCallback } from "react"
import Decal, { DC, FC, MC, KC } from "../../Decal"
import {
  getIsoWorld,
  makeCube,
  World,
  Point2,
  Point3,
  screenToSpace,
  paintCube
} from "../../iso"

type S = {
  origin: Point2
  hovered: {
    point: Point2
    position: Point3
  }
  world: World
}

const blocks = [
  { x: 2, y: 0, z: 1 },
  { x: 3, y: 3, z: 1 },
  { x: 0, y: 2, z: 1 }
]

const Iso: React.FC = props => {
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

    return {
      origin,
      world,
      hovered: {
        point: { x: 0, y: 0 },
        position: { x: 0, y: 0, z: 1 }
      }
    } // initial state
  }, [])

  const onFrame = useCallback<FC<S>>(({ ctx, state, assets, info }) => {
    const { world, origin } = state

    for (let cube of world.cubes()) {
      paintCube(ctx, origin, cube, "#ccc")
    }

    for (let block of blocks) {
      const cube = makeCube(block)
      paintCube(ctx, origin, cube, "#ccc")
    }
  }, [])

  const onClick = useCallback<MC<S>>(({ event, state, assets, info }) => {}, [])

  const onMouseMove = useCallback<MC<S>>(({ event, state, assets, info }) => {
    state.hovered.point = screenToSpace(
      {
        x: info.mouse.point.x - state.origin.x,
        y: info.mouse.point.y - state.origin.y,
        z: 1
      },
      false
    )

    state.hovered.position = screenToSpace(
      {
        x: info.mouse.point.x - state.origin.x,
        y: info.mouse.point.y - state.origin.y,
        z: 1
      },
      false
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

export default Iso

// Painting
