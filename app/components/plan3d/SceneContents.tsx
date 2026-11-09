import { useThree } from "@react-three/fiber";
import type { PlacedObject } from "@shared/contracts/layout";
import type { LayoutView } from "@shared/contracts/view";
import { venueBlocks } from "@shared/scene/blocks";
import { useEffect, useMemo } from "react";
import { BufferGeometry, Float32BufferAttribute } from "three";

import type { Review } from "@/components/plan/FloorPlanCanvas";

import { OrbitRig } from "./OrbitRig";
import type { ScenePalette } from "./scene-palette";
import { SceneObject } from "./SceneObject";
import {
  SceneBackground,
  SceneDirectionalLight,
  SceneGroup,
  SceneHemisphereLight,
  SceneLineMaterial,
  SceneLines,
  SceneMesh,
} from "./three-elements";
import {
  useSceneGeometries,
  useSceneMaterials,
  type BlockState,
} from "./use-scene-materials";

type Props = {
  view: LayoutView;
  review: Review | null;
  selectedIds: ReadonlySet<string>;
  palette: ScenePalette;
  resetKey: number;
  animate: boolean;
  onClick: ((object: PlacedObject, additive: boolean) => void) | null;
  onHover: (object: PlacedObject | null) => void;
};

function FloorGrid(props: { widthM: number; depthM: number; colour: string }) {
  const { widthM, depthM } = props;
  const geometry = useMemo(() => {
    const points: number[] = [];
    for (let x = 0; x <= widthM + 1e-6; x += 1) {
      points.push(x, 0.001, 0, x, 0.001, depthM);
    }
    for (let z = 0; z <= depthM + 1e-6; z += 1) {
      points.push(0, 0.001, z, widthM, 0.001, z);
    }
    const lines = new BufferGeometry();
    lines.setAttribute("position", new Float32BufferAttribute(points, 3));
    return lines;
  }, [widthM, depthM]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <SceneLines geometry={geometry}>
      <SceneLineMaterial color={props.colour} transparent opacity={0.7} />
    </SceneLines>
  );
}

function stateOf(props: Props, id: string): BlockState {
  if (props.review) {
    if (props.review.diff.added.has(id)) return "added";
    if (props.review.diff.moved.has(id)) return "moved";
    return "plain";
  }
  return props.selectedIds.has(id) ? "selected" : "plain";
}

export function SceneContents(props: Props) {
  const { palette, review } = props;
  const { widthMm, heightMm } = props.view.venue;
  const widthM = widthMm / 1_000;
  const depthM = heightMm / 1_000;
  const span = Math.max(widthM, depthM);
  const geometries = useSceneGeometries();
  const material = useSceneMaterials(palette);
  const venue = useMemo(
    () => venueBlocks({ widthMm, heightMm }),
    [widthMm, heightMm],
  );
  const objects = review?.objects ?? props.view.objects;
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => {
    invalidate();
  }, [invalidate, objects, review, props.selectedIds, palette]);

  return (
    <>
      <SceneBackground attach="background" args={[palette.background]} />
      <SceneHemisphereLight args={[palette.sky, palette.ground, 1.2]} />
      <SceneDirectionalLight
        position={[-span * 0.3, span * 1.1, span * 0.5]}
        intensity={1.9}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-camera-left={-span * 0.8}
        shadow-camera-right={span * 0.8}
        shadow-camera-top={span * 0.8}
        shadow-camera-bottom={-span * 0.8}
        shadow-camera-near={0.5}
        shadow-camera-far={span * 3}
      />
      <SceneGroup position={[-widthM / 2, 0, -depthM / 2]}>
        {venue.map((block) => (
          <SceneMesh
            key={block.key}
            geometry={geometries.box}
            material={material(block.tone, "plain")}
            position={[...block.centre]}
            scale={[...block.size]}
            castShadow={block.tone === "wall"}
            receiveShadow
          />
        ))}
        <FloorGrid widthM={widthM} depthM={depthM} colour={palette.grid} />
        {objects.map((object) => {
          const state = stateOf(props, object.id);
          return (
            <SceneObject
              key={object.id}
              object={object}
              state={state}
              rise={props.animate && state === "added"}
              geometries={geometries}
              material={material}
              onClick={props.onClick}
              onHover={props.onHover}
            />
          );
        })}
        {review?.diff.removed.map((object) => (
          <SceneObject
            key={`removed-${object.id}`}
            object={object}
            state="removed"
            rise={false}
            geometries={geometries}
            material={material}
            onClick={null}
            onHover={props.onHover}
          />
        ))}
      </SceneGroup>
      <OrbitRig widthM={widthM} depthM={depthM} resetKey={props.resetKey} />
    </>
  );
}
