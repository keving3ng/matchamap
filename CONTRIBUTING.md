# Contributing to MatchaMap

Thank you for your interest in contributing to MatchaMap! This guide will help you get started.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Testing Requirements](#testing-requirements)
- [Pull Request Process](#pull-request-process)
- [Documentation](#documentation)
- [Community](#community)

---

## Code of Conduct

### Our Standards

- **Be respectful** - Treat everyone with respect and kindness
- **Be constructive** - Provide helpful feedback and suggestions
- **Be collaborative** - Work together towards shared goals
- **Be inclusive** - Welcome contributors of all backgrounds and experience levels

### Unacceptable Behavior

- Harassment, discrimination, or offensive comments
- Trolling, insulting, or derogatory remarks
- Public or private harassment
- Publishing others' private information without consent

**Reporting:** Email conduct@matchamap.app for Code of Conduct violations.

---

## Getting Started

### Prerequisites

- **Node.js** - v18 or higher
- **npm** - v9 or higher
- **Git** - For version control
- **Cloudflare account** - For backend development (free tier works)

### Initial Setup

1. **Fork the Repository**
   ```bash
   # Click "Fork" on GitHub
   # Then clone your fork
   git clone https://github.com/YOUR_USERNAME/matchamap.git
   cd matchamap
   ```

2. **Install Dependencies**
   ```bash
   # Install all workspace dependencies
   npm install
   ```

3. **Set Up Frontend**
   ```bash
   cd frontend
   cp .env.example .env
   # Edit .env with your local backend URL
   npm run dev
   # → http://localhost:5173
   ```

4. **Set Up Backend**
   ```bash
   cd backend

   # Create local D1 database
   npx wrangler d1 create matchamap-db-local

   # Run migrations
   npm run db:migrate:local

   # Start dev server
   npm run dev:backend
   # → http://localhost:8787
   ```

5. **Run Tests**
   ```bash
   # From project root
   npm test
   # Should see: 100% tests passing ✅
   ```

### Development Documentation

- **[CLAUDE.md](CLAUDE.md)** - Main development guide (⭐ START HERE)
- **[QUICKSTART_BACKEND.md](docs/QUICKSTART_BACKEND.md)** - Backend setup guide
- **[TESTING.md](docs/TESTING.md)** - Testing guide
- **[docs/README.md](docs/README.md)** - Documentation navigation

---

## Development Workflow

### 1. Create a Branch

```bash
# Always branch from main
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/your-feature-name

# Or bug fix branch
git checkout -b fix/bug-description
```

**Branch naming:**
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test additions/updates

### 2. Make Your Changes

Follow the [Code Standards](#code-standards) below.

### 3. Write Tests

**Required:**
- All new features must have tests
- Bug fixes must have regression tests
- Maintain or improve code coverage

```bash
# Run tests
npm test

# Run with coverage
npm test -- --coverage
```

### 4. Test Locally

```bash
# Frontend
cd frontend && npm run dev

# Backend
cd backend && npm run dev:backend

# Run full build
npm run build
```

### 5. Commit Your Changes

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
git add .

# Format: type(scope): description
git commit -m "feat(map): add cafe clustering for better performance"
git commit -m "fix(auth): resolve token refresh race condition"
git commit -m "docs(api): update authentication flow diagram"
```

**Commit types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation only
- `style:` - Formatting (no code change)
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `chore:` - Maintenance tasks

### 6. Push and Create PR

```bash
# Push to your fork
git push origin feature/your-feature-name

# Create Pull Request on GitHub
# Use the PR template provided
```

**CI from a fork:** GitHub Actions runs tests and lint on your PR, but **repository secrets** (for example deploy keys) are **not** available to forked workflows. Production deploy still happens from pushes to `main` in this repo. See **[docs/CI.md](docs/CI.md)** for details.

---

## Code Standards

### TypeScript

**MUST follow:**
- ✅ **Strict mode** enabled (`tsconfig.json`)
- ✅ **No `any` types** - Use proper types or `unknown`
- ✅ **Interface over type** for objects
- ✅ **Named exports** (not default exports)

**Example:**
```typescript
// ✅ GOOD
export interface CafeCardProps {
  cafe: CafeWithDistance
  onSelect: (cafe: CafeWithDistance) => void
}

export const CafeCard: React.FC<CafeCardProps> = ({ cafe, onSelect }) => {
  // ...
}

// ❌ BAD
export default function CafeCard(props: any) {
  // ...
}
```

### React Components

**MUST follow:**
- ✅ **Functional components only** (no class components)
- ✅ **TypeScript `.tsx`** extension
- ✅ **Props interface first** before component
- ✅ **One component per file**
- ✅ **File name matches component name** (`CafeCard.tsx`)

**Performance:**
- Use `React.memo` for expensive components
- Use `useMemo` for expensive calculations
- Use `useCallback` for event handlers passed to children
- Avoid inline object/array creation in render

### Critical Patterns (MUST Follow)

#### 1. Copy Constants

**ALWAYS use centralized copy:**
```typescript
// ✅ CORRECT
import { COPY } from '@/constants/copy'

<button>{COPY.map.getDirections}</button>

// ❌ WRONG
<button>Get Directions</button>
```

#### 2. API Client

**ALWAYS use centralized API client:**
```typescript
// ✅ CORRECT
import { api } from '@/utils/api'
await api.cafes.getAll()

// ❌ WRONG
fetch('/api/cafes')
```

#### 3. Shared UI Components

**ALWAYS use shared components:**
```typescript
// ✅ CORRECT
import { PrimaryButton, ScoreBadge } from '@/components/ui'

<PrimaryButton onClick={handleClick}>Submit</PrimaryButton>

// ❌ WRONG
<button className="bg-gradient-to-r from-green-600...">Submit</button>
```

#### 4. State Management

**Use appropriate state solution:**
- **Zustand stores** - Global state, persistence
- **Custom hooks** - Reusable logic, side effects
- **useState** - Local component state

```typescript
// Global state: Use Zustand
import { useAuthStore } from '@/stores/authStore'

// Reusable logic: Use custom hook
import { useGeolocation } from '@/hooks/useGeolocation'

// Local state: Use useState
const [isOpen, setIsOpen] = useState(false)
```

### CSS/Styling

**MUST follow:**
- ✅ **Tailwind CSS only** (no custom CSS files)
- ✅ **Tailwind spacing classes** (p-4, not p-[16px])
- ✅ **Mobile-first** (base = mobile, then sm:, md:, lg:)
- ✅ **Design tokens** from `styles/spacing.ts`

```typescript
// ✅ CORRECT
<div className="p-4 rounded-xl shadow-lg sm:p-6 md:p-8">

// ❌ WRONG
<div className="p-[16px] rounded-[24px]" style={{boxShadow: '...'}}>
```

### File Organization

```
frontend/src/
├── components/       # React components
│   ├── ui/          # ⭐ Shared UI components (use these!)
│   ├── admin/       # Admin components
│   └── auth/        # Auth components
├── hooks/           # Custom hooks ONLY
├── stores/          # Zustand stores ONLY
├── utils/           # Pure functions ONLY
├── constants/       # ⭐ copy.ts (all strings)
└── types/           # TypeScript types
```

**Rules:**
- Components in `components/`
- Hooks in `hooks/` (must start with `use`)
- Stores in `stores/` (Zustand only)
- Pure functions in `utils/`
- No god components (>300 lines → refactor)

---

## Testing Requirements

### Test Coverage

**Minimum requirements:**
- ✅ **Unit tests** for all utilities
- ✅ **Component tests** for UI components
- ✅ **Store tests** for Zustand stores
- ✅ **Integration tests** for API endpoints

**Current status:** 100% tests passing ✅

### Writing Tests

**Component Tests:**
```typescript
import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { CafeCard } from '../CafeCard'

describe('CafeCard', () => {
  it('displays cafe name and score', () => {
    const cafe = createMockCafe({ name: 'Matcha Cafe', displayScore: 9.0 })

    render(<CafeCard cafe={cafe} onSelect={vi.fn()} />)

    expect(screen.getByText('Matcha Cafe')).toBeInTheDocument()
    expect(screen.getByText('9.0')).toBeInTheDocument()
  })

  it('calls onSelect when clicked', async () => {
    const onSelect = vi.fn()
    const cafe = createMockCafe()

    render(<CafeCard cafe={cafe} onSelect={onSelect} />)

    await userEvent.click(screen.getByRole('button'))

    expect(onSelect).toHaveBeenCalledWith(cafe)
  })
})
```

**Store Tests:**
```typescript
import { renderHook, act, waitFor } from '@testing-library/react'
import { useAuthStore } from '../authStore'
import { waitForPersistence } from '@/test/helpers'

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.getState().logout()
  })

  it('sets user on successful login', async () => {
    const { result } = renderHook(() => useAuthStore())

    await act(async () => {
      await result.current.login('test@example.com', 'password')
    })

    await waitForPersistence()

    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.user).toBeDefined()
  })
})
```

**See:** [TESTING.md](docs/TESTING.md) for complete testing guide.

---

## Pull Request Process

### Before Submitting

**Checklist:**
- [ ] Tests pass (`npm test`)
- [ ] Build succeeds (`npm run build`)
- [ ] TypeScript compiles (`npm run typecheck`)
- [ ] Linter passes (`npm run lint`)
- [ ] Code follows patterns in CLAUDE.md
- [ ] Documentation updated (if needed)
- [ ] Commit messages follow Conventional Commits

### PR Template

When creating a PR, include:

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Refactoring

## Testing
- [ ] Unit tests added/updated
- [ ] Manual testing completed
- [ ] All tests passing

## Screenshots (if applicable)
[Add screenshots for UI changes]

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
```

