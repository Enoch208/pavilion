import { useFrame, type ThreeEvent } from "@react-three/fiber";
import type { PlacedObject } from "@shared/contracts/layout";
import { objectBlocks, type BlockTone } from "@shared/scene/blocks";
import { memo, useMemo, useRef } from "react";
import type { BoxGeometry, CylinderGeometry, Group, Material } from "three";

import { SceneGroup, SceneMesh } from "./three-elements";
import type { BlockState } from "./use-scene-materials";

const RISE_SECONDS = 0.7;
const FLAT_KINDS = new Set<PlacedObject["kind"]>(["zone", "exit-zone"]);

export type SceneGeometries = { box: BoxGeometry; cylinder: CylinderGeometry };

type Props = {
  object: PlacedObject;
  state: BlockState;
  rise: boolean;
  geometries: SceneGeometries;
  material: (tone: BlockTone, state: BlockState) => Material;
  onClick: ((object: PlacedObject, additive: boolean) => void) | null;
  onHover: (object: PlacedObject | null) => void;
};

function easeOut(progress: number) {
  return 1 - (1 - progress) ** 3;
}

export const SceneObject = memo(function SceneObject(props: Props) {
  const { object } = props;
  const blocks = useMemo(() => objectBlocks(object), [object]);
  const group = useRef<Group>(null);
  const startedAt = useRef<number | null>(null);
  const risen = useRef(false);
  const flat = FLAT_KINDS.has(object.kind);

  useFrame(({ clock, invalidate }) => {
    const node = group.current;
    if (!props.rise || !node || risen.current) return;
    startedAt.current ??= clock.elapsedTime;
    const progress = Math.min(
      1,
      (clock.elapsedTime - startedAt.current) / RISE_SECONDS,
    );
    node.scale.y = Math.max(0.001, easeOut(progress));
    if (progress < 1) invalidate();
    else risen.current = true;
  });

  return (
    <SceneGroup
      ref={group}
      onClick={(event: ThreeEvent<MouseEvent>) => {
        if (!props.onClick || flat) return;
        event.stopPropagation();
        props.onClick(object, event.nativeEvent.shiftKey);
      }}
      onPointerOver={(event: ThreeEvent<PointerEvent>) => {
        if (flat) return;
        event.stopPropagation();
        props.onHover(object);
      }}
      onPointerOut={() => props.onHover(null)}
    >
      {blocks.map((block) => (
        <SceneMesh
          key={block.key}
          geometry={props.geometries[block.shape]}
          material={props.material(block.tone, props.state)}
          position={[...block.centre]}
          scale={[...block.size]}
          castShadow={!flat}
          receiveShadow
        />
      ))}
    </SceneGroup>
  );
});
