import type { SVGProps } from "react";

export const Icons = {
  logo: (props: SVGProps<SVGSVGElement>) => (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      <path d="M12 8v8" />
      <path d="m8.5 14-3.5 2" />
      <path d="m8.5 10-3.5-2" />
      <path d="m15.5 14 3.5 2" />
      <path d="m15.5 10 3.5-2" />
    </svg>
  ),
};
