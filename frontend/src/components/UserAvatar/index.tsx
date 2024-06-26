/* eslint-disable @next/next/no-img-element */
// Why disabled:
// avatars.dicebear.com provides svg avatars
// next/image needs dangerouslyAllowSVG option for that

import React, { ReactNode } from 'react'

type Props = {
  username: string
  api?: string
  className?: string
  children?: ReactNode
}

export default function UserAvatar({
  username,
  api = 'avataaars',
  className = '',
  children,
}: Props) {
  const avatarImage = `https://icons.veryicon.com/png/o/internet--web/prejudice/user-128.png`

  return (
    <div className={className}>
      <img
        src={avatarImage}
        alt={username}
        className="rounded-full block h-auto w-full max-w-full bg-gray-100 dark:bg-slate-800"
      />
      {children}
    </div>
  )
}
