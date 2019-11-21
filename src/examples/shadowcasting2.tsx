import React from "react"
import Decal, { DC, FC, MC, KC } from "../Decal"

type Point = [number, number]

type Segment = [Point, Point]

interface Rectangle {
  x: number
  y: number
  height: number
  width: number
}

class Visible {
  epsilon = 0.0000001
  segments: Segment[] = []
  viewport: Segment[]
  private _width: number
  private _height: number
  private _map: Rectangle[]

  constructor(map: Rectangle[] = [], width: number, height: number) {
    this.viewport = this.getSegmentsForViewport(width, height)
    this.setMap(map)
    this._map = map
    this._width = width
    this._height = height
  }

  get map() {
    return this._map
  }

  set map(map: Rectangle[]) {
    this.setMap(map)
  }

  setMap(map: Rectangle[]) {
    this.segments = this.getSegmentsFromRectangles(map)
    return this
  }

  getSegmentsForViewport(width: number, height: number): Segment[] {
    const topLeft: Point = [0, 0]
    const topRight: Point = [width, 0]
    const bottomRight: Point = [width, height]
    const bottomLeft: Point = [0, height]
    return [
      [topLeft, topRight],
      [topRight, bottomRight],
      [bottomRight, bottomLeft],
      [bottomLeft, topLeft]
    ]
  }

  getSegmentsFromRectangles(rectangles: Rectangle[]): Segment[] {
    return rectangles.reduce((acc, rectangle) => {
      const { x, y, width, height } = rectangle
      const topLeft: Point = [x, y]
      const topRight: Point = [x + width, y]
      const bottomRight: Point = [x + width, y + height]
      const bottomLeft: Point = [x, y + height]
      acc.push(
        [topLeft, topRight],
        [topRight, bottomRight],
        [bottomRight, bottomLeft],
        [bottomLeft, topLeft]
      )

      return acc
    }, [] as Segment[])
  }

  getVisibilityPolygon(position: Point | { x: number; y: number }) {
    if (!Array.isArray(position)) {
      position = [position.x, position.y]
    }
    return this.computeViewport(
      position,
      this.segments,
      [0, 0],
      [this._width, this._height]
    )
  }

  computeViewport(
    position: Point,
    segments: Segment[],
    viewportMinCorner: Point,
    viewportMaxCorner: Point
  ) {
    var brokenSegments: Segment[] = []
    var viewport: Point[] = [
      [viewportMinCorner[0], viewportMinCorner[1]],
      [viewportMaxCorner[0], viewportMinCorner[1]],
      [viewportMaxCorner[0], viewportMaxCorner[1]],
      [viewportMinCorner[0], viewportMaxCorner[1]]
    ]
    for (var i = 0; i < segments.length; ++i) {
      if (
        segments[i][0][0] < viewportMinCorner[0] &&
        segments[i][1][0] < viewportMinCorner[0]
      )
        continue
      if (
        segments[i][0][1] < viewportMinCorner[1] &&
        segments[i][1][1] < viewportMinCorner[1]
      )
        continue
      if (
        segments[i][0][0] > viewportMaxCorner[0] &&
        segments[i][1][0] > viewportMaxCorner[0]
      )
        continue
      if (
        segments[i][0][1] > viewportMaxCorner[1] &&
        segments[i][1][1] > viewportMaxCorner[1]
      )
        continue
      var intersections: Point[] = []
      for (var j = 0; j < viewport.length; ++j) {
        var k = j + 1
        if (k == viewport.length) k = 0
        if (
          this.doLineSegmentsIntersect(
            segments[i][0][0],
            segments[i][0][1],
            segments[i][1][0],
            segments[i][1][1],
            viewport[j][0],
            viewport[j][1],
            viewport[k][0],
            viewport[k][1]
          )
        ) {
          var intersect = this.intersectLines(
            segments[i][0],
            segments[i][1],
            viewport[j],
            viewport[k]
          )
          if (!intersect) continue
          if (
            this.equal(intersect, segments[i][0]) ||
            this.equal(intersect, segments[i][1])
          )
            continue
          intersections.push(intersect)
        }
      }
      var start: Point = [segments[i][0][0], segments[i][0][1]]
      while (intersections.length > 0) {
        var endIndex = 0
        var endDis = this.distance(start, intersections[0])
        for (var j = 1; j < intersections.length; ++j) {
          var dis = this.distance(start, intersections[j])
          if (dis < endDis) {
            endDis = dis
            endIndex = j
          }
        }
        brokenSegments.push([
          [start[0], start[1]],
          [intersections[endIndex][0], intersections[endIndex][1]]
        ])
        start[0] = intersections[endIndex][0]
        start[1] = intersections[endIndex][1]
        intersections.splice(endIndex, 1)
      }
      brokenSegments.push([start, [segments[i][1][0], segments[i][1][1]]])
    }

    var viewportSegments: Segment[] = []
    for (var i = 0; i < brokenSegments.length; ++i) {
      if (
        this.inViewport(
          brokenSegments[i][0],
          viewportMinCorner,
          viewportMaxCorner
        ) &&
        this.inViewport(
          brokenSegments[i][1],
          viewportMinCorner,
          viewportMaxCorner
        )
      ) {
        viewportSegments.push([
          [brokenSegments[i][0][0], brokenSegments[i][0][1]],
          [brokenSegments[i][1][0], brokenSegments[i][1][1]]
        ])
      }
    }
    var eps = this.epsilon * 10
    viewportSegments.push([
      [viewportMinCorner[0] - eps, viewportMinCorner[1] - eps],
      [viewportMaxCorner[0] + eps, viewportMinCorner[1] - eps]
    ])
    viewportSegments.push([
      [viewportMaxCorner[0] + eps, viewportMinCorner[1] - eps],
      [viewportMaxCorner[0] + eps, viewportMaxCorner[1] + eps]
    ])
    viewportSegments.push([
      [viewportMaxCorner[0] + eps, viewportMaxCorner[1] + eps],
      [viewportMinCorner[0] - eps, viewportMaxCorner[1] + eps]
    ])
    viewportSegments.push([
      [viewportMinCorner[0] - eps, viewportMaxCorner[1] + eps],
      [viewportMinCorner[0] - eps, viewportMinCorner[1] - eps]
    ])
    return this.compute(position, viewportSegments)
  }

