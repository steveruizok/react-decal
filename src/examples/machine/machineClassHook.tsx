import React, { useCallback } from "react"
import Decal, { DC, FC, MC, KC } from "../../Decal"
import { useMachine } from "../hooks/useMachine2"

type Point = {
  x: number
  y: number
}

type Mark = {
  origin: Point
  path: Path2D
  color: string
  lineWidth: number
}

type Data = {
  backgroundColor: string
  lineWidth: number
  color: string
  currentMark?: Mark
  marks: Mark[]
  redos: Mark[]
  colors: string[]
  lineWidths: number[]
}

const MachineExample: React.FC = props => {
  const [current, data, send, { isIn, can }] = useMachine<Data>(
    {
      data: {
        backgroundColor: "#FFF",
        lineWidth: 4,
        color: "#000",
        currentMark: undefined,
        marks: [],
        redos: [],
        colors: [
          "#19002b",
          "#3e1973",
          "#5f0073",
          "#894cff",
          "#7c54ff",
          "#b31fff",
          "#ea00ff",
          "#437eff",
          "#8fb1fe",
          "#c6d7ff"
        ],
        lineWidths: [2, 4, 8, 16, 32, 64]
      },
      on: {
        SELECT_PEN: {
          to: "pen"
        },
        SELECT_ERASER: {
          to: "eraser"
        },
        SELECT_LINE: {
          to: "line"
        },
        SELECT_RECT: {
          to: "rect"
        },
        SELECT_ELLIPSE: {
          to: "ellipse"
        },
        SET_LINE_WIDTH: {
          do: "setLineWidth"
        },
        SET_COLOR: {
          do: "setColor"
        },
        UNDO: {
          do: "undo",
          if: "hasMarks"
        },
        REDO: {
          do: "redo",
          if: "hasRedos"
        },
        CLEAR_CANVAS: {
          do: ["clearCanvas", "clearRedos"],
          if: "hasMarks"
        }
      },
      initial: "pen",
      states: {
        pen: {
          initial: "selecting",
          states: {
            selecting: {
              on: {
                START_MARK: {
                  to: "drawing"
                }
              }
            },
            drawing: {
              onEnter: { do: ["createMark", "clearRedos"] },
              onExit: { do: "completeMark", if: "hasCurrentMark" },
              on: {
                UPDATE_MARK: {
                  do: "extendMark"
                },
                END_MARK: {
                  to: "selecting"
                }
              }
            }
          }
        },
        eraser: {
          initial: "selecting",
          states: {
            selecting: {
              on: {
                START_MARK: {
                  to: "drawing"
                }
              }
            },
            drawing: {
              onEnter: { do: ["createMark", "clearRedos", "setEraserColor"] },
              onExit: { do: "completeMark", if: "hasCurrentMark" },
              on: {
                UPDATE_MARK: {
                  do: "extendMark"
                },
                END_MARK: {
                  to: "selecting"
                }
              }
            }
          }
        },
        line: {
          initial: "selecting",
          states: {
            selecting: {
              on: {
                START_MARK: {
                  to: "drawing"
                }
              }
            },
            drawing: {
              onEnter: { do: ["createMark", "clearRedos"] },
              onExit: { do: "completeMark", if: "hasCurrentMark" },
              on: {
                UPDATE_MARK: {
                  do: "lineTo"
                },
                END_MARK: {
                  to: "selecting"
                }
              }
            }
          }
        },
        rect: {
          initial: "selecting",
          states: {
            selecting: {
              on: {
                START_MARK: {
                  to: "drawing"
                }
              }
            },
            drawing: {
              onEnter: { do: ["createMark", "clearRedos"] },
              onExit: { do: "completeMark", if: "hasCurrentMark" },
              on: {
                UPDATE_MARK: {
                  do: "rectTo"
                },
                END_MARK: {
                  to: "selecting"
                }
              }
            }
          }
        },
        ellipse: {
          initial: "selecting",
          states: {
            selecting: {
              on: {
                START_MARK: {
                  to: "drawing"
                }
              }
            },
            drawing: {
              onEnter: { do: ["createMark", "clearRedos"] },
              onExit: { do: "completeMark", if: "hasCurrentMark" },
              on: {
                UPDATE_MARK: {
                  do: "circleTo"
                },
                END_MARK: {
                  to: "selecting"
                }
              }
            }
          }
        }
      },
      actions: {
        // Sets the line width
        setLineWidth: (data, { lineWidth }) => {
          data.lineWidth = lineWidth
        },
        // Sets the current color to the background color
        setEraserColor: data => {
          if (data.currentMark === undefined) return
          data.currentMark.color = data.backgroundColor
        },
        // Sets the color for the next current mark
        setColor: (data, { color }) => {
          data.color = color
        },
        // Create a new current mark
        createMark: (data, { point }) => {
          const path = new Path2D()
          path.moveTo(point.x, point.y)

          data.currentMark = {
            lineWidth: data.lineWidth,
            color: data.color,
            path,
            origin: point
          }
        },
        // Adds the current point to the current mark
        extendMark: ({ currentMark }, { point }) => {
          if (currentMark === undefined) return
          currentMark.path.lineTo(point.x, point.y)
        },
        // Completes a currentMark and pushes it to the marks array
        completeMark: data => {
          if (data.currentMark === undefined) return
          data.marks.push({ ...data.currentMark })
          data.currentMark = undefined
        },
        // Draws a line from the mark's origin
        lineTo: (data, { point }) => {
          if (data.currentMark === undefined) return
          const path = new Path2D()
          path.moveTo(data.currentMark.origin.x, data.currentMark.origin.y)
          path.lineTo(point.x, point.y)
          data.currentMark.path = path
        },
        // Draws a rectangle from the mark's origin
        rectTo: ({ currentMark }, { point }) => {
          if (currentMark === undefined) return
          const path = new Path2D()
          const { origin } = currentMark
          path.rect(origin.x, origin.y, point.x - origin.x, point.y - origin.y)
          currentMark.path = path
        },
        // Draws a circle from the mark's origin
        circleTo: ({ currentMark }, { point }) => {
          if (currentMark === undefined) return
          const path = new Path2D()
          const { origin } = currentMark
          const ox = point.x - origin.x
          const oy = point.y - origin.y
          path.ellipse(
            origin.x + ox / 2,
            origin.y + oy / 2,
            Math.abs(ox) / 2,
            Math.abs(oy) / 2,
            0,
            0,
            Math.PI * 2
          )
          currentMark.path = path
        },
        // Undoes the most recent mark
        undo: data => {
          const undo = data.marks.pop()
          if (undo !== undefined) data.redos.push(undo)
        },
        // Redoes the most recent undo
        redo: data => {
          const redo = data.redos.pop()
          if (redo !== undefined) data.marks.push(redo)
        },
        // Clears any current redos
        clearRedos: data => {
          data.redos = []
        },
        // Clears all marks on the canvas
        clearCanvas: data => {
          data.marks = []
        }
      },
      conditions: {
        // Only if the machine has 1 or more marks
        hasMarks: ({ marks }) => marks.length > 0,
        // Only if the machine has 1 or more redos
        hasRedos: ({ redos }) => redos.length > 0,
        // Only if the machine has a current mark
        hasCurrentMark: ({ currentMark }) => currentMark !== undefined
      }
    },
    false
  )

  const draw: DC = ({ ctx, info }) => {
    ctx.lineCap = "round"
    ctx.lineJoin = "round"

    for (let mark of data.marks) {
      ctx.lineWidth = mark.lineWidth
      ctx.strokeStyle = mark.color
      ctx.stroke(mark.path)
    }

    if (data.currentMark !== undefined) {
      ctx.lineWidth = data.currentMark.lineWidth
      ctx.strokeStyle = data.currentMark.color
      ctx.stroke(data.currentMark.path)
    }
  }

  const onMouseDown: MC = React.useCallback(
    ({ info }) => send("START_MARK", { point: info.mouse.point }),
    [send]
  )

  const onMouseMove: MC = React.useCallback(
    ({ info }) => send("UPDATE_MARK", { point: info.mouse.point }),
    [send]
  )

  const onClick: MC = React.useCallback(
    ({ info }) => send("END_MARK", { point: info.mouse.point }),
    [send]
  )

  return (
    <div>
      <Decal
        height={320}
        width={480}
        draw={draw}
        wipe={true}
        onClick={onClick}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
      />
      <div>
        <Button active={isIn("pen")} onClick={() => send("SELECT_PEN")}>
          Pen
        </Button>
        <Button active={isIn("eraser")} onClick={() => send("SELECT_ERASER")}>
          Eraser
        </Button>
        <Button active={isIn("line")} onClick={() => send("SELECT_LINE")}>
          Line
        </Button>
        <Button active={isIn("rect")} onClick={() => send("SELECT_RECT")}>
          Rect
        </Button>
        <Button active={isIn("ellipse")} onClick={() => send("SELECT_ELLIPSE")}>
          Ellipse
        </Button>
      </div>
      <div>
        <Button disabled={!can("UNDO")} onClick={() => send("UNDO")}>
          Undo
        </Button>
        <Button disabled={!can("REDO")} onClick={() => send("REDO")}>
          Redo
        </Button>{" "}
        |{" "}
        <Button
          disabled={!can("CLEAR_CANVAS")}
          onClick={() => send("CLEAR_CANVAS")}
        >
          Clear
        </Button>
      </div>
      <div>
        {data.colors.map((color, index) => (
          <button
            key={index}
            onClick={() => send("SET_COLOR", { color })}
            style={{
              backgroundColor: color,
              height: 24,
              width: 24,
              border:
                color === data.color ? "2px solid #000" : "2px solid #FFF",
              outline: "none"
            }}
          ></button>
        ))}
      </div>
      <div>
        {data.lineWidths.map((lineWidth, index) => (
          <Button
            key={index}
            onClick={() => send("SET_LINE_WIDTH", { lineWidth })}
            active={lineWidth === data.lineWidth}
          >
            {lineWidth}
          </Button>
        ))}
      </div>
      <div>Current state: {[...current.path].reverse().join(" > ")}</div>
    </div>
  )
}

export default MachineExample

type ButtonProps = {
  onClick: any
  active?: boolean
  disabled?: boolean
}

const Button: React.FC<ButtonProps> = ({
  onClick,
  active = false,
  disabled = false,
  children
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "4px 12px",
        fontWeight: active ? "bold" : "normal"
      }}
    >
      {children}
    </button>
  )
}
