import { useEffect, useState, useRef } from 'react'
import ResizeObserver from 'resize-observer-polyfill'

export function useResizeObserver<T extends HTMLElement>(
	defaultWidth = 1,
	defaultHeight = 1
) {
	const ref = useRef<T>()
	const [width, setWidth] = useState<number>(defaultWidth)
	const [height, setHeight] = useState<number>(defaultHeight)

	useEffect(() => {
		const element = ref.current
		const resizeObserver = new ResizeObserver((entries) => {
			if (!Array.isArray(entries)) return

			if (!entries.length) return

			const entry = entries[0]

			setWidth(entry.contentRect.width)
			setHeight(entry.contentRect.height)
		})

		if (element !== undefined) {
			resizeObserver.observe(element)

			return () => resizeObserver.unobserve(element)
		}
	}, [])

	return [ref, width, height] as [React.MutableRefObject<T>, number, number]
}
