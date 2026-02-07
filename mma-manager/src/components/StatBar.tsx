/** Small pixel-style stat bar */
export default function StatBar({ label, value, max = 10 }: { label: string; value: number; max?: number }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      fontSize: 'clamp(6px, 1.5vw, 7px)',
      color: '#aaa',
    }}>
      <span style={{ width: 'clamp(60px, 15vw, 90px)', textAlign: 'right', flexShrink: 0 }}>{label}</span>
      <div style={{
        display: 'flex', gap: 2, flex: 1, minWidth: 0,
      }}>
        {Array.from({ length: max }).map((_, i) => (
          <div key={i} style={{
            flex: '1 1 0',
            maxWidth: 10,
            height: 10,
            background: i < value ? '#d4a017' : '#2a2a3e',
            border: '1px solid',
            borderColor: i < value ? '#f0d060' : '#333',
          }} />
        ))}
      </div>
    </div>
  );
}
