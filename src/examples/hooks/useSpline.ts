import * as React from "react"

export function useSpline(numberOfSegments = 25) {
  const cache = React.useMemo(() => {
    const c = new Float32Array((numberOfSegments + 2) * 4)
    c[0] = 1
    let p = 4
    for (let i = 1; i < numberOfSegments; i++) {
      let st = i / numberOfSegments,
        st2 = st * st,
        st3 = st2 * st,
        st23 = st3 * 2,
        st32 = st2 * 3
      c[p++] = st23 - st32 + 1
      c[p++] = st32 - st23
      c[p++] = st3 - 2 * st2 + st
      c[p++] = st3 - st2
    }
    c[++p] = 1
    return c
  }, [numberOfSegments])

  const pointsToSpline = React.useCallback(
    function pointsToSpline(points: { x: number; y: number }[], tension = 0.5) {
      let l = points.length
      let results = [] as { x: number; y: number }[]

      // Make a copy of the points array
      const pts = points.slice(0)

      // Duplicate first point
      pts.unshift(points[0])

      // Duplicate last point
      pts.push(points[l - 1])

      // Loop through points and calculate segment points
      for (let i = 1; i < l; i++) {
        let prev = pts[i - 1],
          curr = pts[i],
          next = pts[i + 1],
          next2 = pts[i + 2],
          knot1 = {
            x: (next.x - prev.x) * tension,
            y: (next.y - prev.y) * tension
          },
          knot2 = {
            x: (next2.x - curr.x) * tension,
            y: (next2.y - curr.y) * tension
          }

        // For each of our segments, use pre-cached
        // interpolation values to calculate the new point
        for (let t = 0; t < numberOfSegments; t++) {
          let c = t << 2,
            c1 = cache[c],
            c2 = cache[c + 1],
            c3 = cache[c + 2],
            c4 = cache[c + 3]

          // Calculate the point...
          const interpolatedPoint = {
            x: c1 * curr.x + c2 * next.x + c3 * knot1.x + c4 * knot2.x,
            y: c1 * curr.y + c2 * next.y + c3 * knot1.y + c4 * knot2.y
          }

          // ... and add it to the results array
          results.push(interpolatedPoint)
        }
      }

      // Duplicate last point again
      results.push(points[points.length - 1])

      return results
    },
    [cache]
  )

  return pointsToSpline
}
