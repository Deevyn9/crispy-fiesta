type TennisBallSvgProps = {
  className?: string;
};

export default function TennisBallSvg({ className }: TennisBallSvgProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      aria-hidden="true"
      shapeRendering="geometricPrecision"
    >
      <defs>
        {/* Anything inside this clip stays inside the ball */}
        <clipPath id="tennis-ball-clip">
          <circle cx="50" cy="50" r="48" />
        </clipPath>
      </defs>

      {/* Ball body */}
      <circle cx="50" cy="50" r="48" fill="#c8f31d" />

      {/* Seams: rotated 30 degrees and clipped to the ball */}
      <g clipPath="url(#tennis-ball-clip)" transform="rotate(30 50 50)">
        <path
          d="M14 8 C 44 28, 44 72, 14 92"
          fill="none"
          stroke="#0b2a4a"
          strokeWidth="5"
          strokeLinecap="round"
        />

        <path
          d="M86 8 C 56 28, 56 72, 86 92"
          fill="none"
          stroke="#0b2a4a"
          strokeWidth="5"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}
