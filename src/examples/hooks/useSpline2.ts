import * as React from "react"

interface Point2 {
  x: number
  y: number
}

// Based on @Javidx9
// https://github.com/OneLoneCoder/videos/blob/master/OneLoneCoder_Splines1.cpp
export function useSpline(points: Point2[], segments = 25, looped = false) {
  const padded = React.useMemo(() => {
    const pts = points.slice()
    pts.unshift(pts[0])
    pts.push(pts[pts.length - 1])
    pts.push(pts[pts.length - 1])
    return pts
  }, [points])

  const getSplinePoint = React.useCallback(
    function getSplinePoint(distance: number, looped: boolean): Point2 {
      let p0: number,
        p1: number,
        p2: number,
        p3: number,
        l = points.length,
        t = Math.trunc(distance)

      if (looped) {
        p1 = t
        p2 = (p1 + 1) % l
        p3 = (p2 + 1) % l
        p0 = p1 >= 1 ? p1 - 1 : l - 1
      } else {
        p1 = t + 1
        p2 = p1 + 1
        p3 = p2 + 1
        p0 = p1 - 1
      }

      t = distance - t

      let tt = t * t,
        ttt = tt * t,
        q1 = -ttt + 2 * tt - t,
        q2 = 3 * ttt - 5 * tt + 2,
        q3 = -3 * ttt + 4 * tt + t,
        q4 = ttt - tt

      return {
        x:
          0.5 *
          (padded[p0].x * q1 +
            padded[p1].x * q2 +
            padded[p2].x * q3 +
            padded[p3].x * q4),
        y:
          0.5 *
          (padded[p0].y * q1 +
            padded[p1].y * q2 +
            padded[p2].y * q3 +
            padded[p3].y * q4)
      }
    },
    [points, looped]
  )

  const getSplineGradient = React.useCallback(
    function getSplineGradient(distance: number, looped: boolean) {
      let p0: number,
        p1: number,
        p2: number,
        p3: number,
        l = points.length,
        t = Math.trunc(distance)

      if (looped) {
        p1 = t
        p2 = (p1 + 1) % l
        p3 = (p2 + 1) % l
        p0 = p1 >= 1 ? p1 - 1 : l - 1
      } else {
        p1 = t + 1
        p2 = p1 + 1
        p3 = p2 + 1
        p0 = p1 - 1
      }

      let tt = t * t,
        q1 = -3 * tt + 4 * t - 1,
        q2 = 9 * tt - 10 * t,
        q3 = -9 * tt + 8 * t + 1,
        q4 = 3 * tt - 2 * t

      return {
        x:
          0.5 *
          (points[p0].x * q1 +
            points[p1].x * q2 +
            points[p2].x * q3 +
            points[p3].x * q4),
        y:
          0.5 *
          (points[p0].y * q1 +
            points[p1].y * q2 +
            points[p2].y * q3 +
            points[p3].y * q4)
      }
    },
    [points, looped]
  )

  const spline = React.useMemo(() => {
    let path: Point2[] = []

    for (let t = 0; t < points.length; t += 1 / segments) {
      path.push(getSplinePoint(t, looped))
    }

    return path
  }, [points, looped, segments])

  const path = React.useMemo(() => {
    let path = new Path2D()

    if (spline.length < 2) {
      return path
    }

    path.moveTo(spline[0].x, spline[0].y)

    for (let point of spline) {
      path.lineTo(point.x, point.y)
      if (looped) {
        path.closePath()
      }
    }

    return path
  }, [spline, looped])

  return { path, spline, getSplineGradient, getSplinePoint }
}
