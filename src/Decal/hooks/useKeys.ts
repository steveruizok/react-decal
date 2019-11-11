import * as React from "react"

export function useKeys() {
	const rKeys = React.useRef<Set<string>>(new Set())
	const rPressed = React.useRef<Set<string>>(new Set())

	React.useEffect(() => {
		const handler = (event: KeyboardEvent) => {
			rPressed.current.add(event.key)
		}

		document.body.addEventListener("keypress", handler)
		return () => {
			document.body.removeEventListener("keypress", handler)
		}
	}, [])

	React.useEffect(() => {
		const inHandler = (event: KeyboardEvent) => {
			rKeys.current.add(event.key)
		}

		const outHandler = (event: KeyboardEvent) => {
			rKeys.current.delete(event.key)
		}

		document.body.addEventListener("keydown", inHandler)
		document.body.addEventListener("keyup", outHandler)
		return () => {
			document.body.removeEventListener("keydown", inHandler)
			document.body.removeEventListener("keyup", outHandler)
		}
	}, [])

	const getDown = React.useCallback(() => {
		return rKeys.current
	}, [])

	const getPressed = React.useCallback(() => {
		const t = new Set(rPressed.current)
		rPressed.current.clear()
		return t
	}, [])

	return { getPressed, getDown, keys: rKeys, pressed: rPressed }
}
