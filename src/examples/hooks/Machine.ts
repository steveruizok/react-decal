interface IEvent<D extends IData> {
  do?: string | IAction<D> | (string | IAction<D>)[]
  if?: string | ICondition<D>
  to?: string
}

interface IAutoEvent<D extends IData> {
  do: string | IAction<D> | (string | IAction<D>)[]
  if?: string | ICondition<D>
  to?: undefined
}

export type IData = { [key: string]: any }

type IAction<D extends IData> = (data: D, payload: any) => void

type ICondition<D extends IData> = (data: D, payload: any) => boolean

interface IStateConfig<D, S extends IStatesConfig<D> = any> {
  on?: { [key: string]: IEvent<D> | IEvent<D>[] }
  onEnter?: IAutoEvent<D>
  onExit?: IAutoEvent<D>
  states?: S
  initial?: S extends undefined ? undefined : keyof S
}

type IStatesConfig<D> = {
  [key: string]: IStateConfig<D>
}

type IStates<D> = { [key: string]: State<D> }

export interface ICurrent<D extends IData> {
  name: string
  state: State<D>
  events: { [key: string]: boolean }
  path: string[]
}

/* -------------------------------------------------- */
/*                       Machine                      */
/* -------------------------------------------------- */

export interface MachineOptions<D extends IData = {}> {
  states: IStatesConfig<D>
  initial: string
  data: D
  on?: { [key: string]: IEvent<D> | IEvent<D>[] }
  onChange?: () => void
  actions?: { [key: string]: IAction<D> }
  conditions?: { [key: string]: ICondition<D> }
}

export class Machine<D extends IData> {
  private _states: { [key: string]: State<D> }
  private _data: D
  private _history: {
    state: State<D>
    data: D
  }[]
  private _actions?: { [key: string]: IAction<D> }
  private _conditions?: { [key: string]: ICondition<D> }
  private _previous?: State<D>
  private _current: ICurrent<D>
  private _debug: boolean
  private _on?: { [key: string]: IEvent<D> | IEvent<D>[] }
  private _onChange?: () => void
  private _available: { [key: string]: IEvent<D> | IEvent<D>[] }

  constructor(options: MachineOptions<D>, debug = true) {
    const { states, on, actions, conditions, initial, data, onChange } = options

    this._data = data
    this._states = this._createInternalStates(states)
    this._on = on
    this._actions = actions
    this._conditions = conditions

    const sink = (state: State<D>): State<D> => {
      const { states, initial } = state
      if (initial !== undefined) {
        return sink(states[initial])
      }
      return state
    }
    const start = sink(this._states[initial as any])

    let d = { ...this._data } // you sure?

    this._available = this._getCurrentEvents(start)

    this._current = {
      name: start.name,
      state: start,
      path: start.pathString,
      events: this._getAvailableEvents(start, d)
    }

    this._history = [
      {
        state: this._current.state,
        data: d
      }
    ]
    this._onChange = onChange
    this._debug = debug
  }

  private log = (...message: any[]) => {
    if (this._debug) {
      console.log("Debug:", ...message)
    }
  }

  private _createInternalStates = (states: IStatesConfig<D>): IStates<D> => {
    let stateTree = {} as IStates<D>

    const convertState = (
      key: string,
      value: IStateConfig<D>,
      parent?: State<D>
    ): State<D> => {
      const state = new State({
        name: key,
        parent,
        ...value,
        states: undefined,
        initial: undefined
      })

      const { states } = value

      if (states !== undefined) {
        const t = {} as IStates<D>
        for (let k in states) {
          t[k] = convertState(k, states[k], state)
        }
        state.initial = value.initial
        state.states = t
      }

      return state
    }

    for (let k in states) {
      stateTree[k] = convertState(k, states[k])
    }

    return stateTree
  }

  // Start from the machine's states and drill
  // to a deep target (e.g. 'active.selecting')
  private _getDeepTarget = (name: string) => {
    const names = name.split(".")

    let current = this.states[names[0]]

    for (let name of names.slice(1)) {
      if (name === "previous") {
        if (current.previous) {
          current = current.previous
        } else if (current.initial) {
          current = current.states[current.initial]
        }
      } else if (current.states[name]) {
        current = current.states[name]
      }
    }

    return current
  }

  // Start from the current state and drill
  // to a deep target (e.g. '.selecting.position')
  private _getShallowTarget = (name: string) => {
    const names = name.slice(1).split(".")

    let current = this.current.state.states[names[0]]

    for (let name of names.slice(1)) {
      if (name === "previous") {
        if (current.previous) {
          current = current.previous
        } else if (current.initial) {
          current = current.states[current.initial]
        }
      } else if (current.states[name]) {
        current = current.states[name]
      }
    }

    return current
  }

