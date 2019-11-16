export interface Point2 {
  x: number
  y: number
}
export interface Point3 extends Point2 {
  z: number
}

export enum Vert {
  Center = "center",
  CenterDown = "centerDown",
  BackDown = "backDown",
  RightDown = "rightDown",
  FrontDown = "frontDown",
  LeftDown = "leftDown",
  CenterUp = "centerUp",
  BackUp = "backUp",
  RightUp = "rightUp",
  FrontUp = "frontUp",
  LeftUp = "leftUp"
}

export type Verts<T> = Record<Vert, T>
