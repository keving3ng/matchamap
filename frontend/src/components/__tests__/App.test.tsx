import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { App } from '../../App'

describe('App', () => {
  it('renders MatchaMap title', () => {
    render(<App />)
    expect(screen.getByText('MatchaMap')).toBeInTheDocument()
  })

  it('renders navigation tabs', () => {
    render(<App />)
    expect(screen.getByText('Map')).toBeInTheDocument()
    expect(screen.getByText('List')).toBeInTheDocument()
    expect(screen.getByText('News')).toBeInTheDocument()
    expect(screen.getByText('Passport')).toBeInTheDocument()
  })

  it('starts with map view selected', () => {
    render(<App />)
    const mapButton = screen.getByText('Map').closest('button')
    expect(mapButton).toHaveClass('text-green-600')
  })
})