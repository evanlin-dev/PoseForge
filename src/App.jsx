import React, { useRef, useState, useEffect } from 'react'
import * as THREE from 'three'
import { Canvas, useThree, useLoader } from '@react-three/fiber'
import {
  OrbitControls,
  Grid,
  TransformControls,
  PerspectiveCamera,
  OrthographicCamera,
  useHelper
} from '@react-three/drei'
import { DirectionalLightHelper, SkeletonHelper } from 'three'
import { SketchPicker } from 'react-color'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'

function useTransformControl(setIsTransforming) {
  const transformRef = useRef()
  useEffect(() => {
    const controls = transformRef.current
    if (!controls) return

    const handleDraggingChanged = (event) => {
      setIsTransforming(event.value)
      console.log('Transform state changed:', event.value)
    }

    controls.addEventListener('dragging-changed', handleDraggingChanged)
    return () => {
      controls.removeEventListener('dragging-changed', handleDraggingChanged)
    }
  }, [setIsTransforming])
  return transformRef
}

 function RiggedModel({
  castShadows,
  url = '/model.fbx',
  isSelectedModel,
  onSelectModel,
  onModelReady,
  onBonesLoaded,
}) {
  const fbx = useLoader(FBXLoader, url)
  const modelRef = useRef()
  const [skeletonHelper, setSkeletonHelper] = useState(null)
  
  useEffect(() => {
    if (!fbx) return

    // Clone the FBX to avoid modifying the cached version
    const clonedFbx = fbx.clone()
    
    clonedFbx.scale.set(0.001, 0.001, 0.001)
    
    // 1) Remove embedded animations so they don't reset pose
    if (clonedFbx.animations && clonedFbx.animations.length > 0) {
      clonedFbx.animations.splice(0, clonedFbx.animations.length)
      console.log('Removed embedded animations from FBX to avoid pose resets.')
    }

    // Set the cloned model to the ref
    modelRef.current.clear()
    modelRef.current.add(clonedFbx)

    let skinnedMeshes = []
    let bonesFound = []
    
    // Find all skinned meshes and bones
    clonedFbx.traverse((child) => {
      // Make bones invisible
      if (child.isBone) {
        child.visible = false
        bonesFound.push(child)
      }

      // Hide Mixamo spheres or any end-effectors
      if (child.isMesh) {
        const geoType = child.geometry?.type?.toLowerCase() || ''
        if (geoType.includes('sphere')) {
          child.visible = false
        }
        child.castShadow = castShadows
        child.receiveShadow = castShadows
      }

      // Collect ALL skinned meshes
      if (child.isSkinnedMesh) {
        skinnedMeshes.push(child)
        
        // Ensure the material has skinning enabled
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => {
              mat.skinning = true
              mat.needsUpdate = true
            })
          } else {
            child.material.skinning = true
            child.material.needsUpdate = true
          }
        }
      }
    })

    // Process all skinned meshes to ensure proper binding
    if (skinnedMeshes.length > 0) {
      skinnedMeshes.forEach(mesh => {
        if (mesh.skeleton) {
          // Ensure the bones are properly set up
          mesh.skeleton.bones.forEach(bone => {
            bone.matrixAutoUpdate = true
          })
          
          // Rebind to ensure deformation works
          const bindMatrix = mesh.bindMatrix.clone();
          mesh.bind(mesh.skeleton, bindMatrix);
          
          // Force an update
          mesh.skeleton.update();
        }
      });
      
      // Let parent have the bones for manipulation
      // Use the first skinned mesh's skeleton for bones
      if (onBonesLoaded && skinnedMeshes[0].skeleton) {
        onBonesLoaded(skinnedMeshes[0].skeleton.bones);
      }

      // Create a SkeletonHelper for the first skinned mesh
      const helper = new SkeletonHelper(skinnedMeshes[0])
      helper.material = new THREE.LineBasicMaterial({ 
        color: 0x00ff00,
        transparent: true,
        opacity: 0.6
      })
      // Make helper visible for debugging, but not visible in final product
      helper.visible = false 
      modelRef.current.add(helper)
      setSkeletonHelper(helper)
    } else if (bonesFound.length > 0) {
      // If no skinned mesh but bones found, still pass them to parent
      if (onBonesLoaded) {
        onBonesLoaded(bonesFound)
      }
    }

    // Let parent know the root object
    if (onModelReady) {
      onModelReady(modelRef.current)
    }
    
    return () => {
      // Clean up on unmount
      if (skeletonHelper) {
        skeletonHelper.dispose()
      }
    }
  }, [fbx, castShadows, onBonesLoaded, onModelReady])

  return (
    <group 
      ref={modelRef}
      position={[0, 0, 0]}
      onClick={(e) => {
        e.stopPropagation()
        onSelectModel?.()
      }}
    />
  )
}

