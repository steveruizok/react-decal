import { transform } from "./utils"
import { range, flatten, compact } from "lodash-es"
import { addPoints2 } from "./utils"

const scale = 32,
  ratioX = 2,
  ratioY = 1,
  angle = 45,
  padding = 0,
  w = Math.floor(scale * ratioX),
  h = Math.floor(scale * ratioY),
  z = Math.floor(
    transform(angle, [45, 90], [Math.ceil(Math.hypot(w / 2, h / 2)), 0])
  ),
  t = {
    w,
    h,
    z,
    hw: w / 2,
    hh: h / 2,
    hz: z / 2
  }

export const screenToSpace = (point: Point3, floor = true): Point3 => {
  let { x, y, z } = point

  x /= t.hw
  x /= 2

  y += z * t.z
  y -= padding
  y /= t.hh
  y /= 2

  return {
    x: floor ? Math.floor(y + x) : y + x,
    y: floor ? Math.floor(y - x) : y - x,
    z
  }
}

export const spaceToScreen = (point: Point3): Point2 => {
  let { x, y, z } = point

  return {
    x: (x - y) * t.hw,
    y: (x + y) * t.hh - z * t.z
  }
}

export const getSpaceVerts = (size: Point3): Verts<Point3> => {
  let { x, y, z } = size
  const ox = (1 - x) / 2
  const oy = (1 - y) / 2

  x += ox
  y += oy

  return {
    center: { x: x / 2, y: y / 2, z: z / 2 },
    centerDown: { x: ox + size.x / 2, y: oy + size.y / 2, z: 0 },
    backDown: { x: ox, y: oy, z: 0 },
    rightDown: { x: x, y: oy, z: 0 },
    frontDown: { x: x, y: y, z: 0 },
    leftDown: { x: ox, y: y, z: 0 },
    centerUp: { x: ox + size.x / 2, y: oy + size.y / 2, z: z },
    backUp: { x: ox, y: oy, z: z },
    rightUp: { x: x, y: oy, z: z },
    frontUp: { x: x, y: y, z: z },
    leftUp: { x: ox, y: y, z: z }
  }
}

export const spaceVertstoScreenVerts = (
  verts: Verts<Point3>,
  origin: Point2 = { x: 0, y: 0 }
): Verts<Point2> => {
  return Object.keys(verts).reduce(
    (acc, key) =>
      Object.assign(acc, {
        [key]: addPoints2(spaceToScreen(verts[key as Vert]), origin)
      }),
    {} as Verts<Point2>
  )
}

export const getVerts = (size: Point3, origin: Point2 = { x: 0, y: 0 }) => {
  const space = getSpaceVerts(size)
  const screen = spaceVertstoScreenVerts(space, origin)

  return { space, screen }
}

/* ---------------------------------- Paths --------------------------------- */

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

/* ---------------------------------- Cube ---------------------------------- */

// const oneByOne = { x: 1, y: 1, z: 1 }
// const oneByOneVerts = getVerts(oneByOne)
// const oneByOnePaths = getPaths(oneByOneVerts.screen)

export function makeCube(
  point: Point3,
  size: Point3 = { x: 1, y: 1, z: 1 }
): Cube {
  const spacePoint = point,
    screenPoint = spaceToScreen(point),
    verts = getVerts(size, screenPoint),
    paths = getPaths(verts.screen)

  return {
    space: {
      point: spacePoint,
      verts: verts.space
    },
    screen: {
      point: screenPoint,
      verts: verts.screen
    },
    point,
    size,
    paths
  }
}

export function getIsoWorld(
  depthX: number,
  depthY: number,
  depthZ: number,
  factory: (point: Point3) => boolean
) {
  const grid = range(depthZ).map(z =>
    range(depthY).map(y =>
      range(depthX).map(x => {
        return {
          point: { x, y, z },
          content: factory({ x, y, z }) && makeCube({ x, y, z })
        } as Position
      })
    )
  )

  function positions(): Position[] {
    return flatten(flatten(grid))
  }

  function cubes(): Cube[] {
    return compact(positions().map(position => position.content))
  }

  function getCube(point: Point3) {
    const position = getPosition(point)
    return position ? position.content : undefined
  }

  function getPosition(point: Point3) {
    const { x, y, z } = point
    return grid[z] && grid[z][y] && grid[z][y][x]
  }

  return {
    grid,
    positions,
    cubes,
    getCube,
    getPosition
  }
}

// Types

export interface Point2 {
  x: number
  y: number
}
export interface Point3 extends Point2 {
  z: number
}

export enum Vert {
  Center = "center",
  CenterDown = "centerDown",
  BackDown = "backDown",
  RightDown = "rightDown",
  FrontDown = "frontDown",
  LeftDown = "leftDown",
  CenterUp = "centerUp",
  BackUp = "backUp",
  RightUp = "rightUp",
  FrontUp = "frontUp",
  LeftUp = "leftUp"
}

export type Verts<T> = Record<Vert, T>

export type Cube = {
  space: {
    point: Point3
    verts: Verts<Point3>
  }
  screen: {
    point: Point2
    verts: Verts<Point2>
  }
  point: Point3
  size: Point3
  paths: Record<string, Path2D>
}

export type Position = {
  point: Point3
  content: Cube | undefined
}

export type World = ReturnType<typeof getIsoWorld>
