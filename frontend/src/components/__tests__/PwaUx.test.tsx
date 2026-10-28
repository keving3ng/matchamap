import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { COPY } from '../../constants/copy'

const mock = vi.hoisted(() => ({
  data: {
    cafeCity: 'toronto', cafeStatus: 'saved', cafeSource: 'saved', cafesObservedAt: 1700000000000,
    cafesFetched: true, cafeLoading: false, fetchCafes: vi.fn(), clearOfflineCafes: vi.fn(),
  },
  install: { standalone: false, canInstall: false, promptInstall: vi.fn() },
  online: false,
}))

vi.mock('../../stores/dataStore', () => ({ useDataStore: () => mock.data }))
vi.mock('../../stores/cityStore', () => ({ useCityStore: (selector: (state: { selectedCity: string }) => unknown) => selector({ selectedCity: 'toronto' }) }))
vi.mock('../../stores/cafeStore', () => ({ useCafeStore: () => ({ cafesWithDistance: [] }) }))
vi.mock('../../stores/visitedCafesStore', () => ({ useVisitedCafesStore: () => ({ visitedCafeIds: [], toggleVisited: vi.fn() }) }))
vi.mock('../../hooks/useConnectionStatus', () => ({ useConnectionStatus: () => mock.online }))
vi.mock('../../pwa/install', () => ({ useInstallSupport: () => mock.install }))

import { CafeDataNotice } from '../CafeDataNotice'
import { InstallHelpView } from '../InstallHelpView'
import { CafeDetailWrapper } from '../AppRoutes'

beforeEach(() => {
  Object.assign(mock.data, { cafeCity: 'toronto', cafeStatus: 'saved', cafeSource: 'saved', cafesObservedAt: 1700000000000, cafesFetched: true, cafeLoading: false })
  Object.assign(mock.install, { standalone: false, canInstall: false })
  vi.clearAllMocks()
  mock.online = false
  mock.data.fetchCafes.mockResolvedValue(undefined)
  mock.data.clearOfflineCafes.mockResolvedValue(undefined)
  mock.install.promptInstall.mockResolvedValue(true)
})

describe('install and offline guidance', () => {
  it('shows iPhone guidance while offering an install action only when supported and not standalone', async () => {
    const view = render(<MemoryRouter><InstallHelpView /></MemoryRouter>)
    expect(screen.getByText(COPY.pwa.iosSteps[2])).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: COPY.pwa.installButton })).not.toBeInTheDocument()
    mock.install.canInstall = true
    view.rerender(<MemoryRouter><InstallHelpView /></MemoryRouter>)
    await userEvent.click(screen.getByRole('button', { name: COPY.pwa.installButton }))
    expect(mock.install.promptInstall).toHaveBeenCalledOnce()
    expect(screen.getByText(COPY.pwa.installStarted)).toBeInTheDocument()
    mock.install.standalone = true
    view.rerender(<MemoryRouter><InstallHelpView /></MemoryRouter>)
    expect(screen.queryByRole('button', { name: COPY.pwa.installButton })).not.toBeInTheDocument()
    expect(screen.queryByText(COPY.pwa.iosTitle)).not.toBeInTheDocument()
  })

  it('labels saved data and reports clear failures without claiming success', async () => {
    mock.data.clearOfflineCafes.mockRejectedValueOnce(new Error('storage denied'))
    render(<MemoryRouter><CafeDataNotice city="toronto" /></MemoryRouter>)
    expect(screen.getByText(COPY.pwa.savedFrom(new Date(mock.data.cafesObservedAt).toLocaleString()))).toBeInTheDocument()
    expect(screen.getByText(COPY.pwa.savedOffline)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: COPY.pwa.clearData }))
    expect(await screen.findByText(COPY.pwa.clearFailed)).toBeInTheDocument()
    expect(screen.queryByText(COPY.pwa.clearDone)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: COPY.pwa.backToList })).toBeInTheDocument()
  })

  it('distinguishes expired from missing offline data and exits uncached detail loading', () => {
    Object.assign(mock.data, { cafeStatus: 'expired', cafeSource: null, cafesObservedAt: null, cafesFetched: false })
    const view = render(<MemoryRouter initialEntries={['/tor/example']}><Routes><Route path="/:cityShortcode/:slug" element={<CafeDetailWrapper />} /></Routes></MemoryRouter>)
    expect(screen.getByText(COPY.pwa.expired)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: COPY.pwa.backToList })).toBeInTheDocument()
    mock.data.cafeStatus = 'error'
    view.rerender(<MemoryRouter initialEntries={['/tor/example']}><Routes><Route path="/:cityShortcode/:slug" element={<CafeDetailWrapper />} /></Routes></MemoryRouter>)
    expect(screen.getByText(COPY.pwa.detailMissing)).toBeInTheDocument()
    expect(screen.getByText(COPY.pwa.missingOffline)).toBeInTheDocument()
  })
})

for (const online of [true, false]) {
  for (const help of [true, false]) {
    it(`does not refill after clearing in ${help ? 'help' : 'notice'} while ${online ? 'online' : 'offline'}`, async () => {
      mock.online = online
      render(<MemoryRouter>{help ? <InstallHelpView /> : <CafeDataNotice city="toronto" />}</MemoryRouter>)
      await userEvent.click(screen.getByRole('button', { name: COPY.pwa.clearData }))
      expect(mock.data.clearOfflineCafes).toHaveBeenCalledOnce()
      expect(mock.data.fetchCafes).not.toHaveBeenCalled()
      expect(screen.getByText(COPY.pwa.clearDone)).toBeInTheDocument()
      await userEvent.click(screen.getByRole('button', { name: COPY.pwa.retry }))
      expect(mock.data.fetchCafes).toHaveBeenCalledWith({ city: 'toronto' }, true)
    })
  }
}