function MoveableLight({
  mode,
  setIsTransforming,
  castShadows,
  isSelected,
  onSelect,
  lightColor,
  lightIntensity,
  lightName,
}) {
  const lightRef = useRef()
  const transformRef = useTransformControl(setIsTransforming)
  const targetRef = useTransformControl(setIsTransforming)
  const lightTargetRef = useRef()

  useEffect(() => {
    if (lightRef.current) {
      lightRef.current.target = lightTargetRef.current
    }
  }, [])

  useEffect(() => {
    if (lightRef.current) {
      lightRef.current.color.set(lightColor)
    }
  }, [lightColor])

  useHelper(lightRef, DirectionalLightHelper, 5)

  return (
    <>
      <mesh ref={lightTargetRef} position={[0, 0, 0]} visible={false} />
      <directionalLight
        ref={lightRef}
        position={[5, 5, 5]}
        intensity={lightIntensity}
        color={lightColor}
        castShadow={castShadows}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />

      {isSelected && (
        <>
          <TransformControls
            ref={transformRef}
            mode={mode}
            object={lightRef.current}
            onObjectChange={() => {
              if (lightRef.current) {
                lightRef.current.position.copy(lightRef.current.position)
              }
            }}
          />
          <TransformControls
            ref={targetRef}
            mode={mode}
            object={lightTargetRef.current}
            onObjectChange={() => {
              if (lightRef.current && lightTargetRef.current) {
                lightRef.current.target.position.copy(lightTargetRef.current.position)
              }
            }}
          />
        </>
      )}
    </>
  )
}

