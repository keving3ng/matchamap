# MatchaMap Data Schema

## Overview

MatchaMap uses a single JSON file as its primary data source, containing all cafe information and news content. This approach ensures fast builds, zero hosting costs, and simple content management for V1.

## File Structure

```
src/data/
└── cafes.json          # Primary data file
```

## Main Data Schema

### Root Object Structure

```json
{
  "cafes": [...],         # Array of cafe objects
  "news": [...],          # Array of news/blog posts
  "metadata": {...}       # Schema version and update info
}
```

## Cafe Object Schema

### Complete Cafe Entry

```json
{
  "id": "unique-cafe-identifier",
  "name": "Cafe Name",
  "address": "123 Street Name, Toronto, ON M5V 1A1",
  "coordinates": {
    "lat": 43.6532,
    "lng": -79.3832
  },
  "neighborhood": "Downtown",
  "primaryScore": 8.5,
  "secondaryScores": {
    "value": 7.0,
    "ambiance": 9.0,
    "otherDrinks": 6.5
  },
  "reviewText": "Detailed review content describing the matcha quality, atmosphere, and overall experience.",
  "quickNotes": "Brief highlights for list view",
  "socialMedia": {
    "instagram": "@cafename",
    "tiktok": "@cafename"
  },
  "details": {
    "hours": "Monday-Friday: 8am-6pm, Saturday-Sunday: 9am-7pm",
    "priceRange": "$$",
    "menuHighlights": "Ceremonial grade matcha, house-made wagashi, matcha soft serve"
  },
  "images": {
    "primary": "cafe-main.jpg",
    "thumbnails": ["thumb1.jpg", "thumb2.jpg", "thumb3.jpg"]
  },
  "dateAdded": "2024-01-15",
  "lastUpdated": "2024-01-15",
  "status": "active"
}
```

### Field Specifications

#### Required Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `id` | string | Unique identifier (kebab-case) | `"nana-tea-king-west"` |
| `name` | string | Cafe display name | `"Nana Tea"` |
| `address` | string | Full street address | `"123 King St W, Toronto, ON M5V 1A1"` |
| `coordinates.lat` | number | Latitude (Toronto range: 43.58-43.86) | `43.6532` |
| `coordinates.lng` | number | Longitude (Toronto range: -79.64--79.12) | `-79.3832` |
| `neighborhood` | string | Toronto neighborhood | `"King West"` |
| `primaryScore` | number | Main matcha rating (0-10, 1 decimal) | `8.5` |
| `reviewText` | string | Detailed review content | `"Exceptional ceremonial grade..."` |
| `dateAdded` | string | ISO date when added | `"2024-01-15"` |
| `status` | string | Publication status | `"active"` |

#### Optional Fields

| Field | Type | Description | Default |
|-------|------|-------------|---------|
| `secondaryScores` | object | Additional ratings | `null` |
| `quickNotes` | string | Brief highlights | `""` |
| `socialMedia` | object | Social media handles | `{}` |
| `details` | object | Additional info | `{}` |
| `images` | object | Image references | `{}` |
| `lastUpdated` | string | ISO date of last update | `dateAdded` |

#### Secondary Scores Object

```json
{
  "value": 7.0,           // Price-to-quality ratio (0-10)
  "ambiance": 9.0,        // Atmosphere and vibe (0-10)
  "otherDrinks": 6.5,     // Non-matcha beverages (0-10)
  "service": 8.0,         // Staff and service quality (0-10)
  "accessibility": 7.5    // Wheelchair/accessibility (0-10)
}
```

#### Details Object

```json
{
  "hours": "Monday-Friday: 8am-6pm, Saturday-Sunday: 9am-7pm",
  "priceRange": "$$",     // $ | $$ | $$$ | $$$$
  "menuHighlights": "Ceremonial grade matcha, house-made wagashi",
  "wifi": "Free WiFi available",
  "seating": "30 seats, mix of tables and counter",
  "specialties": "Traditional tea ceremony on weekends"
}
```

#### Images Object

```json
{
  "primary": "cafe-name-main.jpg",        // Main cafe photo
  "thumbnails": [                         // Additional photos
    "cafe-name-interior.jpg",
    "cafe-name-matcha.jpg",
    "cafe-name-exterior.jpg"
  ]
}
```

## News/Blog Object Schema

### News Entry Structure

```json
{
  "id": "unique-news-identifier",
  "title": "New Cafe Addition: Matcha & Co",
  "content": "We're excited to announce the addition of Matcha & Co to our curated list...",
  "date": "2024-01-15",
  "type": "addition",
  "relatedCafe": "matcha-and-co-downtown",
  "author": "MatchaMap Team",
  "tags": ["new-addition", "downtown"],
  "status": "published"
}
```

### News Field Specifications

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique identifier |
| `title` | string | Yes | Post headline |
| `content` | string | Yes | Full post content (supports markdown) |
| `date` | string | Yes | Publication date (ISO format) |
| `type` | string | Yes | `addition` \| `update` \| `announcement` \| `review` |
| `relatedCafe` | string | No | Cafe ID if post relates to specific cafe |
| `author` | string | No | Author name |
| `tags` | array | No | Content tags for categorization |
| `status` | string | Yes | `published` \| `draft` |