### Review Process

1. **Automated Checks**
   - CI/CD runs tests and build
   - Must pass before review

2. **Code Review**
   - Maintainer reviews code
   - May request changes

3. **Approval**
   - At least one maintainer approval required
   - All conversations resolved

4. **Merge**
   - Maintainer merges to main
   - Squash merge preferred

### After Merge

- Your PR will be included in the next release
- You'll be credited in release notes
- Thank you for contributing! 🎉

---

## Documentation

### When to Update Docs

**MUST update documentation when:**
- Adding new API endpoints
- Changing database schema
- Adding new features
- Changing user-facing behavior
- Updating dependencies

### Documentation Files

- **CLAUDE.md** - Development patterns and principles
- **docs/TECH_SPEC.md** - Technical specifications
- **docs/api/** - API and database documentation
- **docs/user-guide/** - User-facing guides
- **Code comments** - JSDoc for public functions

### Writing Good Documentation

```typescript
/**
 * Creates a new review for a cafe with optional photo upload.
 *
 * @param cafeId - The ID of the cafe being reviewed
 * @param review - Review data including rating (1-10), text, and optional photo
 * @returns The created review with generated ID and timestamps
 *
 * @throws {Error} 'Unauthorized' if user is not authenticated
 * @throws {Error} 'Validation error' if rating is out of range
 *
 * @example
 * ```typescript
 * const review = await api.reviews.create(123, {
 *   rating: 9,
 *   text: 'Amazing matcha latte!',
 *   photo: photoFile
 * })
 * ```
 */
