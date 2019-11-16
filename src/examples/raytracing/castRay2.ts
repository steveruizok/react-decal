import { Point3 } from "./types"
import { uniq } from "lodash-es"

const NARROW_TESTS = 10

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
  const path = new Set<string>([])

  // For steps, normalize step against longest dimension
  const max = Math.max(direction.x, direction.y, direction.z)

  // A broad step is a full integer step in the max dimension
  const step = {
    x: direction.x / max / broadTests,
    y: direction.y / max / broadTests,
    z: direction.z / max / broadTests
  }

  // A narrow step is a more fine division of the broad step
  const narrowStep = {
    x: step.x / narrowTests,
    y: step.y / narrowTests,
    z: step.z / narrowTests
  }

  // Copy the origin for our broad phase point
  const broadPoint: Point3 = { ...from }
  let position: Point3 = { ...from }

  for (let i = 0; i < maxDistance * broadTests; i++) {
    position = {
      x: Math.round(broadPoint.x),
      y: Math.round(broadPoint.y),
      z: Math.round(broadPoint.z)
    }

    // Keep track of the positions at each step
    path.add(`${position.x}_${position.y}_${position.z}`)

    // Test the broad step
    const broadHit = hitTestBroad(broadPoint, position)

    // If we have a broad hit, switch to the narrow phase.
    if (broadHit) {
      // If we don't have a narrow phase test, stop the ray!
      if (hitTestNarrow === undefined) {
        return {
          hit: true,
          point: broadPoint,
          position,
          path: pathToPoints(path)
        }
      } else {
        // ...but if we do have a narrow phase test, make
        // small steps and test at each point.

        // Copy the broad point for our narrow phase point
        const narrowPoint: Point3 = { ...broadPoint }

        for (let j = 0; j < narrowTests; j++) {
          // Step the narrow point
          narrowPoint.x += narrowStep.x
          narrowPoint.y += narrowStep.y
          narrowPoint.z += narrowStep.z

          // Test for a hit at this point
          const narrowHit = hitTestNarrow(narrowPoint, position)

          // If we have a narrow hit,  stop the ray!
          if (narrowHit) {
            return {
              hit: true,
              point: narrowPoint,
              position,
              path: pathToPoints(path)
            }
          }

          // If we didn't have a narrow phase hit, then continue until
          // we get a hit or run out of tests
        }
      }
    }
    // If we didn't have a broad phase hit, or if we had a narrow
    // test and we've run out of narrow tests without a narrow phase
    // hit, then step our point and continue with broad phase steps

    broadPoint.x += step.x
    broadPoint.y += step.y
    broadPoint.z += step.z
  }

  // If we've run out of broad phase steps, stop the ray!
  return {
    hit: false,
    point: broadPoint,
    position,
    path: pathToPoints(path)
  }
}

function pathToPoints(path: Set<string>) {
  return Array.from(path.values()).map(p => {
    const [x, y, z] = p.split("_").map(c => parseFloat(c))
    return { x, y, z }
  })
}
