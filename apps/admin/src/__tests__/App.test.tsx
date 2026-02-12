import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import App from '../App'

describe('App', () => {
  it('renders without crashing', () => {
    const { container } = render(<App />)
    expect(container).toBeTruthy()
  })

  it('redirects to login when not authenticated', () => {
    render(<App />)
    // Should redirect to login page
    expect(window.location.pathname).toContain('login')
  })
})
