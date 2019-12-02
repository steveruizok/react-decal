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
            setState({ current: machine.current, data: { ...machine.data } })
          }
        },
        debug
      ),
    []
  )

  const [state, setState] = React.useState({
    current: machine.current,
    data: { ...machine.data }
  })

  const helpers = React.useMemo(() => {
    return {
      isIn: (name: string) => machine.current.path.includes(name),
      can: (event: string) => machine.current.events[event]
    }
  }, [machine.current])

  return [state.current, state.data, machine.send, helpers] as const
}
