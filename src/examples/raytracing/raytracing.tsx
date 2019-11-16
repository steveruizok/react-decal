import React from "react"
import Decal, { ADC, DC, FC, MC, KC } from "../../Decal"
import {
  getIsoWorld,
  makeCube,
  World,
  Cube,
  Point2,
  Point3,
  screenToSpace,
  spaceToScreen
} from "./iso"
import { findLast } from "lodash-es"
import { Machine, interpret } from "xstate"
import { castRay } from "./castRay2"
import { subtractPoints, pointsAreEqual, addPoints3 } from "./utils"

const machine = Machine(
  {
    id: "machine",
    initial: "selecting",
    states: {
      panning: {
        id: "panning",
        on: { PANEND: "selecting.prev" }
      },
      selecting: {
        id: "selecting",
        initial: "selectStart",
        on: {
          PANSTART: "panning",
          HOVER: {
            actions: (context, event: any) => {
              context.hovered = event.cube
              return context
            },
            cond: (context, event: any) => context.hovered !== event.cube
          }
        },
        states: {
          prev: { type: "history" },
          selectStart: {
            on: {
              SELECT: {
                target: "selectEnd",
                actions: (context, event: any) => {
                  context.start = context.hovered
                  return context
                }
              }
            }
          },
          selectEnd: {
            on: {
              CANCEL: "selectStart",
              SELECT: [
                {
                  target: "selectStart",
                  actions: (context, event: any) => {
                    context.start = undefined
                    return context
                  },
                  cond: (context, event) => context.hovered === context.start
                },
                {
                  target: "selected",
                  actions: (context, event: any) => {
                    context.end = context.hovered
                    return context
                  }
                }
              ]
            }
          },
          selected: {
            on: {
              CANCEL: "selectStart",
              SELECT: [
                {
                  target: "selectEnd",
                  actions: (context, event: any) => {
                    context.end = undefined
                    return context
                  },
                  cond: (context, event) => context.hovered === context.end
                },
                {
                  target: "selected",
                  actions: (context, event: any) => {
                    context.end = context.hovered
                    return context
                  }
                }
              ]
            }
          }
        }
      }
    },
    context: {
      start: undefined as Cube | undefined,
      end: undefined as Cube | undefined,
      hovered: undefined as Cube | undefined,
      path: [] as Point3[],
      laser: makeCube({ x: 0, y: 0, z: 1 }, { x: 0.5, y: 0.5, z: 1.25 }),
      targets: [
        makeCube({ x: 5, y: 3, z: 1 }, { x: 0.5, y: 0.5, z: 1 }),
        makeCube({ x: 1, y: 5, z: 1 }, { x: 0.1, y: 0.5, z: 1 }),
        makeCube({ x: 2, y: 3, z: 1 }, { x: 1, y: 1, z: 1 }),
        makeCube({ x: 3, y: 2, z: 1 }, { x: 1, y: 1, z: 0.25 }),
        makeCube({ x: 2, y: 0, z: 1 }, { x: 1, y: 1, z: 1 })
      ]
    }
  },
  {
    actions: {}
  }
)

const service = interpret(machine)

type S = {
  origin: Point2
  world: World
  hitTest2d: HitTest2
  hitTest3d: HitTest3
  service: typeof service
  current: any
  context: any
  hit?: Point3
  path: Point3[]
}

const draw: DC<S> = ({ ctx, state, assets, info }) => {
  const world = getIsoWorld(10, 10, 1, ({ x, y, z }) => true)

  // state machine
  service.subscribe(s => {
    state.current = s.value
    state.context = s.context
  })

  service.start()

  // Drawing origin
  const origin = {
    x: info.center.x,
    y: info.center.y
  }

  // Initial paint
  for (let cube of world.cubes()) {
    paintCube(ctx, origin, cube, "#ccc")
  }

  // Initial state
  return {
    world,
    hovered: undefined,
    origin: {
      x: info.center.x,
      y: info.center.y
    },
    hitTest2d(point: Point2) {
      return findLast(world.cubes(), cube =>
        ctx.isPointInPath(cube.paths.outline, point.x, point.y)
      )
    },
    hitTest3d(point: Point3) {
      return findLast(world.cubes(), cube =>
        isPointInCube(point, cube.space.point, cube.size)
      )
    },
    service,
    current: machine.initialState.value,
    context: state.context,
    line: undefined,
    hit: { x: 5, y: 0, z: 1 },
    path: []
  }
}

