/*
COMPONENT TEMPLATE

Here's a template for using Decal in a React component. A word of caution: the Decal component is especially sensitive to mutations. Should any of its callbacks change, Decal will respond to that callback in the same way as on its initial mount. 

This is a design choice: it allows you to use the `draw` function to represent React (mutable, reactive) state, rather than relying on `onFrame` to represent the component's own (mutable, non-reactive) context.

If you'd like more control over when these functions mutate, see the `useCallback` template.
*/

import React, { useCallback } from "react"
import Decal, { DC, FC, MC, KC } from "../Decal"

type S = {}

const FunctionalTemplate: React.FC = props => {
  const draw: DC<S> = ({ ctx, assets, info }) => {
    return {}
  }

  const onFrame: FC<S> = ({ ctx, state, assets, info }) => {}

  const onClick: MC<S> = ({ event, state, assets, info }) => {}

  const onMouseDown: MC<S> = ({ event, state, assets, info }) => {}

  const onMouseMove: MC<S> = ({ event, state, assets, info }) => {}

  const onMouseEnter: MC<S> = ({ event, state, assets, info }) => {}

  const onMouseLeave: MC<S> = ({ event, state, assets, info }) => {}

  const onKeyPress: KC<S> = ({ event, state, assets, info }) => {}

  return (
    <Decal
      height={320}
      width={480}
      draw={draw}
      onFrame={onFrame}
      onClick={onClick}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      onMouseEnter={onMouseEnter}
      onKeyPress={onKeyPress}
      wipe={true}
    />
  )
}

export default FunctionalTemplate
