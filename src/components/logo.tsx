export function Logo({ size = 'md', variant = 'dark' }: {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'dark' | 'light'
}) {
  const sizes = { sm: 'h-7', md: 'h-9', lg: 'h-12' }
  const iconSizes = { sm: 20, md: 26, lg: 34 }
  const iconSize = iconSizes[size]
  const textColor = variant === 'dark' ? '#1a1a1a' : '#F8F4EF'
  const mutedColor = variant === 'dark' ? '#888888' : '#aaaaaa'

  return (
    <div className={`flex items-center gap-2.5 ${sizes[size]}`}>
      {/* Architectural icon */}
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Building body */}
        <rect x="3" y="13" width="26" height="16" rx="1" stroke={textColor} strokeWidth="1.6" />
        {/* Roof / gable */}
        <path d="M1 14L16 4L31 14" stroke={textColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        {/* Arch door */}
        <path d="M12.5 29V23.5C12.5 21.567 14.067 20 16 20C17.933 20 19.5 21.567 19.5 23.5V29" stroke={textColor} strokeWidth="1.4" />
        {/* Left window */}
        <rect x="6" y="17" width="5" height="4" rx="0.5" fill={mutedColor} opacity="0.5" />
        {/* Right window */}
        <rect x="21" y="17" width="5" height="4" rx="0.5" fill={mutedColor} opacity="0.5" />
      </svg>

      {/* Wordmark */}
      <div className="flex flex-col leading-none">
        <span
          style={{ color: mutedColor, letterSpacing: '0.18em', fontSize: size === 'sm' ? '9px' : size === 'md' ? '11px' : '14px', fontWeight: 300, textTransform: 'uppercase' }}
        >
          Casa
        </span>
        <div className="flex items-baseline gap-0.5">
          <span
            className="font-semibold tracking-tight"
            style={{ color: textColor, fontSize: size === 'sm' ? '16px' : size === 'md' ? '20px' : '28px', lineHeight: 1 }}
          >
            La
          </span>
          <span
            className="font-semibold tracking-tight"
            style={{ color: textColor, fontSize: size === 'sm' ? '16px' : size === 'md' ? '20px' : '28px', lineHeight: 1 }}
          >
            37
          </span>
        </div>
      </div>
    </div>
  )
}
