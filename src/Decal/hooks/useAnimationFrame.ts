import * as React from "react"

export const useAnimationFrame = (callback: any) => {
	const requestRef = React.useRef(-1)
	const previousTimeRef = React.useRef(-1)

	React.useEffect(() => {
		const animate = (time: number) => {
			if (time !== previousTimeRef.current) {
				const deltaTime = time - previousTimeRef.current
				callback(deltaTime)
			}
			previousTimeRef.current = time
			requestRef.current = requestAnimationFrame(animate)
		}

		if (callback) {
			requestRef.current = requestAnimationFrame(animate)
		}
		return () => cancelAnimationFrame(requestRef.current)
	}, [callback])
}
