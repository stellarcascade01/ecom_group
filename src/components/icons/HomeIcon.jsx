import React from 'react'

export default function HomeIcon({ size = 18, style = {}, ...props }){
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      style={{ display: 'inline-block', verticalAlign: 'text-bottom', ...style }}
      {...props}
    >
      <path
        d="M3 10.5 12 3l9 7.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M5.5 9.8V21h13V9.8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M10 21v-7h4v7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  )
}
