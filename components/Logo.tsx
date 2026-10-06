/** Brand lockup: mark + name, key word "lab" in the hub-switchable accent. */
export default function Logo({ size = 28 }: { size?: number }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
        <rect width="64" height="64" rx="16" fill="var(--accent)" />
        <path d="M26 14h12v4h-2v10l10 18a4 4 0 0 1-3.500 6H21.500A4 4 0 0 1 18 46l10-18V18h-2z" fill="var(--on-accent)" opacity=".95" />
        <circle cx="30" cy="42" r="3" fill="var(--accent)" /><circle cx="37" cy="38" r="2" fill="var(--accent)" />
      </svg>
      <span style={{ fontWeight: 700, fontSize: 17, letterSpacing: '-0.02em', color: 'var(--ink)' }}>
        agent<span style={{ color: 'var(--accent-ink)' }}>-lab</span>
      </span>
    </span>
  )
}
