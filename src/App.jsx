import { useState, useCallback } from 'react';
import AddItemDropdown from './components/AddItemDropdown';
import ControlsPanel from './components/ControlsPanel';
import MainScene from './components/MainScene';
import SettingsPanel from './components/SettingsPanel';

export default function App() {
  // Transformation
  const [transformMode, setTransformMode] = useState('translate');
  const [isTransforming, setIsTransforming] = useState(false);

  // Toggles
  const [showSettings, setShowSettings] = useState(false);
  const [ikEnabled, setIkEnabled] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [castShadows, setCastShadows] = useState(true);
  const [cameraType, setCameraType] = useState('perspective');
  const [fov, setFov] = useState(50);

  // Selection
  const [selectedLightName, setSelectedLightName] = useState(null);
  const [modelSelected, setModelSelected] = useState(false);
  const [bones, setBones] = useState([]);
  const [selectedBoneId, setSelectedBoneId] = useState(null);

  // Lights
  const [lightColor, setLightColor] = useState('#ffffff');
  const [lightIntensity, setLightIntensity] = useState(1);

  // Misc UI
  const [addMenuOpen, setAddMenuOpen] = useState(false);

  // Selection helpers
  const selectModel = () => {
    setSelectedLightName(null);
    setSelectedBoneId(null);
    setModelSelected(true);
  };

  const selectLight = (name) => {
    setModelSelected(false);
    setSelectedBoneId(null);
    setSelectedLightName(name);
  };

  const selectBone = (uuid) => {
    setModelSelected(false);
    setSelectedLightName(null);
    setSelectedBoneId(uuid);
  };

  // Memoized callback (for RiggedModel)
  const handleBonesLoaded = useCallback((loaded) => setBones(loaded), []);

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: '#212121' }}>
        <h2 style={{ margin: 0 }}>PoseForge</h2>
        <nav style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={() => setShowSettings(true)}>Settings</button>
          <button onClick={() => setAddMenuOpen((o) => !o)}>+</button>
        </nav>
      </div>

      <AddItemDropdown
        isOpen={addMenuOpen}
        onClose={() => setAddMenuOpen(false)}
        onAddModel={() => { }}
        onAddLight={() => { }}
      />

      {/* Main Area */}
      <div style={{ flex: 1, position: 'relative' }}>
        <MainScene
          transformMode={transformMode}
          isTransforming={isTransforming}
          setIsTransforming={setIsTransforming}
          showGrid={showGrid}
          castShadows={castShadows}
          cameraType={cameraType}
          fov={fov}
          modelSelected={modelSelected}
          onSelectModel={selectModel}
          bones={bones}
          selectedBoneId={selectedBoneId}
          onSelectBone={selectBone}
          selectedLightName={selectedLightName}
          onSelectLight={selectLight}
          lightColor={lightColor}
          lightIntensity={lightIntensity}
          onBonesLoaded={handleBonesLoaded}
        />
      </div>

      <div style={{ padding: '.5rem 1rem', background: '#212121' }}>
        {selectedLightName
          ? `Selected Light: ${selectedLightName}`
          : modelSelected
            ? 'Selected: Model'
            : selectedBoneId
              ? `Selected Bone: ${selectedBoneId}`
              : 'Nothing selected'}
      </div>

      <ControlsPanel
        transformMode={transformMode}
        setTransformMode={setTransformMode}
        isTransforming={isTransforming}
        lightColor={lightColor}
        lightIntensity={lightIntensity}
        onColorChange={setLightColor}
        onIntensityChange={setLightIntensity}
        selectedLightName={selectedLightName}
        onSelectLight={selectLight}
        modelSelected={modelSelected}
        onSelectModel={selectModel}
        bones={bones}
        selectedBoneId={selectedBoneId}
        onSelectBone={selectBone}
      />

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
  );
}