function SceneHierarchy({
  lights,
  selectedLightName,
  onSelectLight,

  modelName,
  modelSelected,
  onSelectModel,

  bones,
  selectedBoneId,
  onSelectBone,
}) {
  const [lightsExpanded, setLightsExpanded] = useState(true)
  const [modelExpanded, setModelExpanded] = useState(true)

  return (
    <div style={{ background: '#333', padding: '0.5rem' }}>
      <h4 style={{ margin: 0 }}>Scene Hierarchy</h4>

      {/* Lights */}
      <div style={{ marginTop: '0.5rem' }}>
        <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <span
            style={{ marginRight: '0.5rem' }}
            onClick={(e) => {
              e.stopPropagation()
              setLightsExpanded((prev) => !prev)
            }}
          >
            {lightsExpanded ? '▼' : '▶'}
          </span>
          <b>Lights</b>
        </div>
        {lightsExpanded && (
          <div style={{ marginLeft: '1rem' }}>
            {lights.map((l) => (
              <div
                key={l.name}
                onClick={(e) => {
                  e.stopPropagation()
                  onSelectLight(l.name)
                }}
                style={{
                  cursor: 'pointer',
                  color: selectedLightName === l.name ? 'orange' : '#ccc',
                  margin: '2px 0',
                }}
              >
                {l.name}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Model + Bones */}
      <div style={{ marginTop: '1rem' }}>
        <div
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          onClick={(e) => {
            e.stopPropagation()
            onSelectModel()
          }}
        >
          <span
            style={{ marginRight: '0.5rem' }}
            onClick={(e) => {
              e.stopPropagation()
              setModelExpanded((prev) => !prev)
            }}
          >
            {modelExpanded ? '▼' : '▶'}
          </span>
          <b style={{ color: modelSelected ? 'orange' : '#ccc' }}>{modelName}</b>
        </div>
        {modelExpanded && bones.length > 0 && (
          <div style={{ marginLeft: '1rem', marginTop: '0.5rem' }}>
            {bones.map((bone) => (
              <div
                key={bone.uuid}
                onClick={(e) => {
                  e.stopPropagation()
                  onSelectBone(bone.uuid)
                }}
                style={{
                  cursor: 'pointer',
                  color: bone.uuid === selectedBoneId ? 'orange' : '#ccc',
                  margin: '2px 0',
                }}
              >
                {bone.name}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function AddItemDropdown({ isOpen, onClose, onAddModel, onAddLight }) {
  const [activeSubMenu, setActiveSubMenu] = useState(null)
  if (!isOpen) return null

  return (
    <div style={styles.addItemDropdown}>
      <button onClick={() => setActiveSubMenu('models')}>Models</button>
      <button onClick={() => setActiveSubMenu('lights')}>Lights</button>
      <button onClick={() => { setActiveSubMenu(null); onClose(); }}>Cancel</button>
      {activeSubMenu && (
        <div style={styles.subMenu}>
          {activeSubMenu === 'models' ? (
            <>
              <button onClick={() => { onAddModel(); setActiveSubMenu(null); onClose(); }}>Cube</button>
              <button onClick={() => { onAddModel(); setActiveSubMenu(null); onClose(); }}>Sphere</button>
            </>
          ) : (
            <>
              <button onClick={() => { onAddLight(); setActiveSubMenu(null); onClose(); }}>Directional</button>
              <button onClick={() => { onAddLight(); setActiveSubMenu(null); onClose(); }}>Point</button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function ControlsManager({ isTransforming }) {
  const { controls } = useThree()
  useEffect(() => {
    if (controls && 'enabled' in controls) {
      controls.enabled = !isTransforming
    }
  }, [controls, isTransforming])
  return null
}

function MainScene({
  transformMode,
  isTransforming,
  setIsTransforming,
  showGrid,
  castShadows,
  cameraType,
  fov,

  // Model
  modelSelected,
  onSelectModel,

  // Bones
  bones,
  selectedBoneId,
  onSelectBone,

  // Light
  selectedLightName,
  onSelectLight,
  lightColor,
  lightIntensity,

  // Callback
  onBonesLoaded,
}) {
  const [lights] = useState([{ name: 'MainLight' }])

  // TransformControls for entire model
  const modelTransformRef = useTransformControl(setIsTransforming)
  const [modelObject, setModelObject] = useState(null)

  // TransformControls for a selected bone
  const boneTransformRef = useTransformControl(setIsTransforming)
  const [selectedBone, setSelectedBone] = useState(null)

  // Grab the actual bone from bones[] whenever user picks a bone ID
  useEffect(() => {
    if (!bones || bones.length === 0) {
      setSelectedBone(null)
      return
    }
    const bone = bones.find((b) => b.uuid === selectedBoneId) || null
    setSelectedBone(bone)
  }, [bones, selectedBoneId])

  // Attach or detach the entire model to modelTransformRef
  useEffect(() => {
    if (!modelTransformRef.current || !modelObject) return
    if (modelSelected) {
      modelTransformRef.current.attach(modelObject)
    } else {
      modelTransformRef.current.detach()
    }
  }, [modelSelected, modelObject])

  // Attach or detach the selected bone to boneTransformRef
  useEffect(() => {
    if (!boneTransformRef.current) return
    if (selectedBone) {
      boneTransformRef.current.attach(selectedBone)
    } else {
      boneTransformRef.current.detach()
    }
  }, [selectedBone])

  return (
    <Canvas shadows={castShadows} style={{ width: '100%', height: '100%' }}>
      {cameraType === 'perspective' ? (
        <PerspectiveCamera makeDefault position={[0, 2, 5]} fov={fov} />
      ) : (
        <OrthographicCamera makeDefault position={[0, 2, 5]} zoom={50} />
      )}
      <OrbitControls makeDefault />
      <ControlsManager isTransforming={isTransforming} />

      {showGrid && (
        <Grid
          cellSize={1}
          cellThickness={1}
          sectionSize={20}
          sectionThickness={1}
          fadeDistance={30}
          fadeStrength={1}
          infiniteGrid
        />
      )}
      {castShadows && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[20, 20]} />
          <shadowMaterial opacity={0.5} />
        </mesh>
      )}

      {/* The rigged Mixamo FBX (with invisible skeleton + bones) */}
      <RiggedModel
        castShadows={castShadows}
        url="/model.fbx"
        isSelectedModel={modelSelected}
        onSelectModel={onSelectModel}
        onModelReady={(obj) => setModelObject(obj)}
        onBonesLoaded={onBonesLoaded}
      />

      {/* TransformControls for the entire model */}
      <TransformControls
        ref={modelTransformRef}
        mode={transformMode}
        space="local"
      />

      {/* TransformControls for a single bone.
          We'll also do a final "onObjectChange" to ensure the new rotation stays. */}
      <TransformControls
        ref={boneTransformRef}
        mode={transformMode}
        space="local"
        onObjectChange={() => {
          if (selectedBone) {
            // Update the bone's matrix
            selectedBone.updateMatrix()

            // Force the world matrix to update
            selectedBone.updateMatrixWorld(true)

            // Make sure parent bones are also updated
            if (selectedBone.parent && selectedBone.parent.isBone) {
              selectedBone.parent.updateMatrixWorld(true)
            }

            // If the bone has children, update them too
            if (selectedBone.children && selectedBone.children.length > 0) {
              selectedBone.children.forEach(child => {
                if (child.isBone) {
                  child.updateMatrixWorld(true)
                }
              })
            }

            console.log(`Bone ${selectedBone.name} updated. Its new rotation is:`, {
              x: selectedBone.rotation.x.toFixed(2),
              y: selectedBone.rotation.y.toFixed(2),
              z: selectedBone.rotation.z.toFixed(2)
            })
          }
        }}
      />

      {/* The main directional light */}
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
  )
}

function ControlsPanel({
  transformMode,
  setTransformMode,
  isTransforming,
  lightColor,
  lightIntensity,
  onColorChange,
  onIntensityChange,

  selectedLightName,
  onSelectLight,
  modelSelected,
  onSelectModel,

  bones,
  selectedBoneId,
  onSelectBone,
}) {
  return (
    <div style={styles.controlsPanel}>
      <h3 style={{ margin: '0 0 0.5rem 0' }}>Transform Controls</h3>
      <button
        style={{ ...styles.controlsButton, background: transformMode === 'translate' ? '#555' : '#333' }}
        onClick={() => setTransformMode('translate')}
      >
        Translate
      </button>
      <button
        style={{ ...styles.controlsButton, background: transformMode === 'rotate' ? '#555' : '#333' }}
        onClick={() => setTransformMode('rotate')}
      >
        Rotate
      </button>
      <button
        style={{ ...styles.controlsButton, background: transformMode === 'scale' ? '#555' : '#333' }}
        onClick={() => setTransformMode('scale')}
      >
        Scale
      </button>

      <p style={{ margin: '0.5rem 0 0 0' }}><b>Mode:</b> {transformMode}</p>

      {/* Light UI */}
      {selectedLightName && (
        <div style={{ marginTop: '1rem' }}>
          <h4 style={{ marginBottom: '0.5rem' }}>Light Settings</h4>
          <SketchPicker
            color={lightColor}
            onChangeComplete={(color) => onColorChange(color.hex)}
            presetColors={[]}
            styles={{ default: { picker: { background: '#333' } } }}
          />
          <div style={{ marginTop: '0.5rem' }}>
            <label style={{ display: 'block' }}>Intensity: {lightIntensity}</label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={lightIntensity}
              onChange={(e) => onIntensityChange(Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>
        </div>
      )}

      {/* Scene Hierarchy in a scroll container */}
      <div style={styles.sceneHierarchyContainer}>
        <SceneHierarchy
          lights={[{ name: 'MainLight' }]}
          selectedLightName={selectedLightName}
          onSelectLight={onSelectLight}
          modelName="MixamoModel"
          modelSelected={modelSelected}
          onSelectModel={onSelectModel}
          bones={bones}
          selectedBoneId={selectedBoneId}
          onSelectBone={onSelectBone}
        />
      </div>
    </div>
  )
}

function SettingsPanel({
  showSettings,
  setShowSettings,
  ikEnabled,
  setIkEnabled,
  showGrid,
  setShowGrid,
  castShadows,
  setCastShadows,
  cameraType,
  setCameraType,
  fov,
  setFov,
}) {
  if (!showSettings) return null

  return (
    <div style={styles.settingsPanel}>
      <h2 style={{ marginTop: 0 }}>Settings</h2>
      <label>
        <input
          type="checkbox"
          checked={ikEnabled}
          onChange={(e) => setIkEnabled(e.target.checked)}
        /> IK (not implemented)
      </label>
      <label>
        <input
          type="checkbox"
          checked={showGrid}
          onChange={(e) => setShowGrid(e.target.checked)}
        /> Show Grid
      </label>
      <label>
        <input
          type="checkbox"
          checked={castShadows}
          onChange={(e) => setCastShadows(e.target.checked)}
        /> Cast Shadows
      </label>

      <div style={{ marginTop: '0.5rem' }}>
        <label style={{ marginRight: '1rem' }}>Camera Type:</label>
        <label>
          <input
            type="radio"
            value="perspective"
            checked={cameraType === 'perspective'}
            onChange={(e) => setCameraType(e.target.value)}
          /> Perspective
        </label>
        <label style={{ marginLeft: '1rem' }}>
          <input
            type="radio"
            value="orthographic"
            checked={cameraType === 'orthographic'}
            onChange={(e) => setCameraType(e.target.value)}
          /> Orthographic
        </label>
      </div>

      {cameraType === 'perspective' && (
        <div style={{ marginTop: '0.5rem' }}>
          <label>FOV: <b>{fov}</b></label>
          <input
            style={{ width: '100%' }}
            type="range"
            min="10"
            max="90"
            value={fov}
            onChange={(e) => setFov(Number(e.target.value))}
          />
        </div>
      )}

      <button
        style={{ ...styles.controlsButton, marginTop: '1rem' }}
        onClick={() => setShowSettings(false)}
      >
        Close
      </button>
    </div>
  )
}

export default function App() {
  const [transformMode, setTransformMode] = useState('translate')
  const [isTransforming, setIsTransforming] = useState(false)

  const [showSettings, setShowSettings] = useState(false)
  const [ikEnabled, setIkEnabled] = useState(false)
  const [showGrid, setShowGrid] = useState(true)
  const [castShadows, setCastShadows] = useState(true)
  const [cameraType, setCameraType] = useState('perspective')
  const [fov, setFov] = useState(50)

  const [selectedLightName, setSelectedLightName] = useState(null)
  const [modelSelected, setModelSelected] = useState(false)
  const [bones, setBones] = useState([])
  const [selectedBoneId, setSelectedBoneId] = useState(null)

  const [lightColor, setLightColor] = useState('#ffffff')
  const [lightIntensity, setLightIntensity] = useState(1)

  const [addItemDropdownOpen, setAddItemDropdownOpen] = useState(false)

  // Selecting the model unselects lights & bones
  function handleSelectModel() {
    setSelectedLightName(null)
    setSelectedBoneId(null)
    setModelSelected(true)
  }

  // Selecting a light unselects model & bones
  function handleSelectLight(lightName) {
    setModelSelected(false)
    setSelectedBoneId(null)
    setSelectedLightName(lightName)
  }

  // Selecting a bone unselects model & lights
  function handleSelectBone(boneUuid) {
    setModelSelected(false)
    setSelectedLightName(null)
    setSelectedBoneId(boneUuid)
  }

  // Received from RiggedModel
  function handleBonesLoaded(loadedBones) {
    setBones(loadedBones)
  }

  return (
    <div style={styles.appContainer}>
      {/* Top bar */}
      <div style={styles.topBar}>
        <h2 style={{ margin: 0 }}>My 3D Posing App</h2>
        <nav style={styles.navLinks}>
          <button style={styles.navButton}>Poses</button>
          <button style={styles.navButton}>Models</button>
          <button style={styles.navButton}>Help</button>
          <button style={styles.navButton} onClick={() => setShowSettings(true)}>
            Settings
          </button>
          <button
            style={styles.plusButton}
            onClick={() => setAddItemDropdownOpen(!addItemDropdownOpen)}
          >
            +
          </button>
        </nav>
      </div>

      {/* Possibly add a model/light */}
      <AddItemDropdown
        isOpen={addItemDropdownOpen}
        onClose={() => setAddItemDropdownOpen(false)}
        onAddModel={() => { }}
        onAddLight={() => { }}
      />

      {/* Main 3D Scene */}
      <div style={styles.mainContent}>
        <MainScene
          transformMode={transformMode}
          isTransforming={isTransforming}
          setIsTransforming={setIsTransforming}
          showGrid={showGrid}
          castShadows={castShadows}
          cameraType={cameraType}
          fov={fov}
          // Model
          modelSelected={modelSelected}
          onSelectModel={handleSelectModel}
          // Bones
          bones={bones}
          selectedBoneId={selectedBoneId}
          onSelectBone={handleSelectBone}
          // Light
          selectedLightName={selectedLightName}
          onSelectLight={handleSelectLight}
          lightColor={lightColor}
          lightIntensity={lightIntensity}
          // Callback
          onBonesLoaded={handleBonesLoaded}
        />
      </div>

      {/* Status bar */}
      <div style={styles.statusBar}>
        <p style={{ margin: 0 }}>
          {selectedLightName
            ? `Selected Light: ${selectedLightName}`
            : modelSelected
              ? 'Selected: Model'
              : selectedBoneId
                ? `Selected Bone: ${selectedBoneId}`
                : 'Nothing selected'}
        </p>
      </div>

      {/* Left panel: transform & hierarchy */}
      <ControlsPanel
        transformMode={transformMode}
        setTransformMode={setTransformMode}
        isTransforming={isTransforming}
        lightColor={lightColor}
        lightIntensity={lightIntensity}
        onColorChange={setLightColor}
        onIntensityChange={setLightIntensity}
        selectedLightName={selectedLightName}
        onSelectLight={handleSelectLight}
        modelSelected={modelSelected}
        onSelectModel={handleSelectModel}
        bones={bones}
        selectedBoneId={selectedBoneId}
        onSelectBone={handleSelectBone}
      />

      {/* Right panel: settings */}
      <SettingsPanel
        showSettings={showSettings}
        setShowSettings={setShowSettings}
        ikEnabled={ikEnabled}
        setIkEnabled={setIkEnabled}
        showGrid={showGrid}
        setShowGrid={setShowGrid}
        castShadows={castShadows}
        setCastShadows={setCastShadows}
        cameraType={cameraType}
        setCameraType={setCameraType}
        fov={fov}
        setFov={setFov}
      />
    </div>
  )
}

/*─────────────────────────────────────────────────────────────────────────────
 | Basic styling
 ─────────────────────────────────────────────────────────────────────────────*/
const styles = {
  appContainer: {
    width: '100vw',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#181818',
    color: '#f0f0f0',
    margin: 0,
    padding: 0,
    position: 'relative',
  },
  topBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: '#212121',
    padding: '1rem',
    boxShadow: '0 2px 4px rgba(0,0,0,0.6)',
    zIndex: 5,
  },
  navLinks: {
    display: 'flex',
    gap: '1rem',
  },
  navButton: {
    background: '#333',
    color: '#f0f0f0',
    border: '1px solid #444',
    borderRadius: '4px',
    padding: '0.5rem 1rem',
    cursor: 'pointer',
    fontSize: '0.9rem',
  },
  plusButton: {
    background: '#333',
    color: '#f0f0f0',
    border: '1px solid #444',
    borderRadius: '4px',
    padding: '0.5rem 1rem',
    cursor: 'pointer',
  },
  mainContent: {
    flex: 1,
    display: 'flex',
  },
  statusBar: {
    background: '#212121',
    padding: '0.5rem 1rem',
    boxShadow: '0 -2px 4px rgba(0,0,0,0.6)',
  },
  controlsPanel: {
    position: 'absolute',
    top: '5rem',
    left: '1rem',
    zIndex: 10,
    background: '#2a2a2a',
    width: '300px',
    padding: '1rem',
    borderRadius: '8px',
    boxShadow: '0 0 10px rgba(0,0,0,0.6)',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  sceneHierarchyContainer: {
    overflowY: 'auto',
    maxHeight: '200px',
    marginTop: '1rem',
    border: '1px solid #444',
    borderRadius: '4px',
    padding: '0.5rem',
  },
  settingsPanel: {
    position: 'absolute',
    top: '5rem',
    right: '1rem',
    zIndex: 999,
    background: '#2a2a2a',
    padding: '1rem',
    borderRadius: '8px',
    boxShadow: '0 0 10px rgba(0,0,0,0.6)',
    minWidth: '250px',
  },
  controlsButton: {
    background: '#333',
    color: '#f0f0f0',
    border: '1px solid #444',
    borderRadius: '4px',
    padding: '0.5rem 1rem',
    cursor: 'pointer',
    fontSize: '0.9rem',
  },
  addItemDropdown: {
    position: 'absolute',
    top: '4rem',
    right: '1rem',
    background: '#2a2a2a',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    padding: '0.5rem',
    zIndex: 1000,
    borderRadius: '8px',
    boxShadow: '0 0 10px rgba(0,0,0,0.6)',
  },
  subMenu: {
    position: 'absolute',
    top: 0,
    right: '100%',
    background: '#2a2a2a',
    padding: '0.5rem',
    borderRadius: '8px',
    boxShadow: '0 0 10px rgba(0,0,0,0.6)',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    zIndex: 1100,
  },
}
