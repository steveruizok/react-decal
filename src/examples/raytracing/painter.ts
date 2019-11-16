import { Verts, Point2, Point3 } from "./types"

export function pointsToPath(start: Point2, ...points: Point2[]) {
  return new Path2D(
    `M${start.x},${start.y}` + points.map(p => `L${p.x},${p.y}`).join(" ")
  )
}

export function pointsToPolygon(...points: Point2[]) {
  if (points.length < 2) return new Path2D()
  const [start, ...rest] = points
  return new Path2D(
    `M${start.x},${start.y}` + rest.map(p => `L${p.x},${p.y}`).join(" ") + "Z"
  )
}

export function getPaths(verts: Verts<Point2>) {
  const {
    rightUp,
    rightDown,
    leftUp,
    frontUp,
    frontDown,
    leftDown,
    backUp
  } = verts

  return {
    southFace: pointsToPolygon(frontDown, leftDown, leftUp, frontUp),
    eastFace: pointsToPolygon(frontDown, frontUp, rightUp, rightDown),
    topFace: pointsToPolygon(frontUp, leftUp, backUp, rightUp),
    northEdge: pointsToPath(backUp, rightUp),
    eastEdge: pointsToPath(rightDown, frontDown),
    southEdge: pointsToPath(frontDown, leftDown),
    westEdge: pointsToPath(leftUp, backUp),
    northEastEdge: pointsToPath(rightUp, rightDown),
    southWestEdge: pointsToPath(leftUp, leftDown),
    inline: pointsToPath(frontDown, frontUp, leftUp, frontUp, rightUp),
    outline: pointsToPath(
      frontDown,
      leftDown,
      leftUp,
      backUp,
      rightUp,
      rightDown,
      frontDown
    )
  }
}
