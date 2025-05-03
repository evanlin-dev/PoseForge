export default function SettingsPanel({
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
    if (!showSettings) return null;

    return (
        <div style={styles.panel}>
            <h2 style={{ marginTop: 0 }}>Settings</h2>
            {[
                { label: 'IK (not implemented)', value: ikEnabled, setter: setIkEnabled },
                { label: 'Show Grid', value: showGrid, setter: setShowGrid },
                { label: 'Cast Shadows', value: castShadows, setter: setCastShadows },
            ].map((c) => (
                <label key={c.label}>
                    <input type="checkbox" checked={c.value} onChange={(e) => c.setter(e.target.checked)} />{' '}
                    {c.label}
                </label>
            ))}

            <div style={{ marginTop: '.5rem' }}>
                <label style={{ marginRight: '1rem' }}>Camera:</label>
                {['perspective', 'orthographic'].map((t) => (
                    <label key={t} style={{ marginLeft: t === 'orthographic' ? '1rem' : 0 }}>
                        <input
                            type="radio"
                            value={t}
                            checked={cameraType === t}
                            onChange={(e) => setCameraType(e.target.value)}
                        />{' '}
                        {t[0].toUpperCase() + t.slice(1)}
                    </label>
                ))}
            </div>

            {cameraType === 'perspective' && (
                <div style={{ marginTop: '.5rem' }}>
                    <label>FOV: <b>{fov}</b></label>
                    <input
                        type="range"
                        min="10"
                        max="90"
                        value={fov}
                        onChange={(e) => setFov(+e.target.value)}
                        style={{ width: '100%' }}
                    />
                </div>
            )}

            <button style={styles.close} onClick={() => setShowSettings(false)}>
                Close
            </button>
        </div>
    );
}

const styles = {
    panel: {
        position: 'absolute',
        top: '5rem',
        right: '1rem',
        minWidth: 250,
        padding: '1rem',
        background: '#2a2a2a',
        borderRadius: 8,
        boxShadow: '0 0 10px rgba(0,0,0,.6)',
    },
    close: {
        marginTop: '1rem',
        padding: '.5rem 1rem',
        background: '#333',
        color: '#f0f0f0',
        border: '1px solid #444',
        borderRadius: 4,
        cursor: 'pointer',
    },
};
