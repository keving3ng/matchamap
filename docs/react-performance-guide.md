# React Performance Optimization Guide

**Last Updated:** 2025-11-02

## Overview

This guide provides patterns and best practices for optimizing React component performance in MatchaMap.

---

## When to Optimize

### ⚠️ Don't Optimize Prematurely

Only optimize when you have evidence of performance issues:
- React DevTools Profiler shows slow renders
- User reports jank/lag
- Lighthouse performance score < 90
- Component renders > 100ms

### ✅ When to Apply Optimizations

- Component renders frequently (> 10 times per interaction)
- Component is expensive to render (> 16ms)
- Component receives same props repeatedly
- Component is in a long list (> 50 items)

---

## 1. React.memo

### What It Does

Prevents re-renders when props haven't changed (shallow comparison).

### When to Use

✅ **Use React.memo when:**
- Component renders frequently with same props
- Component has expensive render logic
- Component is in a list
- Parent re-renders often but props rarely change

❌ **Don't use React.memo when:**
- Props change on every render
- Component is cheap to render (< 1ms)
- Component always receives new object/array props

### Example

**Before:**
```tsx
export const CafeCard: React.FC<CafeCardProps> = ({ cafe, onSelect }) => {
  return (
    <div onClick={() => onSelect(cafe)}>
      <h3>{cafe.name}</h3>
      <p>{cafe.address}</p>
    </div>
  )
}
```

**After:**
```tsx
import { memo } from 'react'

export const CafeCard = memo<CafeCardProps>(({ cafe, onSelect }) => {
  return (
    <div onClick={() => onSelect(cafe)}>
      <h3>{cafe.name}</h3>
      <p>{cafe.address}</p>
    </div>
  )
})

CafeCard.displayName = 'CafeCard'
```

### Gotcha: Object/Array Props

React.memo uses shallow comparison. New objects/arrays will always trigger re-renders:

```tsx
// ❌ Creates new array on every render
<CafeList cafes={cafes.filter(c => c.city === 'Toronto')} />

// ✅ Memoize filtered array
const torontoCafes = useMemo(
  () => cafes.filter(c => c.city === 'Toronto'),
  [cafes]
)
<CafeList cafes={torontoCafes} />
```

---

## 2. useMemo

### What It Does

Memoizes expensive computations, only recomputing when dependencies change.

### When to Use

✅ **Use useMemo for:**
- Expensive calculations (sorting, filtering, mapping)
- Creating objects/arrays passed as props to memoized components
- Computations that run on every render but rarely change

❌ **Don't use useMemo for:**
- Cheap calculations (< 1ms)
- Values that change on every render
- Premature optimization

### Example

**Before:**
```tsx
const CafeList: React.FC = () => {
  const { cafes } = useCafeStore()

  // ❌ Sorts on EVERY render (even when cafes unchanged)
  const sortedCafes = cafes.sort((a, b) => a.distance - b.distance)

  return <div>{sortedCafes.map(cafe => ...)}</div>
}
```

**After:**
```tsx
import { useMemo } from 'react'

const CafeList: React.FC = () => {
  const { cafes } = useCafeStore()

  // ✅ Only sorts when cafes array changes
  const sortedCafes = useMemo(
    () => cafes.sort((a, b) => a.distance - b.distance),
    [cafes]
  )

  return <div>{sortedCafes.map(cafe => ...)}</div>
}
```

### Real-World Examples

**Filtering:**
```tsx
const activeCafes = useMemo(
  () => cafes.filter(cafe => cafe.status === 'active'),
  [cafes]
)
```

**Mapping:**
```tsx
const cafeOptions = useMemo(
  () => cafes.map(cafe => ({ value: cafe.id, label: cafe.name })),
  [cafes]
)
```

**Complex calculations:**
```tsx
const stats = useMemo(() => {
  return {
    total: cafes.length,
    visited: cafes.filter(c => visitedIds.includes(c.id)).length,
    average: cafes.reduce((sum, c) => sum + c.rating, 0) / cafes.length,
  }
}, [cafes, visitedIds])
```

---

## 3. useCallback

### What It Does

Memoizes function references, preventing new function creation on every render.

### When to Use

✅ **Use useCallback when:**
- Passing callbacks to memoized child components
- Callback is used as dependency in useEffect/useMemo
- Callback is used in expensive operations

❌ **Don't use useCallback when:**
- Not passing to memoized children
- Component isn't performance-sensitive
- Function is already stable (e.g., from Zustand)

### Example

**Before:**
```tsx
const CafeList: React.FC = () => {
  const selectCafe = useCafeStore(state => state.selectCafe)

  // ❌ Creates new function on every render
  const handleSelect = (cafe: Cafe) => {
    trackCafeStat(cafe.id, 'view')
    selectCafe(cafe.id)
  }

  return (
    <div>
      {cafes.map(cafe => (
        <CafeCard key={cafe.id} cafe={cafe} onSelect={handleSelect} />
      ))}
    </div>
  )
}
```

**After:**
```tsx
import { useCallback } from 'react'

const CafeList: React.FC = () => {
  const selectCafe = useCafeStore(state => state.selectCafe)

  // ✅ Stable function reference
  const handleSelect = useCallback((cafe: Cafe) => {
    trackCafeStat(cafe.id, 'view')
    selectCafe(cafe.id)
  }, [selectCafe])

  return (
    <div>
      {cafes.map(cafe => (
        <MemoizedCafeCard key={cafe.id} cafe={cafe} onSelect={handleSelect} />
      ))}
    </div>
  )
}
```

