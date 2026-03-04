import React from 'react'

export default function StarRating({ value = 0, onChange, max = 5, size = 20, readOnly = false, className = '' }){
  const stars = []
  const rounded = Math.round(value * 2) / 2 // support halves visually if needed later
  for (let i = 1; i <= max; i++){
    const filled = i <= rounded
    const content = filled ? '★' : '☆'
    if(readOnly || !onChange){
      stars.push(
        <span key={i} className="star-readonly" style={{ fontSize: size, color: '#F5B301', lineHeight: 1 }}>{content}</span>
      )
    }else{
      stars.push(
        <button
          key={i}
          type="button"
          className="star-button"
          aria-label={`Rate ${i} star${i>1?'s':''}`}
          aria-pressed={i <= value}
          onClick={()=>onChange(i)}
          style={{ fontSize: size, color: '#F5B301', lineHeight: 1 }}
        >
          {content}
        </button>
      )
    }
  }
  return (
    <div className={`star-rating ${className}`.trim()} role={onChange ? 'radiogroup' : undefined}>
      {stars}
    </div>
  )
}
