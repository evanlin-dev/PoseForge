import { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { useLoader } from '@react-three/fiber';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { SkeletonHelper } from 'three';

export default function RiggedModel({
  castShadows,
  url = '/model.fbx',
  onSelectModel,
  onModelReady,
  onBonesLoaded,
}) {

  const fbx = useLoader(FBXLoader, url);
  const clone = useMemo(() => (fbx ? SkeletonUtils.clone(fbx) : null), [fbx]);

  const modelRef = useRef();
  const [helper, setHelper] = useState(null);
  const sentBones = useRef(false);

  useEffect(() => {
    if (!clone || sentBones.current) return;

    // Scale to fit
    const bbox = new THREE.Box3().setFromObject(clone);
    const longest = Math.max(...bbox.getSize(new THREE.Vector3()).toArray());
    clone.scale.setScalar(2 / longest);

    // Traverse and hide extras
    const skinned = [];
    clone.traverse((child) => {
      if (child.isBone) child.visible = false;
      if (child.isMesh) {
        child.castShadow = child.receiveShadow = castShadows;
        if ((child.geometry?.type || '').toLowerCase().includes('sphere'))
          child.visible = false;
      }
      if (child.isSkinnedMesh) {
        skinned.push(child);
        (Array.isArray(child.material) ? child.material : [child.material]).forEach(
          (m) => ((m.skinning = true), (m.needsUpdate = true)),
        );
      }
    });

    modelRef.current.clear();
    modelRef.current.add(clone);

    if (!sentBones.current && skinned.length) {
      onBonesLoaded?.(skinned[0].skeleton.bones);
      sentBones.current = true;
    }

    if (skinned.length) {
      const h = new SkeletonHelper(skinned[0]);
      h.visible = false;
      modelRef.current.add(h);
      setHelper(h);
    }

    onModelReady?.(modelRef.current);
    return () => helper?.dispose();
  }, [clone, castShadows, onBonesLoaded, onModelReady, helper]);

  return (
    <group
      ref={modelRef}
      onClick={(e) => {
        e.stopPropagation();
        onSelectModel?.();
      }}
    />
  );
}
