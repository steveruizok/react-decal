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

type IEvents<D extends IData> = { [key: string]: IEvent<D> | IEvent<D>[] }

export type IData = { [key: string]: any }

type IAction<D extends IData> = (data: D, payload: any) => void

type ICondition<D extends IData> = (data: D, payload: any) => boolean

interface IStateConfig<D> {
  on?: { [key: string]: IEvent<D> | IEvent<D>[] }
  onEnter?: IAutoEvent<D>
  onExit?: IAutoEvent<D>
  states?: IStatesConfig<D>
  initial?: string
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

export type IComputed<D extends IData, K = any> = (data: D) => K

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
  compute?: { [key: string]: IComputed<D> }
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
  private _on?: IEvents<D>
  private _onChange?: () => void
  private _available: { [key: string]: IEvent<D> | IEvent<D>[] }
  private _compute?: { [key: string]: IComputed<D> }
  private _computed?: { [key: string]: any }

  constructor(options: MachineOptions<D>, debug = true) {
    const {
      states,
      on,
      actions,
      conditions,
      initial,
      data,
      compute,
      onChange
    } = options

    this._data = data
    this._states = this._createInternalStates(states)
    this._on = on
    this._actions = actions
    this._conditions = conditions
    this._compute = compute

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
    this._data = d
    this._computed = this._getComputed(d)
  }

  private log = (...message: any[]) => {
    if (this._debug) {
      console.log("Debug:", ...message)
    }
  }

  /* --------------------- States --------------------- */

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

  /* -------------------- Computes -------------------- */

  private _getComputed = (data: D) => {
    const compute = this._compute
    if (compute === undefined) {
      return {}
    }
    return Object.keys(compute).reduce((acc, key) => {
      acc[key] = compute[key](data)
      return acc
    }, {} as { [key in keyof typeof compute]: ReturnType<typeof compute[key]> })
  }

  /* ------------------- Conditions ------------------- */

  private _getSerializedCondition = (condition: string) => {
    const conditions = this._conditions

    if (conditions === undefined) {
      console.error("This machine doesn't have any serialized conditions.")
      return
    }

    if (conditions[condition] === undefined) {
      console.error("No serialized condition found named:", condition)
      return
    }

    return conditions[condition]
  }

  private _getCondition = (
    condition: ICondition<D> | string = () => true
  ): ICondition<D> =>
    typeof condition === "function"
      ? condition
      : this._getSerializedCondition(condition) || (() => true)

  private _getConditions = (
    condition:
      | (ICondition<D> | string | undefined)
      | (ICondition<D> | string | undefined)[] = []
  ) =>
    (Array.isArray(condition) ? condition : Array(condition)).map(c =>
      this._getCondition(c)
    )

  private _handleCondition = (
    cond: ICondition<D>,
    payload = {},
    d: D
  ): boolean => cond({ ...d }, payload)

  /* --------------------- Actions -------------------- */

  private _getSerializedAction = (action: string) => {
    const actions = this._actions

    if (actions === undefined) {
      console.error("This machine doesn't have any serialized actions.")
      return
    }

    if (actions[action] === undefined) {
      console.error("No serialized action found named:", action)
      return
    }

    return actions[action]
  }

  private _getAction = (action: string | IAction<D>): IAction<D> =>
    typeof action === "function"
      ? action
      : this._getSerializedAction(action) || (() => {})

  private _getActions = (
    action: string | IAction<D> | (string | IAction<D>)[]
  ) =>
    (Array.isArray(action) ? action : Array(action)).map(a =>
      this._getAction(a)
    )

  private _handleAction = (action: IAction<D>, payload = {}, d: D) =>
    action(d, payload)

  /* ------------------- Transitions ------------------ */

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

  /* --------------------- Events --------------------- */

  private _getAvailableEvents = (state: State<D>, d: D) => {
    const events = {} as { [key: string]: boolean }
    const current = this._getCurrentEvents(state)

    for (let key in current) {
      let handlers = current[key]
      if (!Array.isArray(handlers)) {
        handlers = Array(handlers)
      }

      let conditions = handlers.reduce((a, c) => {
        const condition = c.if
        if (condition !== undefined) {
          a.push(condition)
        }
        return a
      }, [] as (string | ICondition<D>)[])

      if (conditions.length === 0) {
        events[key] = true
      } else {
        events[key] = conditions.every(cond =>
          this._handleCondition(this._getCondition(cond), {}, d)
        )
      }
    }

    return events
  }

