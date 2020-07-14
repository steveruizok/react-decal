import React, { useCallback } from "react"
import Decal, { DC, FC, MC, KC } from "../../Decal"
import { getSpline } from "./spline"
import { Frame2d } from "../../utils"
import { Painter } from "./painter"

type S = {
  painter: Painter
  reference: Frame2d
  frames: Frame2d[]
  selected?: Frame2d
  hovered?: Frame2d
  arrow?: Path2D
  arc?: Path2D
}

const Lines: React.FC = props => {
  const draw = useCallback<DC<S>>(({ ctx, assets, info }) => {
    ctx.lineWidth = 2
    ctx.globalAlpha = 1

    // const boxes = getBoxesInGrid(info.size.width, info.size.height)
    const frames = [
      // new Frame2d(64, 32, 64, 128),
      new Frame2d(100, 200, 64, 64)
      // new Frame2d(0, 200, 128, 64)
    ]

    const reference = new Frame2d(200, 128, 64, 64)

    for (let box of frames) {
      ctx.stroke(box.path)
    }

    const selected = frames[0]

    const painter = new Painter(ctx)

    painter.paintBackground()
    painter.paintFrames(frames, "Blue")
    painter.paintFrame(reference, "Red")

    if (selected && reference) {
      painter.paintArrowBetweenFrames(reference, selected)
    }

    return {
      painter,
      arc: undefined,
      arrow: undefined,
      reference,
      frames,
      selected,
      hovered: undefined
    }
  }, [])

  // // Draw spline from points on each frame
  const onFrame = useCallback<FC<S>>(({ ctx, state, assets, info }) => {
    const { arrow, painter, arc, reference, frames, hovered, selected } = state
    painter.paintBackground()
    painter.paintFrames(frames, "Blue")
    painter.paintFrame(reference, "Red")

    if (selected && reference) {
      painter.paintArrowBetweenFrames(reference, selected)
    }
  }, [])

  // // Add mouse point to points every (3) frames
  const onMouseMove = useCallback<MC<S>>(
    ({ ctx, event, state, assets, info }) => {
      const { x, y } = info.mouse.point
      const hovered = state.frames.find(
        frame =>
          frame !== state.selected &&
          ctx.isPointInPath(frame.path, x, y, undefined)
      )

      state.hovered = hovered

      if (state.selected && info.mouse.clicked) {
        state.selected.offset(info.mouse.delta.x, info.mouse.delta.y)
      }

      const { painter, selected, frames, reference } = state
      painter.paintBackground()
      painter.paintFrames(frames, "Blue")
      painter.paintFrame(reference, "Red")

      if (selected && reference) {
        painter.paintArrowBetweenFrames(reference, selected)
      }
    },
    []
  )

  const onMouseDown = useCallback<MC<S>>(
    ({ ctx, event, state, assets, info }) => {
      const { x, y } = info.mouse.point
      const clicked = state.frames.find(({ path }) =>
        ctx.isPointInPath(path, x, y, undefined)
      )

      if (clicked) {
        state.selected = clicked
      }
    },
    []
  )

  return (
    <Decal
      height={320}
      width={480}
      draw={draw}
      // onFrame={onFrame}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      // fps={8}

      wipe={true}
    />
  )
}

export default Lines

const GAP = 64
const BOX_SIZE = 32

function getBoxesInGrid(width: number, height: number) {
  let boxes: Frame2d[] = []

  for (let i = 0; i < 12; i++) {
    for (let j = 0; j < 12; j++) {
      const w = BOX_SIZE
      const h = BOX_SIZE
      const x = i * BOX_SIZE
      const y = j * BOX_SIZE

      boxes.push(new Frame2d(x, y, w, h))
    }
  }

  return boxes
}

function getRandomBoxes(width: number, height: number) {
  let boxes: Frame2d[] = []

  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 2; j++) {
      const w = BOX_SIZE * Math.floor(Math.random() * 5 + 1)
      const h = BOX_SIZE * Math.floor(Math.random() * 5 + 1)
      const x = (i + Math.floor(Math.random() * 20) * BOX_SIZE) / 2
      const y = (j + Math.floor(Math.random() * 15) * BOX_SIZE) / 2

      boxes.push(new Frame2d(x, y, w, h))
    }
  }

  return boxes
}
