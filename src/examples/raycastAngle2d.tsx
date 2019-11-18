import React from "react"
import Decal, { DC, FC, MC, KC } from "../Decal"
import { range } from "lodash"
import { Point2 } from "./raytracing/types"
import { castRay2d } from "./linesAndRays/castRay2d"

const scale = 10
const cols = 48
const rows = 32

type S = {
  cells: Path2D[][]
  blocks: Path2D[]
  line: Point2[]
  start?: Point2
  end?: Point2
  hit?: Path2D
}

const draw: DC<S> = ({ ctx, assets, info }) => {
  const cells = range(rows).map(y =>
    range(cols).map(x => {
      const path = new Path2D()
      path.rect(x * scale, y * scale, scale, scale)
      return path
    })
  )

  return {
    cells,
    line: [],
    start: { x: 24, y: 16 },
    blocks: [cells[10][10], cells[11][10], cells[12][10]]
  } // initial state
}

const onFrame: FC<S> = ({ ctx, state, assets, info }) => {
  const { cells, line } = state

  cells.forEach((row, y) =>
    row.forEach((col, x) => {
      // ctx.stroke(col)
      if (line.find(p => p.x === x && p.y === y)) {
        ctx.fill(col)
      }
    })
  )

  for (let block of state.blocks) {
    ctx.stroke(block)
    if (block === state.hit) {
      ctx.save()
      ctx.strokeStyle = "red"
      ctx.lineWidth = 4
      ctx.stroke(block)
      ctx.restore()
    }
  }
}

const onClick: MC<S> = ({ event, ctx, state, assets, info }) => {
  const point = {
    x: Math.floor(info.mouse.point.x / scale),
    y: Math.floor(info.mouse.point.y / scale)
  }

  const cell = state.cells[point.y][point.x]

  if (info.keys.has("Shift")) {
    state.blocks.push(cell)
  } else {
    state.start = point
  }
}

let angle = 0

const onMouseMove: MC<S> = ({ event, ctx, state, assets, info }) => {
  const point = {
    x: Math.floor(info.mouse.point.x / scale),
    y: Math.floor(info.mouse.point.y / scale)
  }

  state.end = point

  if (state.start && state.end) {
    angle += info.mouse.delta.x

    const cast = castRay2d(
      state.start,
      angle,
      ({ point, position }) => {
        for (let block of state.blocks) {
          if (ctx.isPointInPath(block, point.x * scale, point.y * scale)) {
            return block
          }
        }
      },
      48
    )
    state.hit = cast.hit
    state.line = cast.positions
  }
}

// const onMouseEnter: MC<S> = ({ event, ctx, state, assets, info }) => {}

// const onMouseLeave: MC<S> = ({ event, ctx, state, assets, info }) => {}

// const onKeyPress: KC<S> = ({ event, ctx, state, assets, info }) => {}

const RayCastAngle2d: React.FC = props => {
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
      // onKeyPress={onKeyPress}
      // wipe={true}
    />
  )
}

export default RayCastAngle2d
