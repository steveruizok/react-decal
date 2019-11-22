import * as React from "react"
import { render } from "react-dom"
import Drawing from "./examples/drawing"
import MouseHunter from "./examples/mouseHunter"
import Splines from "./examples/splines/splines"
import Ship from "./examples/ship"
import Hall from "./examples/hall"
import Assets from "./examples/assets"
import RayTracing from "./examples/raytracing/raytracing"
import RayCast2d from "./examples/raycast2d"
import RayCastAngle2d from "./examples/raycastAngle2d"
import ShadowCasting2 from "./examples/shadowcasting2"
import ShadowCasting3 from "./examples/shadowcasting3"
import ShadowCasting4 from "./examples/shadows/"
import ShadowCasting from "./examples/shadows/iso"

import "./styles.css"

function App() {
  return (
    <div className="App">
      {/* <h1>Splines</h1>
      <Splines /> */}
      {/* <RayTracing /> */}
      {/* <h1>RayCasting</h1> */}
      {/* <RayTracing /> */}
      {/* <h1>RayCast 2d</h1>
      <RayCast2d />
      <h1>RayCast Angle 2d</h1>
      <RayCastAngle2d /> */}
      {/* {/* <h1>ShadowCasting</h1>
      <ShadowCasting /> */}
      <h1>ShadowCasting Iso</h1>
      <ShadowCasting />
      {/* <h1>Drawing</h1>
			<Drawing />
			<h1>Mouse Hunter</h1>
			<MouseHunter />
			<h1>Ship</h1>
			<div className="keys">
				<span className="key">W: Thrust</span>
				<span className="key">A: Rotate Left</span>
				<span className="key">D: Rotate Right</span>
			</div>
			<Ship />
			<h1>Hall</h1>
			<Hall />
			<h1>Assets</h1>
			<Assets /> */}
    </div>
  )
}

const rootElement = document.getElementById("root")
render(<App />, rootElement)
