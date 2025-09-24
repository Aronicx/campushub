import type { SVGProps } from "react";

export const Icons = {
  logo: (props: SVGProps<SVGSVGElement>) => (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      fill="none"
    >
      <circle cx="50" cy="50" r="50" fill="#0D47A1" />
      <text
        x="50"
        y="48"
        fontFamily="cursive, 'Comic Sans MS', sans-serif"
        fontSize="24"
        fill="white"
        textAnchor="middle"
        dominantBaseline="middle"
        style={{ letterSpacing: '0.05em' }}
      >
        CAMPUS
      </text>
      <text
        x="50"
        y="72"
        fontFamily="cursive, 'Comic Sans MS', sans-serif"
        fontSize="24"
        fill="white"
        textAnchor="middle"
        dominantBaseline="middle"
      >
        HUB
      </text>
    </svg>
  ),
};
