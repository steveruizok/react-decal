import * as React from "react";
import { render } from "react-dom";
import Drawing from "./examples/drawing";
import MouseHunter from "./examples/mouseHunter";
import Ship from "./examples/ship";
import Hall from "./examples/hall";
import Assets from "./examples/assets";
import ShadowCasting from "./examples/shadowcasting";
import ShadowCasting2 from "./examples/shadowcasting2";

import "./styles.css";

function App() {
  return (
    <div className="App">
      <h1>ShadowCasting</h1>
      <ShadowCasting />
      <h1>ShadowCasting2</h1>
      <ShadowCasting2 />
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
  );
}

const rootElement = document.getElementById("root");
render(<App />, rootElement);
