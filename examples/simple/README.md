# Filestack Configuration - Simple View Registry

This example demonstrates a simple approach where:
- **`filestack.json`** serves as a **view registry** with a list of views
- **Markdown files** contain the actual view content
- **Order** of views in the registry determines their display order

## 📁 File Structure

```
examples/simple/
├── filestack.json              # View registry (what views exist)
├── user/
│   ├── user.ts                 # User model file
│   ├── user.test.ts            # User test file
│   └── user-view.md            # User domain view content
└── product/
    ├── product.ts              # Product model file
    ├── product.test.ts         # Product test file
    └── product-view.md         # Product domain view content
```

## 🔧 Configuration

### filestack.json (View Registry)
```json
{
  "views": [
    {
      "title": "User Domain",
      "path": "user/user-view.md"
    },
    {
      "title": "Product Domain", 
      "path": "product/product-view.md"
    }
  ]
}
```

### user/user-view.md (View Content)
```markdown
---
title: User Domain
files: ["user/user.ts", "user/user.test.ts"]
---

# User Domain

This view contains the core user management functionality...

## User Model

The User interface defines the structure for user data:

```typescript:user/user.ts
// User Model
```

## Architecture Notes

The user domain handles authentication...

- User API endpoints
- Authentication contracts
- User service layer
```

## 🎯 Benefits of This Approach

### 1. **Simple and Clean**
- Minimal configuration with just title and path
- Easy to understand and maintain
- No complex nested structures

### 2. **Order-Based Rendering**
- Views are rendered in the order they appear in the registry
- Easy to reorder by moving entries in the JSON array
- Predictable display order

### 3. **Human Readable Content**
- Markdown files are easy to read and edit
- Can be opened in any text editor
- Great for version control diffs

### 4. **Organized by Domain**
- Each domain has its own directory
- View content lives with the code it documents
- Easy to find and maintain

## 🔄 How It Works

1. **App loads** `filestack.json` to discover views
2. **Views are ordered** by their position in the registry array
3. **For each view**, loads content from the specified Markdown file
4. **Content is parsed** and rendered in TipTap editor
5. **Views are displayed** in the sidebar in the same order as the registry

## 📝 Content File Format

### Front Matter (YAML-style)
```markdown
---
title: View Title
files: ["file1.ts", "file2.ts"]
---
```

### Monaco Blocks
```markdown
```typescript:user/user.ts
// User Model
```
```

### Standard Markdown
```markdown
# Headings
## Subheadings

Regular paragraphs with **bold** and *italic* text.

- List items
- More items

> Blockquotes for important notes
```

## 🚀 Migration Path

### From Inline JSON Content
1. **Extract content** from `filestack.json`
2. **Create Markdown file** in appropriate domain directory
3. **Add contentFile** reference to view in `filestack.json`
4. **Remove inline content** from `filestack.json`

### From No Content
1. **Create Markdown file** in domain directory
2. **Add contentFile** reference to view
3. **Write documentation** in Markdown format

## 🔧 Development Workflow

### Adding a New View
1. **Create domain directory** (if it doesn't exist)
2. **Add files** to the domain
3. **Create view Markdown file** with documentation
4. **Add view entry** to `filestack.json`

### Editing View Content
1. **Open Markdown file** in your preferred editor
2. **Edit content** using standard Markdown syntax
3. **Save file** - changes are reflected in the app

### Adding Monaco Blocks
1. **Use special syntax**: ` ```language:filepath`
2. **Add comment** for block title
3. **Close with** ` ````

## 🎨 Monaco Block Syntax

### Basic Syntax
```markdown
```typescript:user/user.ts
// User Model
```
```

### With Custom Title
```markdown
```typescript:user/user.ts
// User Interface Definition
```
```

### Multiple Blocks
```markdown
```typescript:user/user.ts
// User Model
```

```typescript:user/user.test.ts
// User Tests
```
```

## 🔍 File Paths

### Relative to Workspace Root
- `contentFile: "user/user-view.md"` → `workspace/user/user-view.md`
- `contentFile: "src/components/Button/button-view.md"` → `workspace/src/components/Button/button-view.md`

### Absolute Paths (if needed)
- `contentFile: "/docs/user-view.md"` → `/docs/user-view.md`

## 🛠️ Advanced Features

### Conditional Content
```markdown
# User Domain

This view contains user management functionality.

<!-- Only show in development -->
## Development Notes
- Debug mode enabled
- Mock data available

<!-- Only show in production -->
## Production Notes
- Authentication required
- Rate limiting active
```

### External References
```markdown
# User Domain

See also:
- [API Documentation](../docs/api.md)
- [Testing Guide](../docs/testing.md)
- [Architecture Overview](../docs/architecture.md)
```

### Code Examples
```markdown
## Usage Example

```typescript
import { User } from './user';

const user = new User({
  id: '123',
  name: 'John Doe',
  email: 'john@example.com'
});
```
``` 