import { SketchPicker } from 'react-color';
import SceneHierarchy from './SceneHierarchy';

export default function ControlsPanel({
  transformMode,
  setTransformMode,
  isTransforming,          // not used yet but handy for future UX tweaks
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
    <div style={styles.panel}>
      <h3 style={{ margin: 0 }}>Transform Controls</h3>
      {['translate', 'rotate', 'scale'].map((m) => (
        <button
          key={m}
          style={{ ...styles.btn, background: transformMode === m ? '#555' : '#333' }}
          onClick={() => setTransformMode(m)}
        >
          {m[0].toUpperCase() + m.slice(1)}
        </button>
      ))}

      {selectedLightName && (
        <div style={{ marginTop: '1rem' }}>
          <h4 style={{ marginBottom: '.5rem' }}>Light Settings</h4>
          <SketchPicker
            color={lightColor}
            onChangeComplete={(c) => onColorChange(c.hex)}
            presetColors={[]}
            styles={{ default: { picker: { background: '#333' } } }}
          />
          <div style={{ marginTop: '.5rem' }}>
            <label>Intensity: {lightIntensity}</label>
            <input
              type="range"
              min="0"
              max="2"
              step=".1"
              value={lightIntensity}
              onChange={(e) => onIntensityChange(+e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
        </div>
      )}

      <div style={styles.scroll}>
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
  );
}

const styles = {
  panel: {
    position: 'absolute',
    top: '5rem',
    left: '1rem',
    width: 300,
    padding: '1rem',
    background: '#2a2a2a',
    borderRadius: 8,
    boxShadow: '0 0 10px rgba(0,0,0,.6)',
  },
  btn: {
    marginRight: '.5rem',
    marginBottom: '.5rem',
    padding: '.5rem 1rem',
    background: '#333',
    color: '#f0f0f0',
    border: '1px solid #444',
    borderRadius: 4,
    cursor: 'pointer',
  },
  scroll: {
    overflowY: 'auto',
    maxHeight: 200,
    marginTop: '1rem',
    border: '1px solid #444',
    borderRadius: 4,
    padding: '.5rem',
  },
};