  private _getTarget = (name: string): State<D> | undefined => {
    if (name === "previous") {
      return this.previous
    }

    if (name === ".previous") {
      return this.current.state.previous
    }

    if (name[0] === ".") {
      return this._getShallowTarget(name)
    }

    if (name.includes(".")) {
      return this._getDeepTarget(name)
    }

    for (let state of this.current.state.path) {
      if (state.states && state.states[name]) {
        return state.states[name]
      }
    }

    if (this.states[name]) {
      return this.states[name]
    }
  }

  private _getAvailableEvents = (state: State<D>, d: D) => {
    const { path } = state
    let events = {} as { [key: string]: boolean }

    for (let state of path) {
      for (let k in state.on) {
        let e = state.on[k]
        if (Array.isArray(e)) {
          events[k] = e.every(v => this._handleCondition(v.if, {}, d))
        } else {
          events[k] = this._handleCondition(e.if, {}, d)
        }
      }
    }

    for (let k in this._on) {
      let e = this._on[k]
      if (Array.isArray(e)) {
        events[k] = e.every(v => this._handleCondition(v.if, {}, d))
      } else {
        events[k] = this._handleCondition(e.if, {}, d)
      }
    }

    return events
  }

  private _getCurrentEvents = (state: State<D>) => {
    const { path } = state
    let events = {} as { [key: string]: IEvent<D> | IEvent<D>[] }

    for (let state of path) {
      for (let k in state.on) {
        let e = state.on[k]
        if (events[k] !== undefined) {
          console.log("Found duplicate event:", k)
        } else {
          events[k] = e
        }
      }
    }

    for (let k in this._on) {
      let e = this._on[k]
      if (events[k] !== undefined) {
        console.log("Found duplicate event:", k)
      } else {
        events[k] = e
      }
    }

    return events
  }

  private _handleCondition = (
    cond: ICondition<D> | string | undefined,
    payload = {},
    d: D
  ) => {
    if (cond === undefined) {
      return true
    } else if (typeof cond === "string") {
      // If condition is a string, check for a serialized condition
      if (this._conditions && this._conditions[cond]) {
        return this._conditions[cond]({ ...d }, payload)
      } else {
        console.error("No condition found named ", cond)
        return false
      }
    } else {
      return cond({ ...d }, payload)
    }
  }

  private _getAction = (action: string | IAction<D>) => {
    if (typeof action === "function") {
      return action
    } else {
      // If action is a string, check for a serialized action
      if (this._actions && this._actions[action]) {
        return this._actions[action]
      } else {
        console.error("No action found named ", action)
      }
    }
  }

  private _getActions = (
    action: string | IAction<D> | (string | IAction<D>)[]
  ) => {
    let actions = [] as IAction<D>[]

    if (Array.isArray(action)) {
      for (let arrayAction of action) {
        const a = this._getAction(arrayAction)
        if (a !== undefined) {
          actions.push(a)
        }
      }
    } else {
      const a = this._getAction(action)
      if (a !== undefined) {
        actions.push(a)
      }
    }

    return actions
  }

  private _getEvents = (event: IEvent<D> | IEvent<D>[]) => {
    let events = [] as IEvent<D>[]
    if (Array.isArray(event)) {
      events.push(...event)
    } else {
      events.push(event)
    }

    return events
  }

  private _handleEvent = (
    event: IEvent<D> | IAutoEvent<D>,
    payload = {},
    d: D
  ) => {
    let changed = false

    if (!this._handleCondition(event.if, payload, { ...d })) {
      this.log("Condition failed, abandoning event.")
      return changed
    }

    let action = event.do
    if (action !== undefined) {
      this.log("Action found.")
      for (let a of this._getActions(action)) {
        a(d, payload)
      }
      changed = true
    }

    if (event.to !== undefined) {
      this.log("Transition found.")
      let transitioned = this._handleTransition(event.to, payload, d)
      if (transitioned && !changed) {
        changed = true
      }
    }

    this._current.events = this._getAvailableEvents(this._current.state, {
      ...d
    })
    this._available = this._getCurrentEvents(this._current.state)

    return changed
  }

