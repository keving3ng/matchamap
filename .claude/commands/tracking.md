---
description: Add analytics tracking to a component
args:
  - name: event_type
    description: Type of tracking event (cafe_view, cafe_directions, cafe_passport, cafe_instagram, cafe_tiktok, feed_click, event_click)
    required: true
  - name: component_name
    description: Name of the component to add tracking to (optional - will search if not provided)
    required: false
---

Add analytics tracking to a component following the metrics-tracking PRD.

## Steps:

1. **Verify tracking utility exists** (`src/utils/analytics.ts`):
   - Check if `trackCafeStat()`, `trackFeedClick()`, `trackEventClick()` functions exist
   - If not, create them with fire-and-forget POST requests
   - Functions should silently ignore errors (`.catch(() => {})`)

2. **Identify the component**:
   {{#if component_name}}
   - Component: `{{component_name}}`
   {{else}}
   - Search for components that match the event type
   - Present options to the user if multiple matches found
   {{/if}}

3. **Add tracking based on event type**:

   **For `cafe_view`:**
   - Add tracking in `useEffect` when component mounts
   - Example:
   ```tsx
   useEffect(() => {
     trackCafeStat(cafe.id, 'view')
   }, [cafe.id])
   ```

   **For `cafe_directions`:**
   - Add tracking to onClick handler of directions link/button
   - Example:
   ```tsx
   <a
     href={mapsUrl}
     onClick={() => trackCafeStat(cafe.id, 'directions')}
   >
     Get Directions
   </a>
   ```

   **For `cafe_passport`:**
   - Add tracking when passport is marked (only on mark, not unmark)
   - Example:
   ```tsx
   const handleToggleVisited = (cafeId: number) => {
     onToggleVisited(cafeId)
     if (!isVisited) {
       trackCafeStat(cafeId, 'passport')
     }
   }
   ```

   **For `cafe_instagram` / `cafe_tiktok`:**
   - Add tracking to onClick handler of social links
   - Example:
   ```tsx
   <a
     href={cafe.instagram}
     onClick={() => trackCafeStat(cafe.id, 'instagram')}
   >
     Instagram
   </a>
   ```

   **For `feed_click`:**
   - Add tracking to feed article links
   - Example:
   ```tsx
   <a
     href={article.link}
     onClick={() => trackFeedClick(article.id)}
   >
     {article.title}
   </a>
   ```

   **For `event_click`:**
   - Add tracking to event links
   - Example:
   ```tsx
   <a
     href={event.link}
     onClick={() => trackEventClick(event.id)}
   >
     {event.name}
   </a>
   ```

4. **Import the tracking function** at the top of the component:
   ```tsx
   import { trackCafeStat, trackFeedClick, trackEventClick } from '@/utils/analytics'
   ```

5. **Verify the backend endpoint exists**:
   - Check that corresponding API endpoint exists in `workers/src/routes/stats.ts`
   - Endpoints should be:
     - `POST /api/stats/cafe/:cafeId/:stat`
     - `POST /api/stats/feed/:feedItemId`
     - `POST /api/stats/event/:eventId`

6. **Summary**:
   - Show which component was updated
   - Show what tracking was added
   - Remind: Tracking is fire-and-forget, won't block UI
   - Remind: Check admin stats page at `/admin/stats` to see metrics

## Tracking Principles:

- **Fire and forget**: Never block UI for analytics
- **Silent failures**: Ignore errors silently with `.catch(() => {})`
- **No personal data**: Only track cafe/content IDs
- **Simple counters**: Backend just increments counters in DB

Add tracking for: **{{event_type}}**
{{#if component_name}}to component: **{{component_name}}**{{/if}}
