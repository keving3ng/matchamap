import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MapPin } from '@/components/icons'
import { AlertDialog, InfoCard } from '../AlertDialog'

describe('AlertDialog', () => {
  it('renders title and message', () => {
    render(<AlertDialog title="T" message="M" />)
    expect(screen.getByText('T')).toBeInTheDocument()
    expect(screen.getByText('M')).toBeInTheDocument()
  })

  it('calls primary and secondary actions', async () => {
    const user = userEvent.setup()
    const primary = vi.fn()
    const secondary = vi.fn()
    render(
      <AlertDialog
        title="Pick"
        message="Choose"
        primaryAction={{ label: 'OK', onClick: primary }}
        secondaryAction={{ label: 'Cancel', onClick: secondary }}
      />
    )
    await user.click(screen.getByRole('button', { name: 'OK' }))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(primary).toHaveBeenCalledOnce()
    expect(secondary).toHaveBeenCalledOnce()
  })

  it('omits buttons when no actions', () => {
    render(<AlertDialog title="Hi" message="Only text" />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('renders React node message and custom icon', () => {
    render(
      <AlertDialog title="Rich" message={<strong>Bold</strong>} icon={MapPin} />
    )
    expect(screen.getByText('Bold')).toBeInTheDocument()
  })

  it('merges className on container', () => {
    const { container } = render(
      <AlertDialog title="C" message="M" className="custom-alert-class" />
    )
    expect(container.querySelector('.custom-alert-class')).toBeInTheDocument()
  })
})

describe('InfoCard', () => {
  it('renders children and optional title', () => {
    render(
      <InfoCard title="T">
        <span>Body</span>
      </InfoCard>
    )
    expect(screen.getByText('T')).toBeInTheDocument()
    expect(screen.getByText('Body')).toBeInTheDocument()
  })

  it('supports variants and custom className', () => {
    const { container, rerender } = render(<InfoCard variant="success">S</InfoCard>)
    expect(container.textContent).toContain('S')

    rerender(
      <InfoCard className="custom-info-class" variant="info">
        X
      </InfoCard>
    )
    expect(container.querySelector('.custom-info-class')).toBeInTheDocument()
  })
})