  compute(position: Point, segments: Segment[]) {
    var bounded: Segment[] = []
    var minX = position[0]
    var minY = position[1]
    var maxX = position[0]
    var maxY = position[1]
    for (var i = 0; i < segments.length; ++i) {
      for (var j = 0; j < 2; ++j) {
        minX = Math.min(minX, segments[i][j][0])
        minY = Math.min(minY, segments[i][j][1])
        maxX = Math.max(maxX, segments[i][j][0])
        maxY = Math.max(maxY, segments[i][j][1])
      }
      bounded.push([
        [segments[i][0][0], segments[i][0][1]],
        [segments[i][1][0], segments[i][1][1]]
      ])
    }
    --minX
    --minY
    ++maxX
    ++maxY
    bounded.push([
      [minX, minY],
      [maxX, minY]
    ])
    bounded.push([
      [maxX, minY],
      [maxX, maxY]
    ])
    bounded.push([
      [maxX, maxY],
      [minX, maxY]
    ])
    bounded.push([
      [minX, maxY],
      [minX, minY]
    ])

    var polygon: number[][] = []

    var sorted = this.sortPoints(position, bounded)

    var map = new Array(bounded.length).fill(-1)

    var heap: number[] = []

    var start: Point = [position[0] + 1, position[1]]

    for (var i = 0; i < bounded.length; ++i) {
      var a1 = this.angle(bounded[i][0], position)
      var a2 = this.angle(bounded[i][1], position)
      var active = false
      if (a1 > -180 && a1 <= 0 && a2 <= 180 && a2 >= 0 && a2 - a1 > 180)
        active = true
      if (a2 > -180 && a2 <= 0 && a1 <= 180 && a1 >= 0 && a1 - a2 > 180)
        active = true
      if (active) {
        this.insert(i, heap, position, bounded, start, map)
      }
    }

    for (var i = 0; i < sorted.length; ) {
      var extend = false
      var shorten = false
      var orig = i
      var vertex = bounded[sorted[i][0]][sorted[i][1]]
      var old_segment = heap[0]
      do {
        if (map[sorted[i][0]] != -1) {
          if (sorted[i][0] == old_segment) {
            extend = true
            vertex = bounded[sorted[i][0]][sorted[i][1]]
          }
          this.remove(map[sorted[i][0]], heap, position, bounded, vertex, map)
        } else {
          this.insert(sorted[i][0], heap, position, bounded, vertex, map)
          if (heap[0] != old_segment) {
            shorten = true
          }
        }
        ++i
        if (i == sorted.length) break
      } while (sorted[i][2] < sorted[orig][2] + this.epsilon)

      if (extend) {
        polygon.push(vertex)
        var cur = this.intersectLines(
          bounded[heap[0]][0],
          bounded[heap[0]][1],
          position,
          vertex
        )
        if (cur && !this.equal(cur, vertex)) {
          polygon.push(cur)
        }
      } else if (shorten) {
        const i1 = this.intersectLines(
          bounded[old_segment][0],
          bounded[old_segment][1],
          position,
          vertex
        )
        if (i1) {
          polygon.push(i1)
        }
        const i2 = this.intersectLines(
          bounded[heap[0]][0],
          bounded[heap[0]][1],
          position,
          vertex
        )
        if (i2) {
          polygon.push(i2)
        }
      }
    }
    return polygon
  }

