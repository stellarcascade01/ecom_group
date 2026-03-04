import React from 'react'

export default function Button({
  variant = 'primary',
  size = 'md',
  active = false,
  className = '',
  children,
  type = 'button',
  fullWidth = false,
  ...props
}){
  const classes = [
    'btn',
    `btn--${variant}`,
    `btn--${size}`,
    active ? 'is-active' : '',
    className
  ].filter(Boolean).join(' ')

  // Prevent non-DOM props like `fullWidth` from leaking onto the native element
  const { style, ...rest } = props
  const mergedStyle = fullWidth
    ? { width: '100%', display: 'block', ...style }
    : style

  return (
    <button type={type} className={classes} style={mergedStyle} {...rest}>
      {children}
    </button>
  )
}
