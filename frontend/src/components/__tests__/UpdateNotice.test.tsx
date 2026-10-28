import { expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { COPY } from '../../constants/copy'
vi.mock('../../pwa/register', () => ({ hasShellUpdate: () => true, subscribeShellUpdate: () => () => {} }))
import { UpdateNotice } from '../UpdateNotice'
it('offers safe instructions and preserves focus on action and dismissal without reloading an editor', async () => {
  render(<><UpdateNotice /><main data-cafe-view tabIndex={-1}>Editor with unsaved changes</main></>)
  expect(screen.getByRole('status')).toHaveTextContent(COPY.pwa.updateAvailable)
  await userEvent.click(screen.getByRole('button', { name: COPY.pwa.updateAction }))
  await waitFor(() => expect(screen.getByText(COPY.pwa.updateInstructions)).toHaveFocus())
  await userEvent.click(screen.getByRole('button', { name: COPY.pwa.dismissUpdate }))
  expect(screen.queryByRole('status')).not.toBeInTheDocument()
  await waitFor(() => expect(screen.getByRole('main')).toHaveFocus())
})