### Gotcha: Dependencies

Include all values used inside the callback:

```tsx
// ❌ Missing dependency
const handleClick = useCallback(() => {
  console.log(userId) // userId not in dependency array!
}, [])

// ✅ Correct dependencies
const handleClick = useCallback(() => {
  console.log(userId)
}, [userId])
```

---

## 4. Zustand Performance

### Selector Optimization

**Problem:** Selecting multiple values creates new object on every render:

```tsx
// ❌ Always re-renders (new object every time)
const { cafes, selectedCafe } = useCafeStore()
```

**Solution:** Use shallow equality:

```tsx
import { shallow } from 'zustand/shallow'

// ✅ Only re-renders when values actually change
const { cafes, selectedCafe } = useCafeStore(
  state => ({ cafes: state.cafes, selectedCafe: state.selectedCafe }),
  shallow
)
```

### Select Specific Values

```tsx
// ❌ Re-renders on ANY store change
const store = useCafeStore()

// ✅ Only re-renders when cafes change
const cafes = useCafeStore(state => state.cafes)
```

### Avoid Computed Values in Store

```tsx
// ❌ Don't compute in selector
const sortedCafes = useCafeStore(state =>
  state.cafes.sort((a, b) => a.distance - b.distance)
)

// ✅ Use useMemo instead
const cafes = useCafeStore(state => state.cafes)
const sortedCafes = useMemo(
  () => cafes.sort((a, b) => a.distance - b.distance),
  [cafes]
)
```

---

## 5. List Virtualization

### When to Use

For lists with > 50 items, especially with complex items.

### Implementation

```bash
npm install @tanstack/react-virtual
```

```tsx
import { useVirtualizer } from '@tanstack/react-virtual'
import { useRef } from 'react'

export const VirtualCafeList: React.FC<{ cafes: Cafe[] }> = ({ cafes }) => {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: cafes.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100, // Estimated height of each item
    overscan: 5, // Render 5 extra items outside viewport
  })

  return (
    <div
      ref={parentRef}
      className="h-screen overflow-auto"
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map(virtualItem => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <CafeCard cafe={cafes[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  )
}
```

---

## 6. Profiling with React DevTools

### Setup

1. Install [React DevTools](https://react.dev/learn/react-developer-tools)
2. Build in production mode: `npm run build && npm run preview`
3. Open DevTools → Profiler tab

### How to Profile

1. Click **Record**
2. Perform interaction (e.g., scroll, click)
3. Click **Stop**
4. Review flame graph

### What to Look For

**Slow components:**
- Render time > 16ms (yellow/red in flamegraph)
- High number of renders
- Components rendering unnecessarily

**Common issues:**
- Creating new objects/arrays in render
- Missing React.memo on list items
- Expensive computations not memoized
- Selecting entire store instead of specific values

---

## 7. Common Performance Patterns

### Pattern: Expensive List Rendering

**Problem:**
```tsx
const CafeList: React.FC = () => {
  const cafes = useCafeStore(state => state.cafes)

  return (
    <div>
      {cafes.map(cafe => (
        <ExpensiveCafeCard key={cafe.id} cafe={cafe} />
      ))}
    </div>
  )
}
```

**Solution:**
```tsx
import { memo, useMemo } from 'react'

const CafeCard = memo<CafeCardProps>(({ cafe, onSelect }) => {
  // Expensive render logic
})

const CafeList: React.FC = () => {
  const cafes = useCafeStore(state => state.cafes)

  // If list is very long (>100 items), use virtualization
  const items = useMemo(() => cafes.slice(0, 50), [cafes])

  return (
    <div>
      {items.map(cafe => (
        <CafeCard key={cafe.id} cafe={cafe} />
      ))}
    </div>
  )
}
```

### Pattern: Form with Many Fields

**Problem:**
```tsx
const EditCafeForm: React.FC = () => {
  const [formData, setFormData] = useState(initialData)

  // ❌ Updates entire form on every keystroke
  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value })
  }

  return (
    <form>
      {/* 20+ input fields */}
    </form>
  )
}
```

**Solution:**
```tsx
const EditCafeForm: React.FC = () => {
  // ✅ Each field has its own state
  const [name, setName] = useState(initialData.name)
  const [address, setAddress] = useState(initialData.address)
  // ... or use a form library like react-hook-form

  return (
    <form>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <input value={address} onChange={(e) => setAddress(e.target.value)} />
    </form>
  )
}
```

---

## 8. Performance Checklist

Before shipping a new component:

- [ ] Profile with React DevTools in production mode
- [ ] Check render time < 16ms
- [ ] Verify no unnecessary re-renders
- [ ] Use React.memo for list items
- [ ] Memoize expensive computations
- [ ] Optimize Zustand selectors
- [ ] Test on slow device (4x CPU throttling)

---

## Resources

- [React Performance Docs](https://react.dev/learn/render-and-commit)
- [React DevTools](https://react.dev/learn/react-developer-tools)
- [useMemo vs useCallback](https://kentcdodds.com/blog/usememo-and-usecallback)
- [Zustand Performance](https://docs.pmnd.rs/zustand/guides/performance)
- [React Virtual](https://tanstack.com/virtual/latest)

---

**Maintained By:** Engineering Team
**Last Review:** 2025-11-02
