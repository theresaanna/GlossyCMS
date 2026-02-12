import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReplyButton } from '../ReplyButton'

describe('ReplyButton', () => {
  it('shows "Reply" when closed', () => {
    render(<ReplyButton isOpen={false} onClick={() => {}} />)
    expect(screen.getByText('Reply')).toBeDefined()
  })

  it('shows "Cancel" when open', () => {
    render(<ReplyButton isOpen={true} onClick={() => {}} />)
    expect(screen.getByText('Cancel')).toBeDefined()
  })

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn()
    render(<ReplyButton isOpen={false} onClick={onClick} />)

    await userEvent.click(screen.getByText('Reply'))
    expect(onClick).toHaveBeenCalledOnce()
  })
})
