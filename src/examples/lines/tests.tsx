// function getConnectionBetweenBoxes(a: Box, b: Box): Path2D {
//   const xr = getRangeRelation(a.frame.x, a.frame.maxX, b.frame.x, b.frame.maxX)
//   const yr = getRangeRelation(a.frame.y, a.frame.maxY, b.frame.y, b.frame.maxY)

//   console.log(
//     `
//     a = selected
//     b = hovered
//     x axis: ${xr}
//     y axis: ${yr},
//     `
//   )

//   let path = new Path2D()

//   const ap = a.points
//   const bp = b.points

//   function test(x: Relation, y: Relation) {
//     return xr === x && yr === y
//   }

//   /* --------------------- X ALIGN -------------------- */
//   if (test("a aligns b", "a aligns b")) {
//     // center / center
//     // u shape?
//   } else if (test("a aligns b", "a before b")) {
//     // center / above
//     drawLine(path, ap.bottom, bp.top)
//   } else if (test("a aligns b", "a after b")) {
//     // center / below
//     drawLine(path, ap.top, bp.bottom)
//   } else if (test("a aligns b", "a aligns b end")) {
//     // arrow right, up, and then left
//     drawLine(path, ap.right, ap.pushed.right, bp.pushed.right, bp.right)
//   } else if (test("a aligns b", "a aligns b start")) {
//     // arrow left, down, and then right
//     drawLine(path, ap.left, ap.pushed.left, bp.pushed.left, bp.left)
//   }

//   /* ------------------ X TOUCH ------------------ */
//   if (test("a aligns b end", "a aligns b")) {
//     // arrow up, left, and then down
//     drawLine(path, ap.top, ap.pushed.top, bp.pushed.top, bp.top)
//   } else if (test("a aligns b start", "a aligns b")) {
//     // arrow down, right, and then up
//     drawLine(path, ap.bottom, ap.pushed.bottom, bp.pushed.bottom, bp.bottom)
//   } else if (
//     test("a aligns b end", "a before b") ||
//     test("a aligns b end", "a aligns b start")
//   ) {
//     // arrow right and down
//     drawLine(path, ap.left, { x: bp.top.x, y: ap.left.y }, bp.top)
//   } else if (
//     test("a aligns b end", "a after b") ||
//     test("a aligns b end", "a aligns b end")
//   ) {
//     // arrow right and up
//     drawLine(path, ap.left, { x: bp.bottom.x, y: ap.right.y }, bp.bottom)
//   } else if (
//     test("a aligns b start", "a before b") ||
//     test("a aligns b start", "a aligns b start")
//   ) {
//     // arrow right and down
//     drawLine(path, ap.right, { x: bp.top.x, y: ap.right.y }, bp.top)
//   } else if (
//     test("a aligns b start", "a after b") ||
//     test("a aligns b start", "a aligns b end")
//   ) {
//     // arrow right and up
//     drawLine(path, ap.right, { x: bp.bottom.x, y: ap.right.y }, bp.bottom)
//   }

//   /* ------------------- X CONTAINED ------------------ */

//   if (test("a contained by b", "a before b")) {
//     // straight down with a midx
//     drawLine(path, ap.bottom, { x: ap.bottom.x, y: bp.top.y })
//   } else if (test("a contained by b", "a after b")) {
//     // straight up with a midx
//     drawLine(path, ap.top, { x: ap.top.x, y: bp.bottom.y })
//   } else if (test("a contained by b", "a aligns b start")) {
//     // up, right, down, left
//     drawLine(
//       path,
//       ap.right,
//       { x: bp.pushed.right.x, y: ap.right.y },
//       bp.pushed.right,
//       bp.right
//     )
//   } else if (test("a contained by b", "a overlaps b start")) {
//     // up, right, down, left
//     drawLine(
//       path,
//       ap.top,
//       ap.pushed.top,
//       { x: bp.pushed.right.x, y: ap.pushed.top.y },
//       bp.pushed.right,
//       bp.right
//     )
//   }

//   /* ------------------- X CONTAINS ------------------- */
//   if (
//     test("a contains b", "a after b") ||
//     test("a contains b aligns start", "a after b") ||
//     test("a contains b aligns start", "a aligns b end") ||
//     test("a contains b aligns end", "a after b") ||
//     test("a contains b aligns end", "a aligns b end")
//   ) {
//     // contains x and is belowish but does not overlap
//     // straight up in line with b mid
//     drawLine(path, { x: bp.bottom.x, y: ap.top.y }, bp.bottom)
//   } else if (
//     test("a contains b", "a before b") ||
//     test("a contains b aligns start", "a before b") ||
//     test("a contains b aligns start", "a aligns b start") ||
//     test("a contains b aligns end", "a before b") ||
//     test("a contains b aligns end", "a aligns b start")
//   ) {
//     // contains x and is aboveish but does not overlap
//     // straight down in line with b mid
//     drawLine(path, { x: bp.top.x, y: ap.bottom.y }, bp.top)
//   } else if (
//     test("a contains b", "a overlaps b start") ||
//     test("a contains b", "a aligns b start")
//   ) {
//     // left, down, right ?
//     drawLine(
//       path,
//       ap.left,
//       ap.pushed.left,
//       { x: ap.pushed.left.x, y: bp.left.y },
//       bp.left
//     )
//   } else if (
//     test("a contains b", "a overlaps b end") ||
//     test("a contains b", "a aligns b end")
//   ) {
//     drawLine(
//       path,
//       ap.left,
//       ap.pushed.left,
//       { x: ap.pushed.left.x, y: bp.left.y },
//       bp.left
//     )
//   } else if (
//     test("a contains b aligns start", "a overlaps b end") ||
//     test("a contains b aligns end", "a overlaps b end")
//   ) {
//     // left, down, right
//     drawLine(
//       path,
//       ap.left,
//       ap.pushed.left,
//       { x: ap.pushed.left.x, y: bp.left.y },
//       bp.left
//     )
//   } else if (
//     test("a contains b aligns end", "a before b") ||
//     test("a contains b aligns end", "a aligns b start") ||
//     test("a contains b aligns end", "a overlaps b start")
//   ) {
//     drawLine(
//       path,
//       ap.left,
//       ap.pushed.left,
//       { x: ap.pushed.left.x, y: bp.left.y },
//       bp.left
//     )
//   }

