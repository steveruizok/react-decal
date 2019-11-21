// Adapted from:
// https://github.com/gdenisov/cardinal-spline-js.
// I've made this version *less* performant for the sake of readability.

// If you're curious about the math, see:
// https://en.wikipedia.org/wiki/Centripetal_Catmull%E2%80%93Rom_spline

// 1.
// First, let's decide how many extra points we'll put between each point.

export function useSpline(numberOfSegments = 25) {}

const numberOfSegments = 25

// 2.
// Next, we pre-cache our inner-loop calculations. These values are
// consistent, based on the numner of segments. Because we decided
// that number up front, we can solve these problems up front, too.
// When we later call our spline function, we can re-use the results.

const cache = new Float32Array((numberOfSegments + 2) * 4)
cache[0] = 1
let c = 4
for (let i = 1; i < numberOfSegments; i++) {
  let st = i / numberOfSegments,
    st2 = st * st,
    st3 = st2 * st,
    st23 = st3 * 2,
    st32 = st2 * 3
  cache[c++] = st23 - st32 + 1
  cache[c++] = st32 - st23
  cache[c++] = st3 - 2 * st2 + st
  cache[c++] = st3 - st2
}
cache[++c] = 1

// 3.
// Now here's our points-to-spline function.

export function curve(points: { x: number; y: number }[], tension = 0.5) {
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
}
