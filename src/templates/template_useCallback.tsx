/*
IN-COMPONENT TEMPLATE

Here's a template for projects where you want your callbacks to occur
inside of your component. You might want to do this, for example, if 
your callbacks need to respond to the component's props.

It's important that callbacks aren't generated fresh each time the 
component updates.  If the callback is dependent on the component's state 
or props, then place the callback inside of the component function's body 
and memoize it using the `useCallback` hook. Otherwise, if the callback 
has no dependencies, then move it outside of the component's function.
*/

import React, { useCallback } from 'react'
import Decal, { DC, FC, MC, KC } from '../Decal'

const FunctionalTemplate: React.FC = (props) => {
	type S = {}

	const draw = useCallback<DC<S>>(({ ctx, assets, info }) => {
		return {} // initial state
	}, [])

	const onFrame = useCallback<FC<S>>(({ ctx, state, assets, info }) => {}, [])

	const onClick = useCallback<MC<S>>(({ event, state, assets, info }) => {}, [])

	const onMouseMove = useCallback<MC<S>>(({ event, state, assets, info }) => {},
	[])

	const onMouseEnter = useCallback<MC<S>>(
		({ event, state, assets, info }) => {},
		[]
	)

	const onMouseLeave = useCallback<MC<S>>(
		({ event, state, assets, info }) => {},
		[]
	)

	const onKeyPress = useCallback<KC<S>>(({ event, state, assets, info }) => {},
	[])

	return (
		<Decal
			height={320}
			width={480}
			draw={draw}
			onFrame={onFrame}
			onClick={onClick}
			onMouseMove={onMouseMove}
			onMouseLeave={onMouseLeave}
			onMouseEnter={onMouseEnter}
			onKeyPress={onKeyPress}
			wipe={true}
		/>
	)
}

export default FunctionalTemplate
