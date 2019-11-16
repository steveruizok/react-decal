import * as React from "react"
import { useKeys } from "./hooks/useKeys"
import { useAssets, Assets, AssetsDescription } from "./hooks/useAssets"
import { useAnimationFrame } from "./hooks/useAnimationFrame"
import { useResizeObserver } from "./hooks/useResizeObserver"

export type ADC = (data: {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  assets: Assets
  info: Info
}) => any

/**
 * ### Draw Callback
 * Called once when the component first mounts.
 * Important! Return the Decal's initial state.
 */
export type DC<
  S extends any | void = any,
  A extends AssetsDescription = any
> = (data: {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  state: S
  assets: A
  info: Info
}) => S

/**
 * ### Frame Callback
 * Called on each frame.
 */
export type FC<S extends any | void = any, A extends any = any> = (data: {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  state: S
  assets: A
  info: Info
}) => void

/**
 * ### Mouse Event Callback
 * Called on the different mouse events.
 */
export type MC<S extends any = void, A extends any = any> = (data: {
  event: React.MouseEvent<HTMLCanvasElement>
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  state: S
  assets: A
  info: Info
}) => void

/**
 * ### Keyboard Event Callback
 * Called on keyboard events.
 */
export type KC<S extends any = void, A extends any = any> = (data: {
  event: KeyboardEvent
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  state: S
  assets: A
  info: Info
}) => void

/**
 * ### Info
 * Information about the Decal and any current user inputs.
 */
export type Info = {
  size: {
    width: number
    height: number
  }
  center: { x: number; y: number }
  mouse: {
    point: { x: number; y: number }
    delta: { x: number; y: number }
    offset: { x: number; y: number }
    clicked: boolean
    hovered: boolean
  }
  keys: Set<string>
}

type Props<
  D extends DC = DC,
  S = ReturnType<D>,
  A extends AssetsDescription = any
> = {
  height: number
  width: number
  assets?: A
  wipe?: boolean
  draw: D
  onFrame?: FC<S, A>
  onClick?: MC<S, A>
  onMouseMove?: MC<S, A>
  onMouseEnter?: MC<S, A>
  onMouseLeave?: MC<S, A>
  onMouseDown?: MC<S, A>
  onMouseUp?: MC<S, A>
  onKeyPress?: KC<S, A>
  style?: React.CSSProperties
  fps?: number
}

