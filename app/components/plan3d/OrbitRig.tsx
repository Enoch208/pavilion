import { useThree } from "@react-three/fiber";
import { useEffect, useState } from "react";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const WIDE_ASPECT = 1.35;

export function homeView(widthM: number, depthM: number, aspect = WIDE_ASPECT) {
  const span = Math.max(widthM, depthM);
  const pullBack = Math.max(1, WIDE_ASPECT / aspect);
  return {
    target: [0, 0, -depthM * 0.05] as const,
    position: [
      span * 0.36 * pullBack,
      span * 0.52 * pullBack,
      depthM / 2 + span * 0.45 * pullBack,
    ] as const,
  };
}

type Props = { widthM: number; depthM: number; resetKey: number };

export function OrbitRig({ widthM, depthM, resetKey }: Props) {
  const camera = useThree((state) => state.camera);
  const canvas = useThree((state) => state.gl.domElement);
  const invalidate = useThree((state) => state.invalidate);
  const getState = useThree((state) => state.get);
  const [controls, setControls] = useState<OrbitControls | null>(null);

  useEffect(() => {
    const next = new OrbitControls(camera, canvas);
    next.maxPolarAngle = Math.PI * 0.47;
    next.minDistance = 2;
    next.screenSpacePanning = false;
    const render = () => invalidate();
    next.addEventListener("change", render);
    setControls(next);
    return () => {
      next.removeEventListener("change", render);
      next.dispose();
    };
  }, [camera, canvas, invalidate]);

  useEffect(() => {
    if (!controls) return;
    const { width, height } = getState().size;
    const home = homeView(widthM, depthM, width / Math.max(1, height));
    camera.position.set(...home.position);
    controls.target.set(...home.target);
    controls.maxDistance = Math.max(widthM, depthM) * 3;
    controls.update();
    invalidate();
  }, [controls, camera, widthM, depthM, resetKey, invalidate, getState]);

  return null;
}
