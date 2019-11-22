import React, { useCallback } from "react"
import Decal, { DC, FC, MC, KC } from "../../Decal"
import { castRay2d } from "../linesAndRays/castRay2d"

interface Point {
  x: number
  y: number
}
interface Rect extends Point {
  w: number
  h: number
}

interface Block extends Rect {
  path: Path2D
}

type S = {
  origin: Point
  blocks: Block[]
}

const figures = [
  { x: 16, y: 16, w: 16, h: 16 },
  { x: 100, y: 40, w: 16, h: 16 },
  { x: 160, y: 160, w: 16, h: 16 },
  { x: 300, y: 200, w: 16, h: 16 }
]

const blocks = [
  { x: 32, y: 32, w: 32, h: 32 },
  { x: 64, y: 200, w: 32, h: 64 },
  { x: 320, y: 64, w: 64, h: 64 }
]

const rectToPath = (rect: Rect) => {
  const path = new Path2D()
  path.rect(rect.x, rect.y, rect.w, rect.h)
  return path
}

const rectsPath = new Path2D()
for (let { x, y, w, h } of blocks) {
  rectsPath.rect(x, y, w, h)
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
  const draw = useCallback<DC<S>>(({ ctx, assets, info }) => {
    return {
      origin: info.center,
      blocks: blocks.map(block => ({
        ...block,
        path: rectToPath(block)
      }))
    } // initial state
  }, [])

  const onFrame = useCallback<FC<S>>(({ ctx, state, assets, info }) => {
    const { origin, blocks } = state
    for (let block of blocks) {
      ctx.fill(block.path)
    }

    const endPoints = blocks.reduce((acc, block) => {
      const corners = [
        { x: block.x, y: block.y },
        { x: block.x + block.w, y: block.y },
        { x: block.x + block.w, y: block.y + block.h },
        { x: block.x, y: block.y + block.h }
      ]

      const distances = corners.map(corner =>
        Math.hypot(origin.x - corner.x, origin.y - corner.y)
      )

      const nearest = corners
        .sort((a, b) => {
          const iA = corners.indexOf(a)
          const iB = corners.indexOf(b)

          return distances[iA] > distances[iB] ? 1 : -1
        })
        .slice(0, 3)

      acc.push(
        ...nearest.map(pt => ({
          point: pt,
          angle: angle(origin, pt)
        }))
      )
      return acc
    }, [] as { point: Point; angle: number }[])

    // for (let point of endPoints) {
    //   ctx.beginPath()
    //   ctx.moveTo(origin.x, origin.y)
    //   ctx.lineTo(point.x, point.y)
    //   ctx.stroke()
    // }

    endPoints.push(
      {
        point: { x: 0, y: 0 },
        angle: angle(origin, { x: 0, y: 0 })
      },
      {
        point: { x: info.size.width, y: 0 },
        angle: angle(origin, { x: 0, y: 0 })
      },
      {
        point: { x: info.size.width, y: info.size.height },
        angle: angle(origin, { x: 0, y: 0 })
      },
      {
        point: { x: 0, y: 0 },
        angle: angle(origin, { x: 0, y: info.size.height })
      }
    )

    const sortedEndPoints = endPoints.sort((a, b) => {
      return a.angle < b.angle ? 1 : -1
    })

    let polyPoints = [] as any

    for (let endpoint of sortedEndPoints) {
      const angles = [
        endpoint.angle - 0.01,
        endpoint.angle,
        endpoint.angle + 0.01
      ]

      const rays = angles.map(angle =>
        castRay2d(
          origin,
          angle,
          ({ point }) => {
            if (
              point.x < 5 ||
              point.x > info.size.width - 5 ||
              point.y < 5 ||
              point.y > info.size.height - 5
            ) {
              return "wall"
            }

            if (ctx.isPointInPath(rectsPath, point.x, point.y)) {
              return "block"
            }
          },
          1000
        )
      )

      if (rays.every(ray => ray.hit === "block")) {
        ctx.beginPath()
        ctx.moveTo(origin.x, origin.y)
        ctx.lineTo(endpoint.point.x, endpoint.point.y)
        ctx.stroke()
      } else {
        const longest = rays.sort((a, b) =>
          a.distance < b.distance ? 1 : -1
        )[0]

        ctx.beginPath()
        ctx.moveTo(origin.x, origin.y)
        ctx.lineTo(longest.point.x, longest.point.y)
        ctx.stroke()

        polyPoints.push(longest.point)
      }
    }

    const path = new Path2D()
    path.moveTo(polyPoints[0].x, polyPoints[0].y)
    for (let point of polyPoints) {
      path.lineTo(point.x, point.y)
    }

    ctx.fillStyle = "rgba(0,0,0,.2)"
    ctx.fill(path)
  }, [])

  const onClick = useCallback<MC<S>>(({ event, state, assets, info }) => {}, [])

  const onMouseMove = useCallback<MC<S>>(({ event, state, assets, info }) => {
    state.origin = info.mouse.point
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
      fps={10}
    />
  )
}

export default ShadowCaster

// Shadowcasting

function angle(a: Point, b: Point) {
  return (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI
}

function angle2(a: Point, b: Point, c: Point) {
  var a1 = angle(a, b)
  var a2 = angle(b, c)
  var a3 = a1 - a2
  if (a3 < 0) a3 += 360
  if (a3 > 360) a3 -= 360
  return a3
}