## Metadata Schema

### Metadata Object

```json
{
  "schemaVersion": "1.0",
  "lastUpdated": "2024-01-15T10:30:00Z",
  "totalCafes": 25,
  "neighborhoods": [
    "Downtown",
    "King West",
    "Queen West",
    "Kensington Market",
    "Little Italy",
    "The Beaches"
  ],
  "scoreRange": {
    "min": 0,
    "max": 10
  }
}
```

## Data Validation Rules

### Cafe Validation

```javascript
// Basic validation schema
const cafeSchema = {
  id: {
    type: 'string',
    pattern: '^[a-z0-9-]+$',
    required: true
  },
  name: {
    type: 'string',
    minLength: 1,
    maxLength: 100,
    required: true
  },
  coordinates: {
    type: 'object',
    properties: {
      lat: {
        type: 'number',
        min: 43.0,
        max: 44.0
      },
      lng: {
        type: 'number',
        min: -80.0,
        max: -79.0
      }
    },
    required: true
  },
  primaryScore: {
    type: 'number',
    min: 0,
    max: 10,
    required: true
  }
};
```

### Content Guidelines

#### Neighborhood Names
Use consistent neighborhood naming:
- "Downtown" (not "Downtown Core")
- "King West" (not "King Street West")
- "Queen West" (not "Queen Street West")
- "Kensington Market"
- "Little Italy"
- "The Beaches" (not "The Beach")

#### Review Content
- **Length**: 100-500 words for full reviews
- **Tone**: Friendly, informative, honest
- **Focus**: Matcha quality, atmosphere, value
- **Style**: First-person experience-based

#### Quick Notes
- **Length**: 10-50 words
- **Purpose**: Highlights for list view
- **Format**: Comma-separated key points

## Sample Data Files

### Minimal Example

```json
{
  "cafes": [
    {
      "id": "sample-cafe-downtown",
      "name": "Sample Matcha Cafe",
      "address": "100 Queen St W, Toronto, ON M5H 2N2",
      "coordinates": {
        "lat": 43.6532,
        "lng": -79.3832
      },
      "neighborhood": "Downtown",
      "primaryScore": 8.0,
      "reviewText": "A cozy spot with excellent ceremonial grade matcha. The traditional preparation and knowledgeable staff make this a must-visit for matcha enthusiasts.",
      "dateAdded": "2024-01-15",
      "status": "active"
    }
  ],
  "news": [
    {
      "id": "welcome-post",
      "title": "Welcome to MatchaMap!",
      "content": "We're excited to launch MatchaMap, your guide to the best matcha cafes in Toronto.",
      "date": "2024-01-15",
      "type": "announcement",
      "status": "published"
    }
  ],
  "metadata": {
    "schemaVersion": "1.0",
    "lastUpdated": "2024-01-15T10:30:00Z",
    "totalCafes": 1
  }
}
```

## Content Management Workflow

### Adding New Cafes

1. **Create unique ID**: Use kebab-case format
2. **Gather required data**: Address, coordinates, initial review
3. **Validate data**: Check schema compliance
4. **Add images**: Upload to `public/images/`
5. **Update JSON**: Add cafe object to array
6. **Update metadata**: Increment totalCafes, update lastUpdated
7. **Test locally**: Verify build and display
8. **Commit and deploy**: Push to trigger rebuild

### Updating Existing Cafes

1. **Locate cafe by ID**: Find in cafes array
2. **Update fields**: Modify relevant properties
3. **Update lastUpdated**: Set to current date
4. **Update metadata.lastUpdated**: Set to current timestamp
5. **Create news entry**: If significant change
6. **Test and deploy**: Verify changes

### Content Review Process

1. **Monthly Review**: Check all active cafes for accuracy
2. **Score Updates**: Adjust ratings based on recent visits
3. **Status Changes**: Mark closed cafes as inactive
4. **Image Updates**: Replace outdated photos
5. **Metadata Sync**: Ensure counts and dates are accurate

## Image Management

### Image Naming Convention

```
public/images/
├── cafes/
│   ├── cafe-id-main.jpg           # Primary image
│   ├── cafe-id-interior.jpg       # Interior shot
│   ├── cafe-id-matcha.jpg         # Matcha/drink photo
│   └── cafe-id-exterior.jpg       # Exterior/storefront
└── news/
    └── news-id-featured.jpg       # News post images
```

### Image Specifications

- **Format**: JPEG for photos, PNG for graphics
- **Primary Images**: 800x600px, optimized for web
- **Thumbnails**: 400x300px
- **File Size**: < 200KB per image
- **Alt Text**: Descriptive, included in component

## API Endpoints (Future)

### Read-Only Endpoints (V2 Planning)

```
GET /api/cafes              # All cafes
GET /api/cafes/:id          # Single cafe
GET /api/cafes/search       # Search/filter cafes
GET /api/news               # News feed
GET /api/neighborhoods      # Neighborhood list
```

### Response Format

```json
{
  "data": [...],
  "meta": {
    "total": 25,
    "lastUpdated": "2024-01-15T10:30:00Z"
  }
}
```

---

*Data Schema Version: 1.0*
*Last Updated: [Current Date]*
*Status: V1 Implementation*