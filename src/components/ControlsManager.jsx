import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';

export default function ControlsManager({ isTransforming }) {
  const { controls } = useThree();
  useEffect(() => {
    if (controls && 'enabled' in controls) controls.enabled = !isTransforming;
  }, [controls, isTransforming]);
  return null;
}
