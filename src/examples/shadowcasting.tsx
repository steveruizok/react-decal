import React from "react";
import { Vec2d, pointsToPolygon, pointToCircle } from "../utils";
import { Point, Rectangle, Visible } from "./shadowcasting/";
import Decal, { DC, FC, MC } from "../Decal";

type S = {
  lights: { x: number; y: number }[];
  map: Rectangle[];
  room: Rectangle;
  visible: Visible;
};

function getWorldFromMap(map: string, width: number, height: number) {
  const world = {
    room: new Rectangle(0, 0, width, height),
    map: [] as Rectangle[],
    lights: [] as { x: number; y: number }[]
  };

  let legend: { [key: string]: any } = {
    "#": (x: number, y: number) => {
      world.map.push(
        new Rectangle(
          (x / 20) * width,
          (y * height) / 20,
          width / 20,
          height / 20
        )
      );
    },
    "*": (x: number, y: number) => {
      world.lights.push({
        x: x * (width / 20),
        y: y * (height / 20)
      });
    }
  };

  const rows = map.slice(1, -1).split("\n");

  for (let y = 0; y < rows.length; y++) {
    let row = rows[y];
    for (let x = 0; x < row.length; x++) {
      let char = row[x];
      if (legend[char] !== undefined) {
        legend[char](x, y);
      }
    }
  }

  return world;
}

const draw: DC<S> = ({ ctx, info }) => {
  const { height, width } = info.size;

  const state = getWorldFromMap(
    `
....................
..........#.........
...#................
..#.................
...#................
....................
....................
....................
....................
....................
....................
  `,
    width,
    height
  );

  const world = [...state.map, state.room];

  ctx.save();
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, info.size.width, info.size.height);
  ctx.restore();

  const visible = new Visible(world, width, height);

  for (let light of state.lights) {
    const lightSource = new Vec2d(light.x, light.y);
    visible.origin = lightSource;
    paintLight(ctx, lightSource, visible.polygon, 200);
  }

  paintMap(ctx, state.map);

  return { ...state, visible };
};

const onClick: MC<S> = ({ state, info }) => {
  if (info.keys.has("w")) {
    state.lights.push(new Vec2d(info.mouse.x, info.mouse.y));
  } else {
    state.map.push(new Rectangle(info.mouse.x, info.mouse.y, 8, 8));
    state.visible.setMap(state.map);
  }
};

const onMouseMove: MC<S> = ({ ctx, state, info }) => {
  if (info.clicked) {
    state.map.push(new Rectangle(info.mouse.x + 2, info.mouse.y + 2, 8, 8));
  }

  ctx.save();
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, info.size.width, info.size.height);
  ctx.restore();

  for (let light of state.lights) {
    const lightSource = new Vec2d(light.x, light.y);
    state.visible.origin = lightSource;
    paintLight(ctx, lightSource, state.visible.polygon, 200);
  }

  if (info.hovered) {
    const lightSource = new Vec2d(info.mouse.x, info.mouse.y);
    state.visible.origin = lightSource;
    paintLight(ctx, lightSource, state.visible.polygon, 200);
  }

  paintMap(ctx, state.map);
};

const ShadowCasting: React.FC = props => {
  return (
    <Decal
      height={320}
      width={480}
      draw={draw}
      onClick={onClick}
      onMouseMove={onMouseMove}
      wipe={true}
    />
  );
};

export default ShadowCasting;

// Helpers

function paintLight(
  ctx: CanvasRenderingContext2D,
  origin: Vec2d,
  visibility: Point[],
  radius: number
) {
  // Turn visibility polygon into a path
  const path = new Path2D();

  if (visibility.length === 0) {
    return;
  }

  path.moveTo(visibility[0].x, visibility[0].y);

  for (let point of visibility) {
    path.lineTo(point.x, point.y);
  }

  path.closePath();

  // Generate light gradient
  const gradient = ctx.createRadialGradient(
    origin.x,
    origin.y,
    4,
    origin.x,
    origin.y,
    radius
  );

  gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
  gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

  ctx.save();
  ctx.fillStyle = "rgba(255, 255, 255, .2)";
  ctx.fill(path);
  ctx.fill(pointToCircle(origin, 4));
  ctx.restore();
}

function paintMap(ctx: CanvasRenderingContext2D, map: Rectangle[]) {
  ctx.beginPath();
  const path = new Path2D();
  for (let rectangle of map) {
    path.addPath(pointsToPolygon(...Object.values(rectangle.getCorners())));
  }

  ctx.save();
  ctx.fillStyle = "#fff";
  ctx.strokeStyle = "#000";
  ctx.fill(path);
  ctx.restore();

  ctx.font = "bold 14px/14px sans-serif";
  ctx.fillStyle = "red";
  for (let block of map) {
    console.log(block.getVisible());
    ctx.fillText(block.getVisible().toString(), block.x, block.y - 2);
  }
}