  private _getCurrentEvents = (state: State<D>) => {
    const { path } = state
    let events = {} as { [key: string]: IEvent<D> | IEvent<D>[] }

    let handlers = path
      .reduce((a, c) => {
        const { on } = c
        if (on !== undefined) {
          a.push(on)
        }
        return a
      }, [] as IEvents<D>[])
      .concat(this._on ? this._on : [])

    for (let handler of handlers) {
      for (let key in handler) {
        if (events[key] !== undefined) {
          console.log("Found a duplicate event handler:", key)
          continue
        }
        let event = handler[key as keyof typeof handler]
        events[key] = event
      }
    }

    return events
  }

  private _getEvents = (event: IEvent<D> | IEvent<D>[]) =>
    Array.isArray(event) ? event : Array(event)

  private _handleEvent = (
    event: IEvent<D> | IAutoEvent<D>,
    payload = {},
    d: D
  ) => {
    let changed = false

    let condition = event.if
    if (condition !== undefined) {
      this.log("Condition found.")
      for (let c of this._getConditions(condition)) {
        if (!this._handleCondition(c, payload, { ...d })) {
          this.log("Condition failed, abandoning event.")
          return changed
        }
      }
    }

    let action = event.do
    if (action !== undefined) {
      this.log("Action found.")
      for (let a of this._getActions(action)) {
        this._handleAction(a, payload, d)
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
      this._computed = this._getComputed(d)
      this._onChange && this._onChange()
    } else {
      // console.log("no change")
    }
  }

  isIn = (name: string) => {
    return this.current.path.includes(name)
  }

  can = (name: string, payload?: any) => {
    const es = this._available[name]
    if (!es) {
      return false
    }

    return this._getEvents(es).every(({ if: cond }) =>
      cond === undefined
        ? true
        : this._handleCondition(this._getCondition(cond), payload, {
            ...this.data
          })
    )
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

  get computed() {
    return this._computed
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

interface StateConfig<D> {
  name: string
  parent?: State<D>
  on?: IEvents<D>
  onEnter?: IAutoEvent<D>
  onExit?: IAutoEvent<D>
  states?: IStatesConfig<D>
  initial?: string
  previous?: State<D>
}

class State<D extends IData = {}> {
  name: string
  parent?: State<D>
  onEnter?: IAutoEvent<D>
  onExit?: IAutoEvent<D>
  on?: { [key: string]: IEvent<D> | IEvent<D>[] }
  states: IStates<D> = {}
  initial?: string
  previous?: State<D>

  constructor(config: StateConfig<D>) {
    const { name, parent, onEnter, onExit, on = {}, states, initial } = config

    this.name = name
    this.parent = parent
    this.onEnter = onEnter
    this.onExit = onExit
    this.on = on
    this.states = states ? this._createInternalStates(states) : {}
    this.initial = initial
  }

  private _createInternalStates(states: IStatesConfig<D>): IStates<D> {
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

        state.previous = undefined
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

/* -------------------------------------------------- */
/*                        Spec                        */
/* -------------------------------------------------- */

/*
DATA
A machine maintains an object of arbitrary data. This data is defined in its `data` property. It is may be mutated only through events and actions (see below).

EVENTS (in brief)
An event is dispatched to the machine using the `send` command. Events are dispatched together with a "payload" of arbitrary data. Events may be ignored depending on a) whether the machine is currently capable of "handling" the event, based on its current state (see below), and b) the condition attached to the event. Events have two effects: they may cause the machine to transition into a new state, may mutate the machine's data state, or both. 

STATES
A machine has a finite set of states that the machine may move between  as the result of events and transitions (see below). The states are organized as a "tree", with any state capable of being the parent to other states. At any time, the machine has a "path" of its current states. 

- HANDLING EVENTS
When a machine receives an event (see below), it will only respond if that event is defined in a) the current state's `on` property, b) the `on` property of any state in the "path" of current states, or c) the `on` property of the machine itself. If the event is not "handled" in the current tree, the machine will ignore the event.

- CONFLICTS BETWEEN HANDLERS
While an individual state's event handlers must be unique, it may be part of a "path" of states that does contain a handler of the same name.

In the example below, both "starting" and "starting > phaseA" have a handler for the "CANCEL" event. 

```tsx

{
  ...,
  states: {
    starting: {
      on: {
        CANCEL: { ...}
      },
      states: { 
        phaseA: {
          on: {
            CANCEL: { ... }
          },
        },
      },
    },
    active: { ... }
  }
}


```

When the machine receives an event, it will "search" its current path for a state that can respond to the event. It will stop at the first event it finds. In the example aboe, if the machine received a "CANCEL" event while in the "phaseA" state, only the "phaseA" handler would run.

EVENTS
An event is dispatched to the machine using the `send` command. Events are dispatched together with a "payload" of arbitrary data.

Both the machine and its states may have event handlers, define in the `on` object. An `on` object may have any number of event handlers. States may have two additional auto-events (onExit and onEnter) that fire when the machines transitions into or out of the state.

An event has three parts: a transition, action, and condition. All three parts are optional.

- CONDITIONS
A condition is a function that receives a) the machine's current data state and b) the dispatched payload, and returns a boolean. If a condition is provided and that condition fails to return `true`, then the event will not proceed.

- ACTIONS
An action is a function that receives a) the machine's current data state and b) the dispatched payload, and mutates the data state.

- TRANSITIONS
as either a transition -- the name of a state to transition to, if possible -- and an action, a function that mutates the machine's current data state.

AUTO EVENTS
A state may have two auto-firing events: `onEnter` and `onExit`. An auto-firing event may have an action and (optionally) a condition. It may not have a transition. Auto events fire as part of the transition process.

SERIALIZATION
Both conditions and actions may be a) defined in the state object or b) defined in a "serialized" form in the machine's "actions" or "conditions" object. In an event, an action or condition function may be replaced by the name of its serialized version.

For example, in the following machine:

```tsx
{
  ...,
  states: {
    inactive: {
      on: {
        TURN_ON: {
          to: "active",
          do: (data, payload) => data.battery -= 1,
          if: (data, payload) => data.battery > 0
        }
      }
    },
    active: { ... }
  }
}
```

The action and conditions associated with the `TURN_ON` event could be serialized as follows: 


```tsx
{
  ...,
  states: {
    inactive: {
      on: {
        TURN_ON: {
          to: "active",
          do: "decrementBattery",
          if: "batteryIsNotDead"
        }
      }
    },
    active: { ... }
  },
  actions: {
    decrementBattery: (data, payload) => data.battery -= 1,
  },
  conditions: {
    batteryIsNotDead: (data, payload) => data.battery > 0
  }
}
```

Serialization has two benefits: a) the "readability" of a machine is increased by using natural language labels for the actions and conditions that govern behavior, and b) serialized actions and conditions may be re-used throughout the machine, reducing repetition and associated errors.


MULTIPLE EVENTS
An event handler may handle several events, each with their own condition. In this case, the handler accepts an array of event objects.

{
  ...,
  states: {
    inactive: {
      on: {
        TURN_ON: [{
          do: (data, payload) => data.battery -= 1,
          if: (data, payload) => data.battery > 0
        },
        {
          to: "active",
          if: (data, payload) => data.battery > 5
        }]
      }
    },
    active: { ... }
  }
}

In the example above, a battery level of 5 is required to change states to "active", however attempting to "TURN_ON" a machine with less than that amount will still drain the battery.

MULTIPLE EVENTS / CONDITIONS
An event may itself have multiple actions and multiple conditions. In both cases, the multiple actions or conditions are expressed as an array. This is especially useful when using serialized events and conditions (see below), and further helps isolate these parts of the machine into re-usable parts.

```tsx
{
  ...,
  states: {
    inactive: {
      on: {
        TURN_ON: {
          to: "active",
          do: ["decrementBattery", "wakeNeighbors"]
          if: ["batteryIsNotDead", "temperatureIsAboveFreezing"]
        }
      }
    },
    active: { ... }
  },
  actions: { ... },
  conditions: { ... }
}
```

In the case of multiple actions, each new action will receive the machine's data as mutated by the previous action.

In the case of multiple conditions, all conditions must return true in order for the event to run.

COMPUTED

With the `computed` object, you may specify properties that should be computed, based of the data object and any other available information such as the current date or time. These values are computed each time the machine successfully updates.

Computed values are computed after all transitions and mutations have occurred. They may not mutate the machine's data. (Their mutations will be ignored.)

```tsx
{
  ...,
  data: {
    apples: 2,
    oranges: 5,
    airplanes: 3
  },
  compute: {
    totalFruit: (data) => data.apples + data.oranges,
    lastModified: (data) => Date.now()
  }
}

// Expect Machine.computed to equal 7
*/