const onFrame: FC<S> = ({ ctx, state, assets, info }) => {
  const { world, origin, context } = state

  // Paint cubes
  for (let cube of world.cubes()) {
    const { start, end, path } = context

    const inPath = state.path.find(
      (p: Point3) => p.x === cube.point.x && p.y === cube.point.y
    )

    const color =
      cube === state.context.hovered
        ? "#4ddfea"
        : cube === start
        ? "blue"
        : cube === end
        ? "orange"
        : inPath
        ? "#efefef"
        : "#ccc"

    paintCube(ctx, origin, cube, color)
  }

  paintCube(ctx, origin, context.laser, "#99df66")

  for (let cube of context.targets) {
    paintCube(ctx, origin, cube, "#ff935b")
  }

  if (state.hit) {
    const from = spaceToScreen({ x: 0, y: 0, z: 1.5 })
    const to = spaceToScreen(state.hit)

    ctx.beginPath()
    ctx.moveTo(from.x + state.origin.x, from.y + state.origin.y)
    ctx.lineTo(to.x + state.origin.x, to.y + state.origin.y)

    ctx.save()
    ctx.strokeStyle = "#0fdb0b"
    ctx.lineWidth = 3
    ctx.stroke()
    ctx.stroke()
    ctx.stroke()
    ctx.lineWidth = 2
    ctx.strokeStyle = "#ffffff"
    ctx.stroke()
    ctx.stroke()
    ctx.stroke()
    ctx.restore()

    ctx.save()
    ctx.globalAlpha = 0.7

    for (let cube of context.targets) {
      paintCube(ctx, origin, cube, "#ff935b")
    }
    ctx.restore()
  }
}

const onClick: MC<S> = ({ event, ctx, state, assets, info }) => {
  const { service } = state

  // Send select event with hovered cube
  service.send({ type: "SELECT" })
}

const onMouseMove: MC<S> = ({ event, ctx, state, assets, info }) => {
  const { service, context } = state
  // Set hovered cube
  // let hoveredCube: Cube | undefined = undefined

  // for (let cube of state.world.cubes()) {
  //   if (
  //     ctx.isPointInPath(
  //       cube.paths.outline,
  //       info.mouse.point.x - state.origin.x,
  //       info.mouse.point.y - state.origin.y
  //     )
  //   ) {
  //     hoveredCube = cube
  //   }
  // }

  // service.send({ type: "HOVER", cube: hoveredCube })

  // Pan
  if (info.mouse.clicked && info.keys.has("Shift")) {
    service.send("PANSTART")
  } else {
    service.send("PANEND")
  }

  if (state.current === "panning") {
    const delta = info.mouse.delta
    state.origin.x += delta.x
    state.origin.y += delta.y
  }

  // Raycasting

  const { laser, targets } = context

  const mousePoint = screenToSpace(
    {
      x: info.mouse.point.x - state.origin.x,
      y: info.mouse.point.y - state.origin.y,
      z: 1.5
    },
    false
  )

  const bStart = { x: 0, y: 0, z: 1.5 }
  const bEnd = mousePoint
  const direction = subtractPoints(bEnd, bStart)

  const result = castRay(
    bStart,
    direction,
    (point, position) => {
      for (let target of targets) {
        if (isPointInCube(point, target.point, { x: 1, y: 1, z: 1 })) {
          return true
        }
      }
      // console.log(point)
      return false
    },
    (point, position) => {
      for (let target of targets) {
        // console.log("testing point", point)
        if (isPointInCube(point, target.point, target.size)) {
          return true
        }
      }
      return false
    },
    10
  )

  state.path = result.path
  state.hit = result.point
}

const onMouseEnter: MC<S> = ({ event, ctx, state, assets, info }) => {}

const onMouseLeave: MC<S> = ({ event, ctx, state, assets, info }) => {}

const onKeyPress: KC<S> = ({ event, ctx, state, assets, info }) => {
  event.preventDefault()
  if (event.key === "q") {
    service.send("CANCEL")
  }
}

const RayTracing: React.FC = props => {
  return (
    <Decal
      height={320}
      width={480}
      draw={draw}
      onFrame={onFrame}
      onClick={onClick}
      onMouseMove={onMouseMove}
      // onMouseLeave={onMouseLeave}
      // onMouseEnter={onMouseEnter}
      onKeyPress={onKeyPress}
      // fps={8}
      wipe={true}
      style={{
        backgroundColor: "#2d2d2d"
      }}
    />
  )
}

export default RayTracing

function paintCube(
  ctx: CanvasRenderingContext2D,
  origin: Point2,
  cube: Cube,
  color: string
) {
  ctx.save()
  ctx.resetTransform()
  ctx.translate(origin.x, origin.y)
  ctx.fillStyle = color
  ctx.fill(cube.paths.outline)
  ctx.fillStyle = "rgba(0,0,0,.15)"
  ctx.fill(cube.paths.southFace)
  ctx.fillStyle = "rgba(0,0,0,.35)"
  ctx.fill(cube.paths.eastFace)
  ctx.strokeStyle = "#333"
  ctx.stroke(cube.paths.outline)
  ctx.restore()
}

type HitTest2 = (point: Point2, offset: Point2) => Cube | undefined

type HitTest3 = (point: Point3) => Cube | undefined

export function isPointInCube(hit: Point3, point: Point3, size: Point3) {
  return !(
    hit.x < point.x ||
    hit.x > point.x + size.x ||
    hit.y < point.y ||
    hit.y > point.y + size.y ||
    hit.z < point.z || // below are still hits
    hit.z > point.z + size.z
  )
}
