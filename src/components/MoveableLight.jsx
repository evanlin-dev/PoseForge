import { useRef, useEffect } from 'react';
import { DirectionalLightHelper } from 'three';
import { TransformControls, useHelper } from '@react-three/drei';
import useTransformControl from './useTransformControl';

export default function MoveableLight({
  mode,
  setIsTransforming,
  castShadows,
  isSelected,
  onSelect,
  lightColor,
  lightIntensity,
  lightName,
}) {
  const lightRef = useRef();
  const targetRef = useRef();

  const lightCtrl = useTransformControl(setIsTransforming);
  const targetCtrl = useTransformControl(setIsTransforming);

  useEffect(() => {
    if (lightRef.current) lightRef.current.target = targetRef.current;
  }, []);

  useEffect(() => {
    lightRef.current?.color.set(lightColor);
  }, [lightColor]);

  useHelper(lightRef, DirectionalLightHelper, 5);

  return (
    <>
      <mesh ref={targetRef} position={[0, 0, 0]} visible={false} />
      <directionalLight
        ref={lightRef}
        position={[5, 5, 5]}
        intensity={lightIntensity}
        color={lightColor}
        castShadow={castShadows}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(lightName);
        }}
      />
      {isSelected && (
        <>
          <TransformControls ref={lightCtrl} mode={mode} object={lightRef.current} />
          <TransformControls ref={targetCtrl} mode={mode} object={targetRef.current} />
        </>
      )}
    </>
  );
}