//   /* ------------------- Y CONTAINS ------------------- */
//   if (
//     test("a after b", "a contains b") ||
//     test("a after b", "a contains b aligns end") ||
//     test("a after b", "a contains b aligns start") ||
//     test("a aligns b end", "a contains b") ||
//     test("a aligns b end", "a contains b aligns end") ||
//     test("a aligns b end", "a contains b aligns start") ||
//     test("a overlaps b end", "a contains b") ||
//     test("a overlaps b end", "a contains b aligns end") ||
//     test("a overlaps b end", "a contains b aligns start")
//   ) {
//     // Contains on y and is rightish of
//     // straight left in line with b center
//     drawLine(path, { x: ap.left.x, y: bp.right.y }, bp.right)
//   } else if (
//     test("a before b", "a contains b") ||
//     test("a before b", "a contains b aligns end") ||
//     test("a before b", "a contains b aligns start") ||
//     test("a aligns b start", "a contains b") ||
//     test("a aligns b start", "a contains b aligns end") ||
//     test("a aligns b start", "a contains b aligns start") ||
//     test("a overlaps b start", "a contains b") ||
//     test("a overlaps b start", "a contains b aligns end") ||
//     test("a overlaps b start", "a contains b aligns start")
//   ) {
//     // Contains on y and is leftish of
//     // straight right in line with b center
//     drawLine(path, { x: ap.right.x, y: bp.left.y }, bp.left)
//   } else if (
//     test("a before b", "a overlaps b end") ||
//     test("a after b", "a overlaps b end")
//   ) {
//     // down, over, up
//     drawLine(
//       path,
//       ap.bottom,
//       ap.pushed.bottom,
//       { x: bp.bottom.x, y: ap.pushed.bottom.y },
//       bp.bottom
//     )
//   } else if (
//     test("a before b", "a overlaps b start") ||
//     test("a after b", "a overlaps b start")
//   ) {
//     // up, over, down
//     drawLine(
//       path,
//       ap.top,
//       ap.pushed.top,
//       { x: bp.top.x, y: ap.pushed.top.y },
//       bp.top
//     )
//   }

//   /* --------------------- X OVERLAPS -------------------- */
//   if (
//     test("a overlaps b start", "a aligns b") ||
//     test("a overlaps b start", "a after b") ||
//     test("a overlaps b start", "a before b") ||
//     test("a overlaps b start", "a overlaps b end") ||
//     test("a overlaps b start", "a overlaps b start")
//   ) {
//     // left, up, right
//     drawLine(
//       path,
//       ap.left,
//       ap.pushed.left,
//       { x: Math.min(ap.pushed.left.x, bp.pushed.left.x), y: bp.left.y },
//       bp.left
//     )
//   } else if (
//     test("a overlaps b end", "a aligns b") ||
//     test("a overlaps b end", "a after b") ||
//     test("a overlaps b end", "a before b") ||
//     test("a overlaps b end", "a overlaps b end") ||
//     test("a overlaps b end", "a overlaps b start")
//   ) {
//     // right, down, left
//     drawLine(
//       path,
//       ap.right,
//       ap.pushed.right,
//       { x: Math.max(ap.pushed.right.x, bp.pushed.right.x), y: bp.right.y },
//       bp.right
//     )
//   }

//   /* --------------------- X LEFT --------------------- */
//   if (
//     test("a before b", "a aligns b") ||
//     test("a before b", "a contained by b") ||
//     test("a before b", "a contained by b aligns start") ||
//     test("a before b", "a contained by b aligns end")
//   ) {
//     // straight right, in line with a midY
//     drawLine(path, ap.right, { x: bp.left.x, y: ap.right.y })
//   } else if (
//     test("a before b", "a before b") ||
//     test("a before b", "a aligns b start")
//   ) {
//     // down and left
//     drawLine(path, ap.bottom, { x: ap.bottom.x, y: bp.left.y }, bp.left)
//   } else if (
//     test("a before b", "a after b") ||
//     test("a before b", "a aligns b end")
//   ) {
//     // up and left
//     drawLine(path, ap.top, { x: ap.top.x, y: bp.left.y }, bp.left)
//   }

//   /* -------------------- X RIGHT ------------------- */
//   if (
//     test("a after b", "a aligns b") ||
//     test("a after b", "a contained by b") ||
//     test("a after b", "a contained by b aligns start") ||
//     test("a after b", "a contained by b aligns end")
//   ) {
//     // straight left in line with a center
//     drawLine(path, ap.left, { x: bp.right.x, y: ap.left.y })
//   } else if (
//     test("a after b", "a before b") ||
//     test("a after b", "a aligns b start")
//   ) {
//     // down and right
//     drawLine(path, ap.bottom, { x: ap.bottom.x, y: bp.right.y }, bp.right)
//     // l shape
//   } else if (
//     test("a after b", "a after b") ||
//     test("a after b", "a aligns b end")
//   ) {
//     // up and right
//     drawLine(path, ap.top, { x: ap.top.x, y: bp.right.y }, bp.right)
//   }

//   return path
// }
