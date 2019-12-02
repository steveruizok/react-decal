import React, { useCallback } from "react"
import Decal, { DC, FC, MC, KC } from "../../Decal"
import { useMachine, MachineContext } from "../hooks/useMachine"

const MachineExample: React.FC = props => {
  const [machine, send] = useMachine({
    data: { count: 0 },
    on: {},
    states: {
      inactive: {
        on: {
          TURN_ON: {
            to: "active"
          }
        }
      },
      active: {
        onEnter: {
          do: data => (data.count = 0)
        },
        on: {
          TURN_OFF: {
            to: "inactive"
          },
          INCREMENT: {
            do: data => data.count++,
            if: data => data.count < 10
          },
          DECREMENT: {
            do: data => data.count--,
            if: data => data.count > 0
          }
        },
        initial: "min",
        states: {
          min: {},
          mid: {},
          max: {}
        }
      }
    },
    initial: "inactive"
  })

  const draw: DC = ({ ctx, info }) => {
    ctx.textAlign = "center"
    ctx.fillText(machine.current.name, info.center.x, info.center.y)
    ctx.fillText(
      machine.data.count.toString(),
      info.center.x,
      info.center.y + 32
    )
  }

  return (
    <div>
      <Decal height={320} width={480} draw={draw} wipe={true} />
      <div>
        <button
          disabled={!machine.current.events["TURN_ON"]}
          onClick={() => send("TURN_ON")}
        >
          Turn on
        </button>
        <button
          disabled={!machine.current.events["TURN_OFF"]}
          onClick={() => send("TURN_OFF")}
        >
          Turn off
        </button>
        <button
          disabled={!machine.current.events["INCREMENT"]}
          onClick={() => send("INCREMENT")}
        >
          Increment
        </button>
        <button
          disabled={!machine.current.events["DECREMENT"]}
          onClick={() => send("DECREMENT")}
        >
          Decrement
        </button>
      </div>
    </div>
  )
}

export default MachineExample
