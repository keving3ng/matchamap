import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useInstallSupport } from './install'

describe('browser install event', () => {
  it('captures a supported prompt, consumes it on action, and clears it after installation', async () => {
    const { result } = renderHook(() => useInstallSupport())
    expect(result.current.canInstall).toBe(false)
    const prompt = vi.fn().mockResolvedValue(undefined)
    const event = new Event('beforeinstallprompt', { cancelable: true })
    Object.assign(event, { prompt, userChoice: Promise.resolve({ outcome: 'accepted' }) })
    act(() => { window.dispatchEvent(event) })
    expect(event.defaultPrevented).toBe(true)
    expect(result.current.canInstall).toBe(true)
    let accepted = false
    await act(async () => { accepted = await result.current.promptInstall() })
    expect(accepted).toBe(true)
    expect(prompt).toHaveBeenCalledOnce()
    expect(result.current.canInstall).toBe(false)
    act(() => { window.dispatchEvent(new Event('appinstalled')) })
    expect(result.current.canInstall).toBe(false)
  })
})