  inViewport(
    position: Point,
    viewportMinCorner: Point,
    viewportMaxCorner: Point
  ) {
    if (position[0] < viewportMinCorner[0] - this.epsilon) return false
    if (position[1] < viewportMinCorner[1] - this.epsilon) return false
    if (position[0] > viewportMaxCorner[0] + this.epsilon) return false
    if (position[1] > viewportMaxCorner[1] + this.epsilon) return false
    return true
  }

  inPolygon(position: Point, polygon: Point[]) {
    var val = polygon[0][0]

    for (var i = 0; i < polygon.length; ++i) {
      val = Math.min(polygon[i][0], val)
      val = Math.min(polygon[i][1], val)
    }
    var edge: Point = [val - 1, val - 1]
    var parity = 0

    for (var i = 0; i < polygon.length; ++i) {
      var j = i + 1
      if (j == polygon.length) j = 0
      if (
        this.doLineSegmentsIntersect(
          edge[0],
          edge[1],
          position[0],
          position[1],
          polygon[i][0],
          polygon[i][1],
          polygon[j][0],
          polygon[j][1]
        )
      ) {
        var intersect = this.intersectLines(
          edge,
          position,
          polygon[i],
          polygon[j]
        )
        if (!intersect) {
          ++parity
        } else {
          if (this.equal(position, intersect)) return true
          if (this.equal(intersect, polygon[i])) {
            if (this.angle2(position, edge, polygon[j]) < 180) ++parity
          } else if (this.equal(intersect, polygon[j])) {
            if (this.angle2(position, edge, polygon[i]) < 180) ++parity
          } else {
            ++parity
          }
        }
      }
    }
    return parity % 2 != 0
  }

  convertToSegments(polygons: Segment[]) {
    var segments: Segment[] = []
    for (var i = 0; i < polygons.length; ++i) {
      for (var j = 0; j < polygons[i].length; ++j) {
        var k = j + 1
        if (k == polygons[i].length) k = 0
        segments.push([
          [polygons[i][j][0], polygons[i][j][1]],
          [polygons[i][k][0], polygons[i][k][1]]
        ])
      }
    }
    return segments
  }

  breakIntersections(segments: Segment[]) {
    var output = []
    for (var i = 0; i < segments.length; ++i) {
      var intersections = []
      for (var j = 0; j < segments.length; ++j) {
        if (i == j) continue
        if (
          this.doLineSegmentsIntersect(
            segments[i][0][0],
            segments[i][0][1],
            segments[i][1][0],
            segments[i][1][1],
            segments[j][0][0],
            segments[j][0][1],
            segments[j][1][0],
            segments[j][1][1]
          )
        ) {
          var intersect = this.intersectLines(
            segments[i][0],
            segments[i][1],
            segments[j][0],
            segments[j][1]
          )
          if (!intersect) continue
          if (
            this.equal(intersect, segments[i][0]) ||
            this.equal(intersect, segments[i][1])
          )
            continue
          intersections.push(intersect)
        }
      }
      var start: Point = [segments[i][0][0], segments[i][0][1]]
      while (intersections.length > 0) {
        var endIndex = 0
        var endDis = this.distance(start, intersections[0])
        for (var j = 1; j < intersections.length; ++j) {
          var dis = this.distance(start, intersections[j])
          if (dis < endDis) {
            endDis = dis
            endIndex = j
          }
        }
        output.push([
          [start[0], start[1]],
          [intersections[endIndex][0], intersections[endIndex][1]]
        ])
        start[0] = intersections[endIndex][0]
        start[1] = intersections[endIndex][1]
        intersections.splice(endIndex, 1)
      }
      output.push([start, [segments[i][1][0], segments[i][1][1]]])
    }
    return output
  }

