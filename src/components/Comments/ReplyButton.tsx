'use client'

import React from 'react'
import { Button } from '@/components/ui/button'

type ReplyButtonProps = {
  isOpen: boolean
  onClick: () => void
}

export const ReplyButton: React.FC<ReplyButtonProps> = ({ isOpen, onClick }) => {
  return (
    <Button variant="ghost" size="sm" onClick={onClick} className="text-muted-foreground">
      {isOpen ? 'Cancel' : 'Reply'}
    </Button>
  )
}
