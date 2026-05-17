interface LogoIconProps {
  size?: number;
}

export const LogoIcon = ({ size = 24 }: LogoIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 340 340"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <title>Logo Icon</title>
    <path d="M0 0H100V100H0V0Z" fill="#d3d3da" />
    <path d="M0 120H100V220H0V120Z" fill="#d3d3da" />
    <path d="M0 240H100V340H0V240Z" fill="#d3d3da" />
    <path d="M120 0H220V100H120V0Z" fill="#d3d3da" />
    <path d="M120 120H220V220H120V120Z" fill="#d3d3da" />
    <path d="M120 240H220V340H120V240Z" fill="#616161" />
    <path d="M240 0H340V100H240V0Z" fill="#d3d3da" />
    <path d="M240 120H340V220H240V120Z" fill="#616161" />
    <path d="M240 240H340V340H240V240Z" fill="#616161" />
  </svg>
);
