/** Small pixel-style stat bar */
export default function StatBar({ label, value, max = 10 }: { label: string; value: number; max?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 7, color: '#aaa' }}>
      <span style={{ width: 90, textAlign: 'right' }}>{label}</span>
      <div style={{
        display: 'flex', gap: 2,
      }}>
        {Array.from({ length: max }).map((_, i) => (
          <div key={i} style={{
            width: 8, height: 10,
            background: i < value ? '#d4a017' : '#2a2a3e',
            border: '1px solid',
            borderColor: i < value ? '#f0d060' : '#333',
          }} />
        ))}
      </div>
    </div>
  );
}
