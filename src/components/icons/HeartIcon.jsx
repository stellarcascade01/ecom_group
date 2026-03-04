import React from 'react'

export default function HeartIcon({ size = 16, filled = false, className = '', style = {} }){
  return filled ? (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      className={className}
      style={style}
      aria-hidden="true"
      focusable="false"
    >
      <path d="M12 21s-6.716-4.584-9.193-7.062C.33 11.462.33 8.205 2.807 5.728c2.06-2.06 5.4-2.06 7.46 0L12 7.46l1.733-1.733c2.06-2.06 5.4-2.06 7.46 0 2.477 2.477 2.477 5.734 0 8.21C18.716 16.416 12 21 12 21z"/>
    </svg>
  ) : (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
      focusable="false"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"></path>
    </svg>
  )
}
