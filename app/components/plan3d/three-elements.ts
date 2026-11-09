import { extend } from "@react-three/fiber";
import {
  Color,
  DirectionalLight,
  Group,
  HemisphereLight,
  LineBasicMaterial,
  LineSegments,
  Mesh,
} from "three";

export const SceneBackground = extend(Color);
export const SceneDirectionalLight = extend(DirectionalLight);
export const SceneGroup = extend(Group);
export const SceneHemisphereLight = extend(HemisphereLight);
export const SceneLineMaterial = extend(LineBasicMaterial);
export const SceneLines = extend(LineSegments);
export const SceneMesh = extend(Mesh);