  equal(a: Point, b: Point) {
    if (
      Math.abs(a[0] - b[0]) < this.epsilon &&
      Math.abs(a[1] - b[1]) < this.epsilon
    )
      return true
    return false
  }

  remove(
    index: number,
    heap: any,
    position: Point,
    segments: Segment[],
    destination: Point,
    map: any
  ) {
    map[heap[index]] = -1
    if (index == heap.length - 1) {
      heap.pop()
      return
    }
    heap[index] = heap.pop()
    map[heap[index]] = index
    var cur = index
    var parent = this.parent(cur)
    if (
      cur != 0 &&
      this.lessThan(heap[cur], heap[parent], position, segments, destination)
    ) {
      while (cur > 0) {
        var parent = this.parent(cur)
        if (
          !this.lessThan(
            heap[cur],
            heap[parent],
            position,
            segments,
            destination
          )
        ) {
          break
        }
        map[heap[parent]] = cur
        map[heap[cur]] = parent
        var temp = heap[cur]
        heap[cur] = heap[parent]
        heap[parent] = temp
        cur = parent
      }
    } else {
      while (true) {
        var left = this.child(cur)
        var right = left + 1
        if (
          left < heap.length &&
          this.lessThan(
            heap[left],
            heap[cur],
            position,
            segments,
            destination
          ) &&
          (right == heap.length ||
            this.lessThan(
              heap[left],
              heap[right],
              position,
              segments,
              destination
            ))
        ) {
          map[heap[left]] = cur
          map[heap[cur]] = left
          var temp = heap[left]
          heap[left] = heap[cur]
          heap[cur] = temp
          cur = left
        } else if (
          right < heap.length &&
          this.lessThan(heap[right], heap[cur], position, segments, destination)
        ) {
          map[heap[right]] = cur
          map[heap[cur]] = right
          var temp = heap[right]
          heap[right] = heap[cur]
          heap[cur] = temp
          cur = right
        } else break
      }
    }
  }

  insert(
    index: number,
    heap: any,
    position: Point,
    segments: Segment[],
    destination: Point,
    map: any
  ) {
    var intersect = this.intersectLines(
      segments[index][0],
      segments[index][1],
      position,
      destination
    )
    if (!intersect) return

    var cur = heap.length
    heap.push(index)
    map[index] = cur

    while (cur > 0) {
      var parent = this.parent(cur)
      if (
        !this.lessThan(heap[cur], heap[parent], position, segments, destination)
      ) {
        break
      }
      map[heap[parent]] = cur
      map[heap[cur]] = parent
      var temp = heap[cur]
      heap[cur] = heap[parent]
      heap[parent] = temp
      cur = parent
    }
  }

  lessThan(
    index1: number,
    index2: number,
    position: Point,
    segments: Segment[],
    destination: Point
  ) {
    var inter1 = this.intersectLines(
      segments[index1][0],
      segments[index1][1],
      position,
      destination
    )
    var inter2 = this.intersectLines(
      segments[index2][0],
      segments[index2][1],
      position,
      destination
    )
    if (!inter1 || !inter2) {
      return true
    } else {
      if (!this.equal(inter1, inter2)) {
        var d1 = this.distance(inter1, position)
        var d2 = this.distance(inter2, position)
        return d1 < d2
      }
      var end1 = 0
      var end2 = 0
      if (this.equal(inter1, segments[index1][0])) end1 = 1
      if (this.equal(inter2, segments[index2][0])) end2 = 1
      var a1 = this.angle2(segments[index1][end1], inter1, position)
      var a2 = this.angle2(segments[index2][end2], inter2, position)
      if (a1 < 180) {
        if (a2 > 180) return true
        return a2 < a1
      }
      return a1 < a2
    }
  }

  parent(index: number) {
    return Math.floor((index - 1) / 2)
  }

  child(index: number) {
    return 2 * index + 1
  }

  angle2(a: Point, b: Point, c: Point) {
    var a1 = this.angle(a, b)
    var a2 = this.angle(b, c)
    var a3 = a1 - a2
    if (a3 < 0) a3 += 360
    if (a3 > 360) a3 -= 360
    return a3
  }

  sortPoints(position: Point, segments: Segment[]) {
    var points = new Array(segments.length * 2)
    for (var i = 0; i < segments.length; ++i) {
      for (var j = 0; j < 2; ++j) {
        var a = this.angle(segments[i][j], position)
        points[2 * i + j] = [i, j, a]
      }
    }
    points.sort(function(a, b) {
      return a[2] - b[2]
    })
    return points
  }

