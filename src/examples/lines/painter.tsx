import { interpolate } from "@popmotion/popcorn"
import { getSpline } from "./spline"
import npath from "ngraph.path"
import { AStarFinder } from "astar-typescript"
import createGraph from "ngraph.graph"

import {
  Vec2d,
  BoxEdge,
  BoxCorner,
  Box2d,
  Edge2d,
  Frame2d,
  pointToCircle,
  pointsToPath,
  lerp,
  transform
} from "../../utils"

const colors = {
  Black: "#1a1c2c",
  Purple: "#5d275d",
  Red: "#b13e53",
  Orange: "#ef7d57",
  Yellow: "#ffcd75",
  LightGreen: "#a7f070",
  Green: "#38b764",
  DarkGreen: "#257179",
  DarkBlue: "#29366f",
  Blue: "#3b5dc9",
  LightBlue: "#41a6f6",
  Aqua: "#73eff7",
  White: "#f4f4f4",
  LightGray: "#94b0c2",
  Gray: "#566c86",
  DarkGray: "#333c57"
}

type Color = keyof typeof colors

export class Painter {
  ctx: CanvasRenderingContext2D

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx
    this.ctx.lineWidth = 3
  }

  paintBackground(color: Color = "White") {
    const { ctx } = this

    ctx.save()
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    // ctx.fillStyle = colors[color]
    // ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    ctx.restore()
  }

  paintFrame(frame: Frame2d, color: Color = "LightGray") {
    const { ctx } = this

    ctx.save()
    ctx.fillStyle = colors[color]
    ctx.fill(frame.path)
    ctx.restore()
  }

  paintFrames(frames: Frame2d[], color: Color = "LightGray") {
    const { ctx } = this

    ctx.save()
    ctx.fillStyle = colors[color]

    for (let frame of frames) {
      ctx.lineWidth = 1
      ctx.strokeStyle = "#000"
      ctx.fill(frame.path)
      ctx.stroke(frame.path)
    }

    ctx.restore()
  }

  drawArrow(point: Vec2d, radians: number) {
    const { ctx } = this
    ctx.save()
    ctx.beginPath()
    ctx.translate(point.x, point.y)
    ctx.rotate(radians)
    ctx.moveTo(0, 0)
    ctx.lineTo(0, 0 + 6)
    ctx.lineTo(0 + 12, 0)
    ctx.lineTo(0, 0 - 6)
    ctx.lineTo(0, 0)
    ctx.fill()
    ctx.resetTransform()
    ctx.restore()
  }

  drawArc(a: Vec2d, b: Vec2d, corner: Vec2d) {
    const { ctx } = this

    ctx.beginPath()
    ctx.moveTo(a.x, a.y)
    ctx.quadraticCurveTo(corner.x, corner.y, b.x, b.y)
    ctx.stroke()
  }

  paintArrowBetweenFrames(a: Frame2d, b: Frame2d, color: Color = "Green") {
    const { ctx } = this

    const direct = a.center.edgeTo(b.center)

    const intersection =
      getIntersection(a, b, direct) || a.center.edgeTo(b.center)

    /* ------------------ Curvy Arrows ------------------ */

    // Compute Edges / Vectors

    const padding = 16
    const expandedA = a.getOffset(padding / 2)
    const expandedB = b.getOffset(padding)

    let minTangentDistance =
      Math.min(
        expandedA.height,
        expandedB.height,
        expandedA.width,
        expandedB.width
      ) * 1.5

    if (expandedA.overlaps(expandedB)) {
      console.log("yep")
    }

    let final:
      | {
          corner: Vec2d
          start: Vec2d
          end: Vec2d
          angle: number
          distance: number
        }
      | undefined = undefined

    // Cross and Tangent

    const cross = direct.copy()

    let crossScale = 1
    let tangentScale = 1

    if (cross.distance < minTangentDistance) {
      crossScale = minTangentDistance / cross.distance
      tangentScale = minTangentDistance / cross.distance
    }

    if (intersection.distance < minTangentDistance) {
      tangentScale = 1 + (crossScale - 1) * 2
    }

    const tangent = cross.copy().rotate(90)

    cross.scale(crossScale)
    tangent.scale(tangentScale)

    const ccwCorner = tangent.end

    const ccwEdgeA = cross.start.edgeTo(tangent.end)
    const ccwEdgeB = tangent.end.edgeTo(cross.end)

    const ccwIntersectsA = expandedA.intersect(ccwEdgeA)
    const ccwIntersectsB = expandedB.intersect(ccwEdgeB)

    const ccwIntersectA = Object.entries(ccwIntersectsA).find(([k, v]) => !!v)
    const ccwIntersectB = Object.entries(ccwIntersectsB).find(([k, v]) => !!v)

    if (ccwIntersectA && ccwIntersectB) {
      const ccwPointA = ccwIntersectA[1]
      const ccwPointB = ccwIntersectB[1]

      if (ccwPointA && ccwPointB) {
        const distance = Math.hypot(
          ccwPointB.x - ccwPointA.x,
          ccwPointB.y - ccwPointA.y
        )

        final = {
          start: ccwPointA,
          end: ccwPointB,
          corner: ccwCorner,
          angle: ccwEdgeB.radians,
          distance
        }
      }
    }

    // Clockwise

    const cwCorner = tangent.start

    const cwEdgeA = cross.start.edgeTo(tangent.start)
    const cwEdgeB = tangent.start.edgeTo(cross.end)

    const cwIntersectsA = expandedA.intersect(cwEdgeA)
    const cwIntersectsB = expandedB.intersect(cwEdgeB)

    const cwIntersectA = Object.entries(cwIntersectsA).find(([k, v]) => !!v)
    const cwIntersectB = Object.entries(cwIntersectsB).find(([k, v]) => !!v)

    if (cwIntersectA && cwIntersectB) {
      const cwPointA = cwIntersectA[1]
      const cwPointB = cwIntersectB[1]

      if (cwPointA && cwPointB) {
        const distance = Math.hypot(
          cwPointB.x - cwPointA.x,
          cwPointB.y - cwPointA.y
        )

        if (!final || (final && distance > final.distance * 1.1)) {
          final = {
            start: cwPointA,
            end: cwPointB,
            corner: cwCorner,
            angle: cwEdgeB.radians,
            distance
          }
        }
      }
    }

    if (final !== undefined) {
      ctx.strokeStyle = colors.Black
      ctx.fillStyle = colors.Black
      ctx.fill(pointToCircle(final.start))
      this.drawArc(final.start, final.end, final.corner)
      this.drawArrow(final.end, final.angle)
    }
  }
}

