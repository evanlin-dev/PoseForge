import { useRef, useEffect } from 'react';

// Controls the viewport when transforming so OrbitControls is disabled
export default function useTransformControl(setIsTransforming) {
  const transformRef = useRef();

  useEffect(() => {
    const controls = transformRef.current;
    if (!controls) return;

    const onDrag = (e) => setIsTransforming(e.value);
    controls.addEventListener('dragging-changed', onDrag);
    return () => controls.removeEventListener('dragging-changed', onDrag);
  }, [setIsTransforming]);

  return transformRef;
}
