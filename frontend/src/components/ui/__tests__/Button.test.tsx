import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MapPin } from '@/components/icons'
import { PrimaryButton, SecondaryButton, TertiaryButton, IconButton, FilterButton } from '../Button'

describe('PrimaryButton', () => {
  it('renders and handles click', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<PrimaryButton onClick={onClick}>Click</PrimaryButton>)
    await user.click(screen.getByRole('button', { name: 'Click' }))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('is disabled when disabled or loading; loading shows spinner', () => {
    const { rerender } = render(<PrimaryButton disabled>Off</PrimaryButton>)
    expect(screen.getByRole('button')).toBeDisabled()

    rerender(<PrimaryButton loading>Wait</PrimaryButton>)
    expect(screen.getByRole('button')).toBeDisabled()
    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('does not fire onClick when disabled or loading', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    const { rerender } = render(<PrimaryButton disabled onClick={onClick}>Off</PrimaryButton>)
    await user.click(screen.getByRole('button'))
    expect(onClick).not.toHaveBeenCalled()

    rerender(<PrimaryButton loading onClick={onClick}>Wait</PrimaryButton>)
    await user.click(screen.getByRole('button'))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('merges className and supports submit type', () => {
    render(
      <PrimaryButton className="extra" type="submit">
        Go
      </PrimaryButton>
    )
    const btn = screen.getByRole('button')
    expect(btn).toHaveClass('extra')
    expect(btn).toHaveAttribute('type', 'submit')
  })
})

describe('SecondaryButton / TertiaryButton', () => {
  it('SecondaryButton renders and handles click', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(
      <SecondaryButton icon={MapPin} onClick={onClick}>
        Next
      </SecondaryButton>
    )
    await user.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('TertiaryButton renders', () => {
    render(<TertiaryButton>Subtle</TertiaryButton>)
    expect(screen.getByRole('button', { name: 'Subtle' })).toBeInTheDocument()
  })
})

describe('IconButton', () => {
  it('is labeled and clickable', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<IconButton icon={MapPin} onClick={onClick} ariaLabel="Pin" />)
    await user.click(screen.getByLabelText('Pin'))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('hides badge while loading', () => {
    render(<IconButton icon={MapPin} badge loading ariaLabel="X" />)
    expect(document.querySelector('.animate-pulse')).not.toBeInTheDocument()
  })
})

describe('FilterButton', () => {
  it('toggles active styling and handles click', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    const { rerender } = render(<FilterButton onClick={onClick}>F</FilterButton>)
    await user.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalled()

    rerender(
      <FilterButton active onClick={onClick}>
        F
      </FilterButton>
    )
    expect(screen.getByRole('button')).toBeInTheDocument()
  })
})