// Utils

function findEdgeVectors(...frames: Frame2d[]): Vec2d[][] {
  const [a, b] = frames
  const aEdges = Object.values(a.edges)
  const bEdges = Object.values(b.edges)

  const intersects: Vec2d[] = []
  const aPoints: Vec2d[] = []
  const bPoints: Vec2d[] = []

  for (let edgeA of aEdges) {
    aPoints.push(edgeA.start)

    for (let edgeB of bEdges) {
      const intersect = edgeA.intersect(edgeB)
      if (intersect !== undefined) {
        intersects.push(intersect)
        aPoints.push(intersect)
        bPoints.push(intersect)
      }
    }
  }

  for (let edgeB of bEdges) {
    bPoints.push(edgeB.start)
  }

  return [intersects, aPoints, bPoints]
}

function findEdge(
  vectors: Vec2d[] = [],
  forbidden: Vec2d[] = [],
  edges: Edge2d[] = []
): Edge2d[] {
  const v = vectors.shift()

  if (v === undefined) {
    return edges
      .sort((a, b) => b.start.x - a.start.x)
      .sort((a, b) => a.start.y - b.start.y)
  }

  const connections = [
    vectors.find(v2 => v.x < v2.x && v.y === v2.y),
    vectors.find(v2 => v.x === v2.x && v.y < v2.y),
    vectors.find(v2 => v.x === v2.x && v.y > v2.y),
    vectors.find(v2 => v.x > v2.x && v.y === v2.y)
  ]

  const isForbidden = forbidden.includes(v)

  connections.forEach((c, j) => {
    if (!!c) {
      if (isForbidden && forbidden.includes(c)) {
        return
      }

      edges.push(new Edge2d(v, c))
    }
  })

  return findEdge(vectors, forbidden, edges)
}