async create(cafeId: number, review: CreateReviewRequest): Promise<Review>
```

---

## Community

### Getting Help

- **Discord** - Join our [Discord server](#) (future)
- **GitHub Discussions** - Ask questions on [Discussions](https://github.com/keving3ng/matchamap/discussions)
- **Email** - dev@matchamap.app

### Reporting Issues

**Good bug report includes:**
1. **Clear title** - Describe the issue briefly
2. **Steps to reproduce** - How to trigger the bug
3. **Expected behavior** - What should happen
4. **Actual behavior** - What actually happens
5. **Environment** - Browser, OS, device
6. **Screenshots** - If applicable

**Example:**
```markdown
**Title:** Map markers not updating after city change

**Steps to Reproduce:**
1. Load map with Toronto selected
2. Change city to Montreal
3. Map still shows Toronto markers

**Expected:** Map should show Montreal markers
**Actual:** Map shows Toronto markers until page refresh
**Environment:** Chrome 120, macOS 14.0
```

### Feature Requests

We welcome feature ideas! Please:
1. Check if feature already requested
2. Explain the use case
3. Describe proposed solution
4. Consider implementation complexity

---

## Quick Reference

### Common Commands

```bash
# Development
npm run dev              # Start frontend (Vite)
npm run dev:backend      # Start backend (Wrangler)

# Testing
npm test                 # Run all tests
npm test -- --watch      # Watch mode
npm test -- --coverage   # With coverage

# Quality Checks
npm run typecheck        # TypeScript type checking
npm run lint             # ESLint
npm run build            # Production build

# Database (backend/)
npm run db:generate      # Generate migration
npm run db:migrate:local # Apply migrations locally
```

### Key Files to Know

- **CLAUDE.md** - Main development guide ⭐
- **docs/README.md** - Documentation index
- **frontend/src/constants/copy.ts** - All user-facing strings
- **frontend/src/components/ui/** - Shared UI components
- **frontend/src/utils/api.ts** - API client
- **docs/TESTING.md** - Testing guide

---

## Questions?

- Read [CLAUDE.md](CLAUDE.md) - Answers most development questions
- Check [docs/README.md](docs/README.md) - Full documentation index
- Ask on [GitHub Discussions](https://github.com/keving3ng/matchamap/discussions)
- Email dev@matchamap.app

**Thank you for contributing to MatchaMap! 🍵**
