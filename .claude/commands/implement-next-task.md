# Implement Next Task

Automatically implement the next pending task from V1_TODO.md with full development workflow.

## Usage

```
/implement-next-task
```

## What it does

1. **Reads V1_TODO.md** and identifies the next uncompleted task (first `[ ]` checkbox)
2. **Implements the feature** following MatchaMap's development standards
3. **Runs typecheck** and fixes any TypeScript errors
4. **Creates unit tests** for the new functionality
5. **Runs tests** and fixes any test failures
6. **Updates V1_TODO.md** to mark the task as completed (`[x]`)
7. **Outputs summary** of what was implemented

## Implementation Steps

The command will:

- Parse V1_TODO.md to find the first unchecked task
- Create necessary files and components following React.FC pattern
- Implement the feature with proper TypeScript typing
- Add comprehensive unit tests using Vitest + React Testing Library
- Run `npm run typecheck` and fix any issues
- Run `npm test` and resolve failures
- Update the todo file to mark completion
- Provide a concise summary of the implemented feature

## Example Output

```
✅ Implemented Task #5: Distance calculation from user location

📋 What was built:
- Created useDistanceCalculation hook with Haversine formula
- Updated cafe data with real-time distance calculations
- Added distance sorting functionality
- Implemented user location change handling

🔧 Technical details:
- Added 3 new files: hooks/useDistanceCalculation.ts, utils/distance.ts, __tests__/useDistanceCalculation.test.ts
- All TypeScript checks passed
- 8/8 unit tests passing
- Updated V1_TODO.md task #5 marked complete

🎯 Next task: #6 - Add map-to-list view toggle functionality
```

## Requirements

- Must be run from MatchaMap project root
- Requires npm/node environment
- V1_TODO.md must exist in project root