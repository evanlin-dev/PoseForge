import { useState } from 'react';

export default function SceneHierarchy({
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
  const [lightsOpen, setLightsOpen] = useState(true);
  const [modelOpen, setModelOpen] = useState(true);

  return (
    <div style={{ background: '#333', padding: '.5rem' }}>
      <h4 style={{ margin: 0 }}>Scene Hierarchy</h4>

      <div style={{ marginTop: '.5rem' }}>
        <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <span onClick={() => setLightsOpen((o) => !o)} style={{ marginRight: '.5rem' }}>
            {lightsOpen ? '▼' : '▶'}
          </span>
          <b>Lights</b>
        </div>
        {lightsOpen && (
          <div style={{ marginLeft: '1rem' }}>
            {lights.map((l) => (
              <div
                key={l.name}
                onClick={() => onSelectLight(l.name)}
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

      <div style={{ marginTop: '1rem' }}>
        <div
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          onClick={onSelectModel}
        >
          <span
            style={{ marginRight: '.5rem' }}
            onClick={(e) => {
              e.stopPropagation();
              setModelOpen((o) => !o);
            }}
          >
            {modelOpen ? '▼' : '▶'}
          </span>
          <b style={{ color: modelSelected ? 'orange' : '#ccc' }}>{modelName}</b>
        </div>

        {modelOpen && bones.length > 0 && (
          <div style={{ marginLeft: '1rem', marginTop: '.5rem' }}>
            {bones.map((b) => (
              <div
                key={b.uuid}
                onClick={() => onSelectBone(b.uuid)}
                style={{
                  cursor: 'pointer',
                  color: selectedBoneId === b.uuid ? 'orange' : '#ccc',
                  margin: '2px 0',
                }}
              >
                {b.name}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
