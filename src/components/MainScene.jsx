import { useState, useEffect, useRef } from 'react';
import {
  Canvas,
  useThree,
} from '@react-three/fiber';
import {
  OrbitControls,
  Grid,
  TransformControls,
  PerspectiveCamera,
  OrthographicCamera,
} from '@react-three/drei';

import RiggedModel from './RiggedModel';
import MoveableLight from './MoveableLight';
import ControlsManager from './ControlsManager';
import useTransformControl from './useTransformControl';

export default function MainScene({
  transformMode,
  isTransforming,
  setIsTransforming,
  showGrid,
  castShadows,
  cameraType,
  fov,
  modelSelected,
  onSelectModel,
  bones,
  selectedBoneId,
  onSelectBone,
  selectedLightName,
  onSelectLight,
  lightColor,
  lightIntensity,
  onBonesLoaded,
}) {
  const lights = [{ name: 'MainLight' }];

  // whole‑model gizmo
  const modelCtrl = useTransformControl(setIsTransforming);
  const [modelObj, setModelObj] = useState(null);

  // single‑bone gizmo
  const boneCtrl = useTransformControl(setIsTransforming);
  const [bone, setBone] = useState(null);

  useEffect(() => {
    setBone(bones.find((b) => b.uuid === selectedBoneId) || null);
  }, [bones, selectedBoneId]);

  useEffect(() => {
    if (!modelCtrl.current || !modelObj) return;
    modelSelected ? modelCtrl.current.attach(modelObj) : modelCtrl.current.detach();
  }, [modelSelected, modelObj]);

  useEffect(() => {
    bone ? boneCtrl.current?.attach(bone) : boneCtrl.current?.detach();
  }, [bone]);

  return (
    <Canvas shadows={castShadows} style={{ width: '100%', height: '100%' }}>
      {cameraType === 'perspective' ? (
        <PerspectiveCamera makeDefault position={[0, 2, 5]} fov={fov} />
      ) : (
        <OrthographicCamera makeDefault position={[0, 2, 5]} zoom={50} />
      )}

      <OrbitControls makeDefault />
      <ControlsManager isTransforming={isTransforming} />

      {showGrid && <Grid cellSize={1} sectionSize={20} infiniteGrid />}
      {castShadows && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[20, 20]} />
          <shadowMaterial opacity={0.5} />
        </mesh>
      )}

      <RiggedModel
        castShadows={castShadows}
        onSelectModel={onSelectModel}
        onModelReady={setModelObj}
        onBonesLoaded={onBonesLoaded}
      />

      <TransformControls ref={modelCtrl} mode={transformMode} space="local" />
      <TransformControls ref={boneCtrl} mode={transformMode} space="local" />

      <MoveableLight
        mode={transformMode}
        setIsTransforming={setIsTransforming}
        castShadows={castShadows}
        isSelected={selectedLightName === 'MainLight'}
        onSelect={onSelectLight}
        lightColor={lightColor}
        lightIntensity={lightIntensity}
        lightName="MainLight"
      />
    </Canvas>
  );
}
