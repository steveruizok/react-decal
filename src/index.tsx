import * as React from "react"
import { render } from "react-dom"
import Drawing from "./examples/drawing"
import MouseHunter from "./examples/mouseHunter"
import Spline from "./examples/splines/spline"
import Spline2 from "./examples/splines/spline2"
import SplinePoints from "./examples/splines/splinePoints"
import Ship from "./examples/ship"
import Hall from "./examples/hall"
import Assets from "./examples/assets"
import RayTracing from "./examples/raytracing/raytracing"
import RayCast2d from "./examples/raycast2d"
import RayCastAngle2d from "./examples/raycastAngle2d"
import ShadowCasting2 from "./examples/shadowcasting2"
import ShadowCasting3 from "./examples/shadowcasting3"
import ShadowCasting4 from "./examples/shadows/"
import Shadows from "./examples/shadows/shadows"
import Iso from "./examples/iso/iso"
import IsoShadows from "./examples/iso/isoShadows"

import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom"

import "./styles.css"

const routes = [
  {
    name: "Iso",
    path: "/iso/iso",
    component: Iso,
    description: "An isometric world of cubes.",
    instructions: []
  },
  {
    name: "Splines",
    path: "/splines/spline",
    component: Spline,
    description: "Spline drawing.",
    instructions: [
      "Draw to add points to the path.",
      "Release to convert points to a spline.",
      "A good algorithm should produce a very smooth line."
    ]
  },
  {
    name: "Splines 2",
    path: "/splines/spline2",
    component: Spline2,
    description: "Spline drawing, second version.",
    instructions: [
      "Draw to add points to the spline.",
      "Release to convert points to a spline.",
      "A good algorithm should produce a very smooth line."
    ]
  },
  {
    name: "Spline Points",
    path: "/splines/splinePoints",
    component: SplinePoints,
    description: "Create a spline by adding points.",
    instructions: [
      "Press Q and E to select a point.",
      "Press W S A D to move the selected point.",
      "Click to add points"
    ]
  },
  {
    name: "Shadows",
    path: "/shadows/shadows",
    component: Shadows,
    description: "Shadowcasting.",
    instructions: [
      "Move the mouse to cast shadows.",
      "Click to add objects to the scene."
    ]
  },
  {
    name: "Iso Shadows",
    path: "/iso/iso-shadows",
    component: IsoShadows,
    description: "An isometric world of cubes with shadowcasting.",
    instructions: []
  }
]

function App() {
  return (
    <div className="App">
      <Router>
        <h1>Decal Examples</h1>
        <ul>
          {routes.map((route, i) => (
            <li key={i}>
              <Link to={route.path}>{route.name}</Link> — {route.description}
            </li>
          ))}
        </ul>
        <Switch>
          {routes.map((route, i) => (
            <Route key={i} path={route.path}>
              <route.component />
              <ul>
                {route.instructions.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </Route>
          ))}
        </Switch>
      </Router>
    </div>
  )
}

const rootElement = document.getElementById("root")
render(<App />, rootElement)
