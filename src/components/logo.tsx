export function Logo({ size = 'md', variant = 'dark' }: {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'dark' | 'light'
}) {
  const sizes = { sm: 'h-7', md: 'h-9', lg: 'h-12' }
  const textSizes = { sm: 'text-sm', md: 'text-base', lg: 'text-xl' }
  const iconSizes = { sm: 20, md: 26, lg: 34 }
  const iconSize = iconSizes[size]
  const textColor = variant === 'dark' ? '#1C1409' : '#F8F4EF'
  const goldColor = '#9A7B35'

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
        <path d="M1 14L16 4L31 14" stroke={goldColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        {/* Arch door */}
        <path d="M12.5 29V23.5C12.5 21.567 14.067 20 16 20C17.933 20 19.5 21.567 19.5 23.5V29" stroke={textColor} strokeWidth="1.4" />
        {/* Left window */}
        <rect x="6" y="17" width="5" height="4" rx="0.5" fill={goldColor} opacity="0.6" />
        {/* Right window */}
        <rect x="21" y="17" width="5" height="4" rx="0.5" fill={goldColor} opacity="0.6" />
      </svg>

      {/* Wordmark */}
      <div className="flex flex-col leading-none">
        <span
          className={`${textSizes[size]} font-light tracking-[0.18em] uppercase`}
          style={{ color: variant === 'dark' ? '#78614A' : '#C4A87A', letterSpacing: '0.18em', fontSize: size === 'sm' ? '9px' : size === 'md' ? '11px' : '14px' }}
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
            className="font-bold tracking-tight"
            style={{ color: goldColor, fontSize: size === 'sm' ? '16px' : size === 'md' ? '20px' : '28px', lineHeight: 1 }}
          >
            37
          </span>
        </div>
      </div>
    </div>
  )
}
