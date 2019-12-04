import * as React from "react"
import { Machine, MachineOptions, ICurrent, IData } from "./Machine"

export function useMachine<D extends IData>(
  options: MachineOptions<D>,
  debug = false
) {
  const machine = React.useMemo(
    () =>
      new Machine<D>(
        {
          ...options,
          onChange: () => {
            dispatch({ type: "UPDATE_MACHINE", payload: machine })
          }
        },
        debug
      ),
    []
  )

  const [state, dispatch] = React.useReducer(
    (current, action) => {
      switch (action.type) {
        case "UPDATE_MACHINE": {
          return {
            send: machine.send,
            current: machine.current,
            data: machine.data,
            computed: machine.computed,
            isIn: machine.isIn,
            can: machine.can
          }
        }
        default: {
          return current
        }
      }
    },
    {
      send: machine.send,
      current: machine.current,
      data: machine.data,
      computed: machine.computed,
      isIn: machine.isIn,
      can: machine.can
    }
  )

  return state
}
