/*
TEMPLATE

Here's a general template for new projects.

You don't have to use all of the callbacks provided -- at minimum, a
Decal component only needs a `height`, `width`, and `draw`. The engine
also takes care of mouse location and pressed keys, so there's no need
to manage that data yourself.
*/

import React from "react"
import Decal, { DC, FC, MC, KC } from "../Decal"

type S = {}

const draw: DC<S> = ({ ctx, assets, info }) => {
  return {} // initial state
}

const onFrame: FC<S> = ({ ctx, state, assets, info }) => {}

const onClick: MC<S> = ({ event, ctx, state, assets, info }) => {}

const onMouseMove: MC<S> = ({ event, ctx, state, assets, info }) => {}

const onMouseEnter: MC<S> = ({ event, ctx, state, assets, info }) => {}

const onMouseLeave: MC<S> = ({ event, ctx, state, assets, info }) => {}

const onKeyPress: KC<S> = ({ event, ctx, state, assets, info }) => {}

const Template: React.FC = props => {
  return (
    <Decal
      height={320}
      width={480}
      draw={draw}
      // onFrame={onFrame}
      // onClick={onClick}
      // onMouseMove={onMouseMove}
      // onMouseLeave={onMouseLeave}
      // onMouseEnter={onMouseEnter}
      // onKeyPress={onKeyPress}
      wipe={true}
    />
  )
}

export default Template