  angle(a: Point, b: Point) {
    return (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI
  }

  intersectLines(
    a1: Point,
    a2: Point,
    b1: Point,
    b2: Point
  ): Point | undefined {
    var dbx = b2[0] - b1[0]
    var dby = b2[1] - b1[1]
    var dax = a2[0] - a1[0]
    var day = a2[1] - a1[1]

    var u_b = dby * dax - dbx * day
    if (u_b != 0) {
      var ua = (dbx * (a1[1] - b1[1]) - dby * (a1[0] - b1[0])) / u_b
      return [a1[0] - ua * -dax, a1[1] - ua * -day]
    }
  }

  distance(a: Point, b: Point) {
    var dx = a[0] - b[0]
    var dy = a[1] - b[1]
    return dx * dx + dy * dy
  }

  isOnSegment(
    xi: number,
    yi: number,
    xj: number,
    yj: number,
    xk: number,
    yk: number
  ) {
    return (
      (xi <= xk || xj <= xk) &&
      (xk <= xi || xk <= xj) &&
      (yi <= yk || yj <= yk) &&
      (yk <= yi || yk <= yj)
    )
  }

  computeDirection(
    xi: number,
    yi: number,
    xj: number,
    yj: number,
    xk: number,
    yk: number
  ) {
    const a = (xk - xi) * (yj - yi)
    const b = (xj - xi) * (yk - yi)
    return a < b ? -1 : a > b ? 1 : 0
  }

  doLineSegmentsIntersect(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    x3: number,
    y3: number,
    x4: number,
    y4: number
  ) {
    const d1 = this.computeDirection(x3, y3, x4, y4, x1, y1)
    const d2 = this.computeDirection(x3, y3, x4, y4, x2, y2)
    const d3 = this.computeDirection(x1, y1, x2, y2, x3, y3)
    const d4 = this.computeDirection(x1, y1, x2, y2, x4, y4)
    return (
      (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
        ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) ||
      (d1 == 0 && this.isOnSegment(x3, y3, x4, y4, x1, y1)) ||
      (d2 == 0 && this.isOnSegment(x3, y3, x4, y4, x2, y2)) ||
      (d3 == 0 && this.isOnSegment(x1, y1, x2, y2, x3, y3)) ||
      (d4 == 0 && this.isOnSegment(x1, y1, x2, y2, x4, y4))
    )
  }
}

type S = {
  map: Rectangle[]
  visible: Visible
}

const draw: DC = ({ ctx, info }) => {
  const map: Rectangle[] = []

  map.push(
    { x: 20, y: 20, height: 20, width: 20 },
    { x: 100, y: 220, height: 20, width: 20 },
    { x: 200, y: 160, height: 80, width: 20 },
    { x: 205, y: 165, height: 10, width: 10 }
  )

  const visible = new Visible(map, 640, 480)

  const visiblePolygon = visible.getVisibilityPolygon(info.center)

  ctx.beginPath()
  for (let [x, y] of visiblePolygon) {
    ctx.lineTo(x, y)
  }
  ctx.closePath()
  ctx.stroke()

  return {
    map,
    visible
  }
}

const onFrame: FC<S> = ({ ctx, state, info }) => {}

const onClick: MC<S> = ({ event, state, assets, info }) => {}

const onMouseMove: MC<S> = ({ event, ctx, state, assets, info }) => {
  const visiblePolygon = state.visible.getVisibilityPolygon(info.mouse.point)

  ctx.beginPath()
  for (let [x, y] of visiblePolygon) {
    ctx.lineTo(x, y)
  }
  ctx.closePath()
  ctx.stroke()
}

const onMouseEnter: MC<S> = ({ event, state, assets, info }) => {}

const onMouseLeave: MC<S> = ({ event, state, assets, info }) => {}

const onKeyPress: KC<S> = ({ event, state, assets, info }) => {}

const Template: React.FC = props => {
  return (
    <Decal
      height={320}
      width={480}
      draw={draw}
      // onFrame={onFrame}
      // onClick={onClick}
      onMouseMove={onMouseMove}
      // onMouseLeave={onMouseLeave}
      // onMouseEnter={onMouseEnter}
      // onKeyPress={onKeyPress}
      wipe={true}
    />
  )
}

export default Template
