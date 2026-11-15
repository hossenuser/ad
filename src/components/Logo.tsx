import logo from '../assets/mh-logo.png';

interface LogoProps {
  size?: number;
  className?: string;
  glow?: boolean;
}

/**
 * The official MH Apps Gallery logo.
 * Imported as-is from the original asset — no crop, recolor or modification.
 */
export default function Logo({ size = 64, className = '', glow = false }: LogoProps) {
  return (
    <span
      className={`relative inline-flex flex-shrink-0 items-center justify-center rounded-full ${className}`}
      style={glow ? { filter: 'drop-shadow(0 10px 28px rgba(21, 118, 255, 0.45))' } : undefined}
    >
      <img
        src={logo}
        alt="MH Apps Gallery official logo"
        width={size}
        height={size}
        draggable={false}
        className="h-full w-full rounded-full object-contain select-none"
        style={{ width: size, height: size }}
      />
    </span>
  );
}

export { logo as logoAsset };
