import React, { useCallback } from "react"
import Decal, { DC, FC, MC, KC } from "../../Decal"

type S = {}

const [machine, send] = createMachine({
  data: { count: 0 },
  on: {},
  states: {
    inactive: {
      on: {
        turn_on: {
          to: "active"
        }
      }
    },
    active: {
      on: {
        turn_off: {
          to: "inactive"
        },
        increment: {
          do: (data: any) => data.count++
        },
        decrement: {
          do: (data: any) => data.count--
        }
      }
    }
  },
  initial: "inactive"
})

const MachineExample: React.FC = props => {
  const draw: DC<S> = ({ ctx, assets, info }) => {
    return {}
  }

  const onFrame: FC<S> = ({ ctx, state, assets, info }) => {
    ctx.textAlign = "center"
    ctx.fillText(machine.current.name, info.center.x, info.center.y)
    ctx.fillText(machine.data.count, info.center.x, info.center.y + 32)
  }

  // const onClick: MC<S> = ({ event, state, assets, info }) => {}

  // const onMouseDown: MC<S> = ({ event, state, assets, info }) => {}

  // const onMouseMove: MC<S> = ({ event, state, assets, info }) => {}

  // const onMouseEnter: MC<S> = ({ event, state, assets, info }) => {}

  // const onMouseLeave: MC<S> = ({ event, state, assets, info }) => {}

  // const onKeyPress: KC<S> = ({ event, state, assets, info }) => {}

  return (
    <div>
      <Decal
        height={320}
        width={480}
        draw={draw}
        onFrame={onFrame}
        fps={1}
        // onClick={onClick}
        // onMouseDown={onMouseDown}
        // onMouseMove={onMouseMove}
        // onMouseLeave={onMouseLeave}
        // onMouseEnter={onMouseEnter}
        // onKeyPress={onKeyPress}
        wipe={true}
      />
      <button onClick={() => send("turn_on")}>Turn on</button>
      <button onClick={() => send("turn_off")}>Turn off</button>
      <button onClick={() => send("increment")}>Increment</button>
      <button onClick={() => send("decrement")}>Decrement</button>
    </div>
  )
}

export default MachineExample

/* -------------------------------------------------- */
/*                       Machine                      */
/* -------------------------------------------------- */

type IData = { [key: string]: any }
type ITarget = string
type IAction = (data: IData, payload: IPayload) => void
type ICondition = (data: IData, payload: IPayload) => boolean

interface IEvent {
  to?: ITarget
  do?: IAction
  if?: ICondition
}

type IPayload = any

type IEvents = {
  [key: string]: IEvent
}

type IState = {
  on?: IEvents
}

type IStates = Record<string, IState>

interface IMachine {
  current: {
    name: string
    state: IState
  }
  on?: IEvents
  data: IData
  states: { [key: string]: IState }
  targets?: { [key: string]: ITarget }
  actions?: { [key: string]: IAction }
  conditions?: { [key: string]: ICondition }
  events?: { [key: string]: IEvent }
}

const e: IEvent = {
  to: "home",
  do: () => {},
  if: () => true
}

function createMachine<
  D extends IData = {},
  O extends IEvents = {},
  S extends IStates = {}
>(options: { data: D; states: S; on: O; initial: keyof S }) {
  const { data, on, states, initial } = options

  const machine: IMachine = {
    data,
    states,
    on,
    current: {
      name: initial as string,
      state: states[initial]
    }
  }

  const send = (name: string, payload?: Partial<D>) => {
    const event =
      machine.current.state.on && machine.current.state.on[name]
        ? machine.current.state.on[name]
        : machine.on && machine.on[name]
        ? machine.on[name]
        : undefined

    if (!event) return

    if (event.if) {
      const ok = event.if({ ...machine.data }, payload)
      if (!ok) return
    }

    if (event.do) {
      const d = { ...machine.data }
      event.do(d, payload)
      machine.data = d
    }

    if (event.to) {
      machine.current = {
        name: event.to,
        state: states[event.to as keyof S]
      }
    }
  }

  return [machine, send] as const
}
