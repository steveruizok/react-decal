import * as React from "react"
import { ValuesType } from "utility-types"

/* -------------------------------------------------- */
/*                        Types                       */
/* -------------------------------------------------- */

type IData = { [key: string]: any }
type ITarget = any
type IAction<D extends IData> = (data: D, payload?: IPayload<D>) => void
type ICondition<D extends IData> = (data: D, payload?: IPayload<D>) => boolean

interface IAutoEvent<D extends IData> {
  do?: IAction<D>
  if?: ICondition<D>
}

interface IEvent<D extends IData> {
  to?: ITarget
  do?: IAction<D>
  if?: ICondition<D>
}

type IPayload<D extends IData> = Partial<D>

type IEvents<D extends IData> = Record<string, IEvent<D> | IEvent<D>[]>

interface OState<D extends IData> {
  on?: IEvents<D>
  initial?: string
  states?: OStates<D>
  onEnter?: IAutoEvent<D> | IAutoEvent<D>[]
  onExit?: IAutoEvent<D> | IAutoEvent<D>[]
}

type OStates<D extends IData> = Record<string, OState<D>>

interface IState<D extends IData> extends OState<D> {
  id: string
  path: string
  states: IStates<D>
}

type IStates<D extends IData> = Record<string, IState<D>>

interface IMachine<
  D extends IData = {},
  O extends IEvents<D> = {},
  S extends IStates<D> = {}
> {
  current: {
    name: string
    state: IState<D>
    events: Record<string, boolean>
  }
  on?: O
  data: D
  states: S
  targets?: { [key: string]: ITarget }
  actions?: { [key: string]: IAction<D> }
  conditions?: { [key: string]: ICondition<D> }
  events?: { [key: string]: IEvent<D> }
}

interface IMachineConfig<
  D extends IData,
  O extends IEvents<D>,
  S extends OStates<D>
> {
  data: D
  states: S
  on: O
  initial: string
}

export const useMachine = <
  D extends IData,
  O extends IEvents<D>,
  S extends OStates<D>
>(
  options: IMachineConfig<D, O, S>
) => {
  const states = convertOStatesToIStates(options.states)

  const initialState = states[options.initial]

  const initialEvents: Record<string, boolean> = {}

  if (initialState.on) {
    for (let key in initialState.on) {
      const event = initialState.on[key]
      if (Array.isArray(event)) {
        initialEvents[key] = false
        for (let e of event) {
          const test = e.if
          if (test !== undefined) {
            if (test({ ...options.data }, {})) {
              initialEvents[key] = true
              break
            }
          } else {
            initialEvents[key] = true
            break
          }
        }
      } else {
        const test = event.if
        if (test !== undefined) {
          initialEvents[key] = test({ ...options.data }, {})
        } else {
          initialEvents[key] = true
        }
      }
    }
  }

  if (options.on) {
    for (let key in options.on) {
      const event = options.on[key] as IEvent<D>
      if (Array.isArray(event)) {
        initialEvents[key] = false
        for (let e of event) {
          const test = e.if
          if (test !== undefined) {
            if (test({ ...options.data }, {})) {
              initialEvents[key] = true
              break
            }
          } else {
            initialEvents[key] = true
            break
          }
        }
      } else {
        const test = event.if
        if (test !== undefined) {
          initialEvents[key] = test({ ...options.data }, {})
        } else {
          initialEvents[key] = true
        }
      }
    }
  }

  const [machine, setMachine] = React.useState({
    data: options.data,
    states,
    on: options.on,
    current: {
      name: options.initial,
      state: initialState,
      events: initialEvents
    }
  })

  // Public function for sending events to the machine
  const send = (name: string, payload?: Partial<D>) => {
    let m = { ...machine }

    const event = findEvent(m, name)

    if (!event) {
      console.warn("No event found for " + name)
      return
    }

    if (Array.isArray(event)) {
      for (let e of event) {
        m = processEvent(m, e, payload)
        m = processTransition(m, e)
      }
    } else {
      m = processEvent(m, event, payload)
      m = processTransition(m, event)
    }

    m.current.events = findEvents(m, m.current.state)

    setMachine(m)
  }

  return [machine, send] as const
}

/* -------------------------------------------------- */
/*                       Context                      */
/* -------------------------------------------------- */

export const MachineContext = React.createContext({})
export const useMachineContext = () => React.useContext(MachineContext)

/* --------------------- Helpers -------------------- */

// Convert states to graph
const convertOStateToIState = <D>(
  key: string,
  value: OState<D>,
  path: string
): IState<D> => {
  let states = {} as Record<string, IState<D>>

  if (value.states !== undefined) {
    for (let k in value.states) {
      states[k] = convertOStateToIState(k, value.states[k], path + key + ".")
    }
  }

  return {
    ...value,
    id: key,
    path: path + key,
    states
  }
}

const convertOStatesToIStates = <D extends IData>(ostates: OStates<D>) => {
  const states = {} as IStates<D>

  for (let key of Object.keys(ostates)) {
    states[key] = convertOStateToIState(key, ostates[key], "")
  }

  return states
}

// Handle the events (if and do) for an OnEnter or OnExit event
const processEvent = <D extends IData>(
  m: any,
  event: IEvent<D> | IAutoEvent<D>,
  payload = {}
) => {
  if (event.if !== undefined) {
    const ok = event.if({ ...m.data }, payload)
    if (!ok) return m
  }

  if (event.do !== undefined) {
    const d = { ...m.data }
    event.do(d, payload)
    m.data = d
  }

  return m
}

const getCurrentPath = <M extends IMachine<D>, D extends IData>(
  m: M,
  state: IState<D>
) => {
  const path: IState<D>[] = []

  let curr = m as any
  for (let name of state.path.split(".")) {
    curr = curr.states[name]
    path.push(curr)
  }

  path.reverse()
  return path
}

const findEvents = <M extends IMachine<D>, D extends IData>(
  m: M,
  state: IState<D>
) => {
  const events = {} as Record<string, boolean>

  const path = getCurrentPath(m, state)

  for (let state of path) {
    if (state.on) {
      for (let key in state.on) {
        const event = state.on[key]
        if (Array.isArray(event)) {
          events[key] = false
          for (let e of event) {
            const test = e.if
            if (test !== undefined) {
              if (test({ ...m.data }, {})) {
                events[key] = true
                break
              }
            } else {
              events[key] = true
              break
            }
          }
        } else {
          const test = event.if
          if (test !== undefined) {
            events[key] = test({ ...m.data }, {})
          } else {
            events[key] = true
          }
        }
      }
    }
  }

  return events
}

// Search up the current state's parent states looking for the event
const findEvent = (m: any, name: string) => {
  const path = getCurrentPath(m, m.current.state)

  for (let state of path) {
    if (state.on && state.on[name]) {
      return state.on[name]
    }
  }

  if (m.on && m.on[name]) {
    return m.on[name]
  }
}

const processTransition = <D extends IData>(m: any, e: IEvent<D>) => {
  if (e.to !== undefined) {
    const { onExit } = m.current.state
    if (onExit !== undefined) {
      if (Array.isArray(onExit)) {
        for (let e of onExit) {
          m = processEvent(m, e)
        }
      } else {
        m = processEvent(m, onExit)
      }
    }

    m.current = {
      name: e.to,
      state: m.states[e.to],
      events: {}
    }

    const { onEnter } = m.current.state

    if (onEnter !== undefined) {
      if (Array.isArray(onEnter)) {
        for (let e of onEnter) {
          m = processEvent(m, e)
        }
      } else {
        m = processEvent(m, onEnter)
      }
    }
  }

  return m
}