  private _handleTransition = (to: string, payload: any, d: D): boolean => {
    let name = to

    let target = this._getTarget(name)

    if (!target) {
      this.log("No valid target found for transition:" + name)
      return false
    }

    this.log(`Target found:`, target.name)

    // UPDATE PREVIOUS
    this._previous = this.current.state

    // ONEXIT
    const { onExit } = this.current.state
    if (onExit !== undefined) {
      for (let event of this._getEvents(onExit)) {
        this._handleEvent(event, payload, d)
      }
      this.log("Handled exit event on:", this.current.name)
    }

    // ONENTER
    const { onEnter } = target
    if (onEnter !== undefined) {
      for (let event of this._getEvents(onEnter)) {
        this._handleEvent(event, payload, d)
      }
      this.log("Handled enter event on:", target.name)
    }

    // INITIAL - transition to initial if state has substates
    const { states, initial } = target
    if (states !== undefined && initial !== undefined) {
      this.log(`Auto-entering initial state:`, target.name, "->", initial)

      // Set current for transition
      this._current = {
        name,
        state: target,
        path: target.pathString,
        events: this._getAvailableEvents(target, { ...d })
      }

      return this._handleTransition(initial as string, payload, d)
    }

    // UPDATE CURRENT
    this._current = {
      name,
      state: target,
      path: target.pathString,
      events: this._getAvailableEvents(target, { ...d })
    }

    // UPDATE HISTORY
    this._history.push({
      state: this._current.state,
      data: { ...d }
    })

    this.log(`Transitioned to: ${name}`)
    return true
  }

  /* --------------------- Public --------------------- */

  send = (name: string, payload?: any) => {
    this.log(`Received event named:`, name)

    const event = this.available[name]

    if (!event) {
      this.log("No event found for " + name)
      return
    }

    this.log(`Event found.`)

    const d = { ...this._data }

    let results = this._getEvents(event).map(e =>
      this._handleEvent(e, payload, d)
    )

    // If we've changed something, then run onchange
    // and update data. Sloppy diffing.
    if (results.some(e => e)) {
      this._data = d
      this._onChange && this._onChange()
    } else {
      // console.log("no change")
    }
  }

  get previous() {
    return this._previous
  }

  get current() {
    return this._current
  }

  get states() {
    return this._states
  }

  get data() {
    return this._data
  }

  get events() {
    return this._current.events
  }

  get available() {
    return this._available
  }
}

/* -------------------------------------------------- */
/*                        State                       */
/* -------------------------------------------------- */

interface StateConfig<D, S extends StatesConfig<D> = {}> {
  name: string
  parent?: State<D>
  on?: { [key: string]: IEvent<D> | IEvent<D>[] }
  onEnter?: IAutoEvent<D>
  onExit?: IAutoEvent<D>
  states?: S
  initial: S extends {} ? undefined : keyof S
  previous?: State<D>
}

type StatesConfig<D> = { [key: string]: StateConfig<D> }

class State<D extends IData = {}, S extends IStates<D> = any> {
  name: string
  parent?: State<D>
  onEnter?: IAutoEvent<D>
  onExit?: IAutoEvent<D>
  on?: { [key: string]: IEvent<D> | IEvent<D>[] }
  states?: S
  initial?: S extends {} ? keyof S : undefined
  previous?: State<D>

  constructor(config: StateConfig<D>) {
    const { name, parent, onEnter, onExit, on = {}, states, initial } = config

    this.name = name
    this.parent = parent
    this.onEnter = onEnter
    this.onExit = onExit
    this.on = on
    this.states = states ? this._createInternalStates(states) : undefined
    this.initial = initial
  }

  private _createInternalStates(states: IStatesConfig<D>): S {
    let stateTree = {} as any

    const convertState = (
      key: string,
      value: IStateConfig<D>,
      parent?: State<D>
    ): State<D> => {
      const state = new State({
        name: key,
        parent: parent || this,
        ...value,
        previous: undefined,
        states: undefined,
        initial: undefined
      })

      const { states, initial } = value

      if (states !== undefined && initial !== undefined) {
        const t = {} as IStates<D>
        for (let k in states) {
          t[k] = convertState(k, states[k], state)
        }

        state.previous = state.states[initial]
      }

      return state
    }

    for (let k in states) {
      stateTree[k] = convertState(k, states[k])
    }

    return stateTree
  }

  get path(): State<D>[] {
    return getPath<D>(this)
  }

  get pathString(): string[] {
    return this.path.map(s => s.name)
  }
}

/* -------------------------------------------------- */
/*                       Helpers                      */
/* -------------------------------------------------- */

// Recursively get an array of all parents of a given state
function getPath<D extends IData = {}>(
  state: State<D>,
  path: State<D>[] = []
): State<D>[] {
  if (state.parent !== undefined) {
    return getPath(state.parent, [...path, state])
  }
  return [...path, state]
}
