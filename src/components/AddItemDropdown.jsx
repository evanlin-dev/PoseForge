import { useState } from 'react';

export default function AddItemDropdown({ isOpen, onClose, onAddModel, onAddLight }) {
    const [submenu, setSubmenu] = useState(null);
    if (!isOpen) return null;

    return (
        <div style={styles.menu}>
            <button onClick={() => setSubmenu('models')}>Models</button>
            <button onClick={() => setSubmenu('lights')}>Lights</button>
            <button onClick={() => (setSubmenu(null), onClose())}>Cancel</button>

            {submenu && (
                <div style={styles.sub}>
                    {submenu === 'models' ? (
                        <>
                            <button onClick={() => (onAddModel(), onClose())}>Cube</button>
                            <button onClick={() => (onAddModel(), onClose())}>Sphere</button>
                        </>
                    ) : (
                        <>
                            <button onClick={() => (onAddLight(), onClose())}>Directional</button>
                            <button onClick={() => (onAddLight(), onClose())}>Point</button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

const styles = {
    menu: {
        position: 'absolute',
        top: '4rem',
        right: '1rem',
        background: '#2a2a2a',
        display: 'flex',
        flexDirection: 'column',
        gap: '.5rem',
        padding: '.5rem',
        borderRadius: '8px',
        boxShadow: '0 0 10px rgba(0,0,0,.6)',
        zIndex: 1000,
    },
    sub: {
        position: 'absolute',
        top: 0,
        right: '100%',
        background: '#2a2a2a',
        display: 'flex',
        flexDirection: 'column',
        gap: '.5rem',
        padding: '.5rem',
        borderRadius: '8px',
        boxShadow: '0 0 10px rgba(0,0,0,.6)',
    },
};
