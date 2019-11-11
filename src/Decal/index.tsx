import * as React from "react";
import { useKeys } from "./hooks/useKeys";
import { useAssets, Assets, AssetsDescription } from "./hooks/useAssets";
import { useAnimationFrame } from "./hooks/useAnimationFrame";
import { useResizeObserver } from "./hooks/useResizeObserver";

/**
 * ### Draw Callback
 * Called once when the component first mounts.
 * Important! Return the Decal's initial state.
 */
export type DC<S extends any = void, A extends any = any> = (
	ctx: CanvasRenderingContext2D,
	assets: A,
	info: Info
) => S;

/**
 * ### Frame Callback
 * Called on each frame.
 */
export type FC<S extends any | void = any, A extends any = any> = (
	ctx: CanvasRenderingContext2D,
	state: S,
	assets: A,
	info: Info
) => void;

/**
 * ### Mouse Event Callback
 * Called on the different mouse events.
 */
export type MC<S extends any = void, A extends any = any> = (
	event: React.MouseEvent<HTMLCanvasElement>,
	ctx: CanvasRenderingContext2D,
	state: S,
	assets: A,
	info: Info
) => void;

/**
 * ### Keyboard Event Callback
 * Called on keyboard events.
 */
export type KC<S extends any = void, A extends any = any> = (
	event: React.KeyboardEvent<HTMLCanvasElement>,
	ctx: CanvasRenderingContext2D,
	state: S,
	assets: A,
	info: Info
) => void;

/**
 * ### Info
 * Information about the Decal and any current user inputs.
 */
export type Info = {
	size: {
		width: number;
		height: number;
	};
	center: { x: number; y: number };
	mouse: { x: number; y: number };
	hovered: boolean;
	keys: Set<string>;
};

type Props<S extends any = any, A extends AssetsDescription = any> = {
	height: number;
	width: number;
	assets?: any;
	wipe?: boolean;
	draw: DC<S, A>;
	onFrame?: FC<S, A>;
	onClick?: MC<S, A>;
	onMouseMove?: MC<S, A>;
	onMouseEnter?: MC<S, A>;
	onMouseLeave?: MC<S, A>;
	onKeyPress?: KC<S, A>;
	style?: React.CSSProperties;
};