export const Decal: React.FC<Props> = ({
  height,
  width,
  assets = {},
  wipe = true,
  fps,
  draw,
  onFrame,
  onClick,
  onMouseMove,
  onMouseEnter,
  onMouseLeave,
  onMouseDown,
  onMouseUp,
  onKeyPress,
  style
}) => {
  const keyboard = useKeys()
  const rAssetsPromise = useAssets(assets)
  const rAssets = React.useRef<any>()
  const rReady = React.useRef(false)

  React.useEffect(() => {
    const load = async () => {
      rAssets.current = await rAssetsPromise.current
    }

    load()
  }, [assets])

  const [rDecal, cWidth, cHeight] = useResizeObserver<HTMLCanvasElement>(
    width,
    height
  )

  // Information about the Decal / interactions
  const rInfo = React.useRef<Info>({
    size: { width: cWidth, height: cHeight },
    center: { x: cWidth / 2, y: cHeight / 2 },
    mouse: {
      point: { x: cWidth / 2, y: cHeight / 2 },
      delta: { x: 0, y: 0 },
      offset: { x: 0, y: 0 },
      hovered: false,
      clicked: false
    },
    keys: keyboard.keys.current
  })

  // offset(point: { x: number; y: number }) {
  //   return {
  //     x: point.x - this.center.x,
  //     y: point.y - this.center.y
  //   }
  // },
  // normalize(point: { x: number; y: number }) {
  //   return {
  //     x: point.x - this.center.x / this.size.width,
  //     y: point.y - this.center.y / this.size.height
  //   }
  // }

  // Persistent state
  const rState = React.useRef<ReturnType<typeof draw>>({})

  // Initial draw on load
  React.useEffect(() => {
    async function kickoff() {
      const cvs = rDecal.current
      if (cvs) {
        const ctx = cvs.getContext("2d")

        if (ctx) {
          Object.assign(rInfo.current, {
            size: { width: cWidth, height: cHeight },
            center: { x: cWidth / 2, y: cHeight / 2 }
          })

          const asts = await rAssetsPromise.current
          rAssets.current = asts
          Object.assign(
            rState.current,
            draw({
              ctx,
              canvas: cvs,
              state: rState.current,
              assets: asts,
              info: rInfo.current
            })
          )
          rReady.current = true
        }
      }
    }

    kickoff()
  }, [assets, rDecal, draw, cWidth, cHeight])

  // Draw on each animation frame (if onFrame is present)
  const animationOnFrame = React.useCallback(() => {
    if (!rAssets.current) return
    const cvs = rDecal.current
    if (cvs) {
      const ctx = cvs.getContext("2d")
      if (ctx) {
        if (wipe) {
          ctx.save()
          ctx.resetTransform()
          ctx.clearRect(0, 0, width, height)
          ctx.restore()
        }

        rInfo.current.keys = keyboard.keys.current

        onFrame &&
          onFrame({
            ctx,
            canvas: cvs,
            state: rState.current,
            assets: rAssets.current,
            info: rInfo.current
          })
      }
    }
  }, [rAssets, rDecal, wipe, onFrame, height, width, keyboard])

  useAnimationFrame(onFrame ? animationOnFrame : null, fps)

  // Event helpers

  const getKeyboardEvent = React.useCallback(
    (event: KeyboardEvent) => {
      const cvs = rDecal.current
      if (cvs) {
        const ctx = cvs.getContext("2d")
        if (ctx) {
          if (wipe && !onFrame) {
            ctx.save()
            ctx.resetTransform()
            ctx.clearRect(0, 0, width, height)
            ctx.restore()
          }

          rInfo.current.keys = keyboard.keys.current
          return {
            event,
            canvas: cvs,
            ctx,
            state: rState.current,
            assets: rAssets.current,
            info: rInfo.current
          }
        }
      }
    },
    [rState, rAssets, rInfo, rDecal, keyboard.keys]
  )

  const getMousePointEvent = React.useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      const cvs = rDecal.current
      if (cvs) {
        const cvs = rDecal.current
        const ctx = cvs.getContext("2d")
        if (ctx) {
          const { offsetLeft, offsetTop } = cvs

          const prev = rInfo.current.mouse

          if (wipe && !onFrame) {
            ctx.save()
            ctx.resetTransform()
            ctx.clearRect(0, 0, width, height)
            ctx.restore()
          }

          const point = {
            x: event.pageX - offsetLeft,
            y: event.pageY - offsetTop
          }

          const delta = {
            x: point.x - prev.point.x,
            y: point.y - prev.point.y
          }

          rInfo.current.mouse.point = point
          rInfo.current.mouse.delta = delta
          rInfo.current.keys = keyboard.keys.current

          return {
            event,
            canvas: cvs,
            ctx,
            state: rState.current,
            assets: rAssets.current,
            info: rInfo.current
          }
        }
      }
    },
    [rState, rAssets, rInfo, rDecal, keyboard.keys]
  )

  // Events

  const handleClick = React.useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      if (!rReady.current) return

      const args = getMousePointEvent(event)
      if (args) {
        onClick && onClick.call(undefined, args)
      }
    },
    [onClick, getMousePointEvent]
  )

  const handleMouseDown = React.useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      if (!rReady.current) return

      rInfo.current.mouse.clicked = true
      const args = getMousePointEvent(event)
      if (args) {
        onMouseUp && onMouseUp.call(undefined, args)
      }
    },
    [onMouseUp, getMousePointEvent]
  )

  const handleMouseUp = React.useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      if (!rReady.current) return

      rInfo.current.mouse.clicked = false
      const args = getMousePointEvent(event)
      if (args) {
        onMouseDown && onMouseDown.call(undefined, args)
      }
    },
    [onMouseDown, getMousePointEvent]
  )

  const handleMouseMove = React.useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      if (!rReady.current) return

      const args = getMousePointEvent(event)
      if (args) {
        onMouseMove && onMouseMove.call(undefined, args)
      }
    },
    [onMouseMove, getMousePointEvent]
  )

  const handleMouseEnter = React.useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      if (!rReady.current) return

      rInfo.current.mouse.hovered = true
      const args = getMousePointEvent(event)
      if (args) {
        onMouseEnter && onMouseEnter.call(undefined, args)
      }
    },
    [onMouseEnter, getMousePointEvent]
  )

  const handleMouseLeave = React.useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      if (!rReady.current) return

      rInfo.current.mouse.hovered = false
      const args = getMousePointEvent(event)
      if (args) {
        onMouseLeave && onMouseLeave.call(undefined, args)
      }
    },
    [onMouseLeave, getMousePointEvent]
  )

  const handleKeyPress = React.useCallback(
    (event: KeyboardEvent) => {
      if (!rReady.current) return

      const args = getKeyboardEvent(event)
      if (args) {
        onKeyPress && onKeyPress.call(undefined, args)
      }
    },
    [onKeyPress, getKeyboardEvent]
  )

  React.useEffect(() => {
    document.body.addEventListener("keypress", handleKeyPress)
    return () => {
      document.body.removeEventListener("keypress", handleKeyPress)
    }
  }, [onKeyPress])

  return (
    <canvas
      ref={rDecal}
      height={height}
      width={width}
      style={style}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    />
  )
}

export default Decal
