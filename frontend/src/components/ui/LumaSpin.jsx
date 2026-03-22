/**
 * Luma-style morphing spinner — two offset-phased spans animate their
 * inset to create an interlocking box sweep.  Uses rose-600 to match
 * the site's colour theme.
 */
export default function LumaSpin({ size = 65, color = '#e11d48' }) {
  const shadow = `inset 0 0 0 3px ${color}`;
  const base = {
    position: 'absolute',
    borderRadius: 50,
    boxShadow: shadow,
    animation: 'loaderAnim 2.5s infinite',
  };

  return (
    <div style={{ position: 'relative', width: size, aspectRatio: '1' }}>
      <span style={base} />
      <span style={{ ...base, animationDelay: '-1.25s' }} />
    </div>
  );
}
