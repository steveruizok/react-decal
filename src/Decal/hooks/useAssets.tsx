import * as React from 'react'

export type Tree<T> = { [key: string]: T | T[] | Tree<T> }
export type Assets = Tree<HTMLImageElement>
export type AssetsDescription = Tree<string>

export function useAssets<T extends AssetsDescription>(assets: T) {
	const _assets = React.useRef<Promise<Assets>>()

	React.useEffect(() => {
		async function loadAsset(url: string) {
			return new Promise<HTMLImageElement>((resolve) => {
				const image = new Image()
				image.onload = () => resolve(image)
				image.src = url
			})
		}

		async function loadAssets(ast: AssetsDescription, source = {} as Assets) {
			for (let key in ast) {
				let a = ast[key]
				if (typeof a === 'string') {
					const img = await loadAsset(a)
					source[key] = img
				} else if (Array.isArray(a)) {
					const children = await Promise.all(a.map((img) => loadAsset(img)))
					source[key] = children
				} else if (typeof a === 'object') {
					const child = await loadAssets(a)
					source[key] = child
				}
			}

			return source
		}

		async function loadAll(ast: AssetsDescription) {
			_assets.current = loadAssets(ast, {})
		}

		loadAll(assets)
	}, [assets])

	return _assets
}

export const AssetsContext = React.createContext<Assets>({})
export const useAssetsContext = () => React.useContext(AssetsContext)