function findEdges(
  edgeVectors: Vec2d[][],
  ...frames: Frame2d[]
): {
  a: Edge2d[]
  b: Edge2d[]
} {
  let [intersects, aPoints, bPoints] = edgeVectors

  const fa = aPoints
    .sort((a, b) => b.x - a.x)
    .sort((a, b) => b.y - a.y)
    .filter(v => !frames.find(f => f.containsVec(v)))

  const fb = bPoints
    .sort((a, b) => a.x - b.x)
    .sort((a, b) => b.y - a.y)
    .filter(v => !frames.find(f => f.containsVec(v)))

  const edgesA = findEdge(fa, intersects).filter(e => e.distance > 16)
  const edgesB = findEdge(fb, intersects).filter(e => e.distance > 16)

  return {
    a: edgesA,
    b: edgesB
  }
}

const edges: BoxEdge[] = ["top", "right", "bottom", "left"]

function getIntersectionEdge(a: Frame2d, b: Frame2d, line: Edge2d) {
  // Find intersected edges

  const aIntersectedEdge = edges.find(edge => line.intersects(a.edges[edge]))
  const bIntersectedEdge = edges.find(edge => line.intersects(b.edges[edge]))

  return [aIntersectedEdge as BoxEdge, bIntersectedEdge as BoxEdge]
}

function getIntersection(a: Frame2d, b: Frame2d, line: Edge2d) {
  // Find intersected edges

  const aIntersectedEdge = edges.find(edge => line.intersects(a.edges[edge]))
  const bIntersectedEdge = edges.find(edge => line.intersects(b.edges[edge]))

  if (!(aIntersectedEdge && bIntersectedEdge)) return

  const aIntersectionPoint = line.intersect(a.edges[aIntersectedEdge])
  const bIntersectionPoint = line.intersect(b.edges[bIntersectedEdge])

  if (!(aIntersectionPoint && bIntersectionPoint)) return

  return new Edge2d(aIntersectionPoint, bIntersectionPoint)
}

const OFFSET = 16

const north = new Vec2d(0, -OFFSET)
const south = new Vec2d(0, OFFSET)
const east = new Vec2d(OFFSET, 0)
const west = new Vec2d(-OFFSET, 0)
const ne = new Vec2d(OFFSET, -OFFSET)
const se = new Vec2d(OFFSET, OFFSET)
const sw = new Vec2d(-OFFSET, OFFSET)
const nw = new Vec2d(-OFFSET, -OFFSET)

function getOffsetCornerPoints(v: Vec2d) {
  return [v.add(ne), v.add(se), v.add(sw), v.add(nw)]
}

function getNodesForFrame(frame: Frame2d, currentEdges: Edge2d[]) {
  return currentEdges.flatMap(edge => {
    const points: Vec2d[] = []
    const { midPoint, start, end, normal } = edge

    if (normal.x === 1 || normal.x === -1) {
      // Right
      points.push(midPoint.add(north))
      points.push(midPoint.add(south))
    } else {
      // Down
      points.push(midPoint.add(west))
      points.push(midPoint.add(east))
    }

    points.push(start.add(nw))
    points.push(start.add(sw))
    points.push(end.add(ne))
    points.push(end.add(se))

    return [
      midPoint,
      ...[
        ...getOffsetCornerPoints(edge.start),
        ...getOffsetCornerPoints(edge.end),
        ...points
      ].filter(p => !frame.containsVec(p))
    ]
  })
}

function getNodesForFrames(
  edgesA: Edge2d[],
  edgesB: Edge2d[],
  frameA: Frame2d,
  frameB: Frame2d
) {
  const nodesA = getNodesForFrame(frameA, edgesA)
  const nodesB = getNodesForFrame(frameB, edgesB)
  // const nodesBetween =

  return [nodesA, nodesB]
}

function getPushedEdgeNodes(edges: Edge2d[], frame: Frame2d) {
  return edges.map(e => {
    const { normal } = e
    if (normal.x === 0) {
      //vertical
      if (e.start.x < frame.midX) {
        // left
        return e.midPoint.add(west)
      } else {
        // right
        return e.midPoint.add(east)
      }
    } else {
      // horizontal
      if (e.start.y < frame.midY) {
        // top
        return e.midPoint.add(north)
      } else {
        // bottom
        return e.midPoint.add(south)
      }
    }
  })
}