export const Decal: React.FC<Props> = ({
	height,
	width,
	assets = {},
	wipe = true,
	draw,
	onFrame,
	onClick,
	onMouseMove,
	onMouseEnter,
	onMouseLeave,
	onKeyPress,
	style
}) => {
	const keyboard = useKeys();
	const rAssetsPromise = useAssets(assets);
	const rAssets = React.useRef<any>();

	React.useEffect(() => {
		const load = async () => {
			rAssets.current = await rAssetsPromise.current;
		};

		load();
	}, [assets]);

	const [rDecal, cWidth, cHeight] = useResizeObserver<HTMLCanvasElement>(
		width,
		height
	);

	// Information about the Decal / interactions
	const rInfo = React.useRef<Info>({
		size: { width: cWidth, height: cHeight },
		center: { x: cWidth / 2, y: cHeight / 2 },
		mouse: { x: cWidth / 2, y: cHeight / 2 },
		hovered: false,
		keys: keyboard.keys.current
	});

	// Persistent state
	const rState = React.useRef<ReturnType<typeof draw>>();

	// Initial draw on load
	React.useEffect(() => {
		async function kickoff() {
			const cvs = rDecal.current;
			if (cvs) {
				const ctx = cvs.getContext("2d");

				if (ctx) {
					Object.assign(rInfo.current, {
						size: { width: cWidth, height: cHeight },
						center: { x: cWidth / 2, y: cHeight / 2 }
					});

					const asts = await rAssetsPromise.current;
					rAssets.current = asts;
					rState.current = draw(ctx, asts, rInfo.current);
				}
			}
		}

		kickoff();
	}, [assets, rDecal, draw, cWidth, cHeight]);

	// Draw on each animation frame (if onFrame is present)
	const animationOnFrame = React.useCallback(() => {
		if (!rAssets.current) return;
		const cvs = rDecal.current;
		if (cvs) {
			const ctx = cvs.getContext("2d");
			if (ctx) {
				if (wipe) {
					ctx.save();
					ctx.resetTransform();
					ctx.clearRect(0, 0, width, height);
					ctx.restore();
				}

				rInfo.current.keys = keyboard.keys.current;

				onFrame && onFrame(ctx, rState.current, rAssets.current, rInfo.current);
			}
		}
	}, [rAssets, rDecal, wipe, onFrame, height, width, keyboard]);

	useAnimationFrame(onFrame ? animationOnFrame : null);

	// Event helpers

	const getKeyboardEvent = React.useCallback(
		(event: React.KeyboardEvent<HTMLCanvasElement>) => {
			const cvs = rDecal.current;
			if (cvs) {
				const ctx = cvs.getContext("2d");
				if (ctx) {
					rInfo.current.keys = keyboard.keys.current;
					return [
						event,
						ctx,
						rState.current,
						rAssets.current,
						rInfo.current
					] as [
						typeof event,
						typeof ctx,
						typeof rState.current,
						typeof rAssets.current,
						typeof rInfo.current
					];
				}
			}
		},
		[rState, rAssets, rInfo, rDecal, keyboard.keys]
	);

	const getMousePointEvent = React.useCallback(
		(event: React.MouseEvent<HTMLCanvasElement>, hovered = undefined) => {
			const cvs = rDecal.current;
			if (cvs) {
				const cvs = rDecal.current;
				const ctx = cvs.getContext("2d");
				if (ctx) {
					const { offsetLeft, offsetTop } = cvs;

					Object.assign(rInfo.current, {
						mouse: {
							x: event.pageX - offsetLeft,
							y: event.pageY - offsetTop
						},
						keys: keyboard.keys.current,
						hovered: hovered === undefined ? rInfo.current.hovered : hovered
					});

					return [
						event,
						ctx,
						rState.current,
						rAssets.current,
						rInfo.current
					] as [
						typeof event,
						typeof ctx,
						typeof rState.current,
						typeof rAssets.current,
						typeof rInfo.current
					];
				}
			}
		},
		[rState, rAssets, rInfo, rDecal, keyboard.keys]
	);

	// Events

	const handleClick = React.useCallback(
		(event: React.MouseEvent<HTMLCanvasElement>) => {
			const args = getMousePointEvent(event);
			if (args) {
				onClick && onClick.call(undefined, ...args);
			}
		},
		[onClick, getMousePointEvent]
	);

	const handleMouseMove = React.useCallback(
		(event: React.MouseEvent<HTMLCanvasElement>) => {
			const args = getMousePointEvent(event);
			if (args) {
				onMouseMove && onMouseMove.call(undefined, ...args);
			}
		},
		[onMouseMove, getMousePointEvent]
	);

	const handleMouseEnter = React.useCallback(
		(event: React.MouseEvent<HTMLCanvasElement>) => {
			const args = getMousePointEvent(event, true);
			if (args) {
				onMouseEnter && onMouseEnter.call(undefined, ...args);
			}
		},
		[onMouseEnter, getMousePointEvent]
	);

	const handleMouseLeave = React.useCallback(
		(event: React.MouseEvent<HTMLCanvasElement>) => {
			const args = getMousePointEvent(event, false);
			if (args) {
				onMouseLeave && onMouseLeave.call(undefined, ...args);
			}
		},
		[onMouseLeave, getMousePointEvent]
	);

	const handleKeyPress = React.useCallback(
		(event: React.KeyboardEvent<HTMLCanvasElement>) => {
			const args = getKeyboardEvent(event);
			if (args) {
				onKeyPress && onKeyPress.call(undefined, ...args);
			}
		},
		[onKeyPress, getKeyboardEvent]
	);

	return (
		<canvas
			ref={rDecal}
			height={height}
			width={width}
			style={style}
			onClick={handleClick}
			onMouseMove={handleMouseMove}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
			onKeyPress={handleKeyPress}
		/>
	);
};

export default Decal;
