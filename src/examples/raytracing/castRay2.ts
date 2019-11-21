import { Point3 } from "../types"

export function castRay(
  from: Point3,
  direction: Point3,
  hitTestBroad: (position: Point3, point: Point3) => boolean,
  hitTestNarrow?: (position: Point3, point: Point3) => boolean,
  maxDistance: number = 32,
  narrowTests: number = 10,
  broadTests: number = 4
): {
  hit: boolean
  position: Point3
  point: Point3
  path: Point3[]
} {
  const max = Math.max(direction.x, direction.y, direction.z)
  const step = dividePointBy(direction, max)
  const broadStep = dividePointBy(step, broadTests)
  const narrowStep = dividePointBy(step, narrowTests)

  const path = new Set<string>([])

  const broadPoint: Point3 = { ...from }

  for (let i = 0; i < maxDistance * broadTests; i++) {
    const position = getRoundedPoint(broadPoint)

    path.add(positionToPath(position))

    if (hitTestBroad(broadPoint, position)) {
      if (hitTestNarrow === undefined) {
        return {
          hit: true,
          point: broadPoint,
          position,
          path: pathToPoints(path)
        }
      } else {
        const narrowPoint: Point3 = { ...broadPoint }

        for (let j = 0; j < narrowTests; j++) {
          bumpPoint(narrowPoint, narrowStep)

          if (hitTestNarrow(narrowPoint, position)) {
            return {
              hit: true,
              point: narrowPoint,
              position,
              path: pathToPoints(path)
            }
          }
        }
      }
    }
    bumpPoint(broadPoint, broadStep)
  }

  const position = getRoundedPoint(broadPoint)

  return {
    hit: false,
    point: broadPoint,
    position,
    path: pathToPoints(path)
  }
}

/* --------------------------------- Helpers -------------------------------- */

function positionToPath(position: Point3) {
  return `${position.x}_${position.y}_${position.z}`
}
function pathToPoints(path: Set<string>) {
  return Array.from(path.values()).map(p => {
    const [x, y, z] = p.split("_").map(c => parseFloat(c))
    return { x, y, z }
  })
}

export function dividePointBy(p1: Point3, n: number) {
  return {
    x: p1.x / n,
    y: p1.y / n,
    z: p1.z / n
  }
}

export function getRoundedPoint(p1: Point3) {
  return {
    x: Math.round(p1.x),
    y: Math.round(p1.y),
    z: Math.round(p1.z)
  }
}

export function bumpPoint(p1: Point3, p2: Point3) {
  p1.x += p2.x
  p1.y += p2.y
  p1.z += p2.z
}

/*
Notes --------

[1]
To get a step, divide each dimension (x, y, z) by the longest dimension, so
that the longest dimension is our "normal" (1) dimension. We'll move along 
that dimension in full integer steps.

A step is a full integer step along the longest dimension.
A broad step is a big division of this full step.
A narrow step is a more fine division of the full step.

[2]
The path is a collection of visited positions. We'll use a set in order
to prevent duplicates.

[3]
We'll start our broad phase tests with a copy of the from point. 
We'll be mutating this copy after each broad step.

[4]
Here's our broad phase loop.

[5]
Get the position of this step and add it to our set.

[6]
Run the broad phase test to discover whether or not the current broad 
phase point should "hit" something.

[7]
If the broad phase hits, then first check whether we have an (optional) narrow
phase test. If not, then stop the process and return the hit.

[8]
If we do have a narrow test, then enter the narrow test phase. Start by creating
a new copy of the current broad phase point so that we can bump this copy
forward separately.

[9]
Here we'll start by bumping the point.

...
*/
