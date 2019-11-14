import * as React from 'react'

export const useAnimationFrame = (callback: any, fps?: number) => {
	const requestRef = React.useRef(-1)
	const previousTimeRef = React.useRef(-1)

	React.useEffect(() => {
		let last = 0
		let f = 1 / ((fps || 1) / 1000)
		const animate = (time: number) => {
			if (fps) {
				let e = time - last
				if (e < f && callback) {
					requestRef.current = requestAnimationFrame(animate)
					return
				} else {
					last = time
				}
			}

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
