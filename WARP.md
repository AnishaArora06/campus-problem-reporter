# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Campus Problem Reporter is a modern, client-side web application for reporting and managing campus facility issues. It's built entirely with vanilla HTML5, CSS3, and JavaScript ES6+ without any frameworks, utilizing localStorage for data persistence.

## Commands

### Development Commands
```bash
# Since this is a static website, no build process is required
# Simply open any HTML file in a web browser:

# Windows
start index.html
# Or double-click any HTML file

# The application runs entirely client-side with no server dependencies
```

### Testing the Application
```bash
# Open individual pages for testing:
start index.html      # Homepage with hero section and featured problems
start student.html    # Problem reporting form
start admin.html      # Admin dashboard for managing problems

# Test responsive design by resizing browser window or using browser dev tools
# Test dark/light theme toggle using the moon/sun icon in navigation
```

### File Structure Commands
```bash
# View the complete file structure:
dir /s    # Windows
# or
tree      # if tree command is available

# Main files to work with:
# index.html - Homepage
# student.html - Problem reporting form
# admin.html - Admin dashboard
# css/style.css - All styles and responsive design
# js/script.js - All functionality and state management
```

## Architecture & Code Structure

### Frontend Architecture
- **Pure Vanilla JavaScript**: No frameworks, organized using modular manager objects
- **Component-Based CSS**: Semantic class naming with CSS custom properties (variables)
- **Client-Side State Management**: Uses AppState object and localStorage for persistence
- **Modal System**: Centralized modal management with stack support

### Key JavaScript Modules
The `js/script.js` file is organized into manager objects:

1. **AppState**: Global state container (theme, problems, user, modals)
2. **ThemeManager**: Dark/light mode functionality
3. **NavigationManager**: Mobile menu, smooth scrolling, active states
4. **AnimationManager**: Intersection Observer animations, counters
5. **FormManager**: Form validation, submission, file uploads
6. **ModalManager**: Modal show/hide with stacking support
7. **AdminDashboard**: Problem filtering, status updates, data export
8. **SampleDataManager**: Loads demo data if localStorage is empty
9. **PerformanceManager**: Lazy loading, scroll optimizations

### CSS Architecture
- **CSS Custom Properties**: Centralized color and spacing system in `:root`
- **Responsive Design**: Mobile-first approach with breakpoints at 768px, 1200px
- **Component-Based**: Each UI component has its own CSS section
- **Theme Support**: Dark mode variables using `[data-theme="dark"]`
- **Animation System**: CSS animations with JavaScript trigger classes

### Data Flow
1. **Problem Submission**: Form → validation → localStorage → UI update
2. **Admin Management**: Filter/search → render → status update → localStorage
3. **Theme Switching**: Button click → localStorage → CSS variable update
4. **State Persistence**: All data stored in browser localStorage as JSON

## Development Patterns

### Adding New Problem Categories
1. Update select options in `student.html` (lines 75-86)
2. Add corresponding CSS category colors in `style.css` (lines 26-33, 559-564)
3. Update filter options in `admin.html` (lines 155-163)

### Adding New Status Types
1. Update select options in admin forms
2. Add CSS status colors in `:root` variables (lines 20-25)
3. Add corresponding CSS classes for status badges

### Form Validation Rules
Located in `FormManager.handleProblemSubmission()` around line 275:
```javascript
const validationRules = {
    studentName: { required: true, minLength: 2 },
    rollNumber: { required: true, minLength: 3 },
    department: { required: true },
    category: { required: true },
    location: { required: true, minLength: 3 },
    problemDescription: { required: true, minLength: 10 },
    priority: { required: true }
};
```

### Sample Data Structure
Problems are stored as objects with these properties:
- `id`: Unique identifier
- `studentName`, `rollNumber`, `department`: User info
- `category`, `location`, `problemDescription`, `priority`: Problem details
- `status`: "pending" | "in-progress" | "resolved"
- `timestamp`: ISO date string

## Responsive Design

### Breakpoints
- **Mobile**: < 768px (single column layouts, hamburger menu)
- **Tablet**: 768px - 1199px (adjusted grid layouts)
- **Desktop**: ≥ 1200px (full multi-column layouts)

### Key Responsive Components
- Navigation collapses to hamburger menu on mobile
- Problem cards stack vertically on smaller screens
- Form layouts change from 2-column to single-column
- Admin dashboard adapts table layout for mobile viewing

## Browser Compatibility

Targets modern browsers with ES6+ support:
- Chrome 70+, Firefox 65+, Safari 12+, Edge 79+
- Uses modern CSS features: Grid, Flexbox, Custom Properties
- JavaScript features: Arrow functions, Template literals, Destructuring

## File Organization

```
campus-problem-reporter/
├── index.html          # Homepage - hero, stats, team, contact
├── student.html        # Problem reporting form with validation
├── admin.html          # Dashboard with filtering and status management
├── css/
│   └── style.css      # Complete styling system (1100+ lines)
├── js/
│   └── script.js      # All functionality (960+ lines)
├── images/            # Placeholder image references in HTML
└── README.md          # Comprehensive project documentation
```

## Key Features to Understand

### Theme System
- Uses `data-theme` attribute on `<html>` element
- CSS custom properties automatically adapt for dark mode
- Theme preference stored in localStorage

### Modal System
- Supports modal stacking for complex workflows
- Backdrop blur effects and smooth animations
- Keyboard (Escape) and click-outside dismissal

### Search and Filtering
Located in `AdminDashboard.filterProblems()`:
- Real-time search across multiple fields
- Multi-criteria filtering (department, category, status, priority)
- Dynamic result rendering with statistics updates

### Form Validation
- Real-time validation on blur and input events
- Custom error messages with visual feedback
- File upload preview with removal functionality

### Performance Optimizations
- Intersection Observer for animations and lazy loading
- Debounced scroll and input events
- CSS-based animations over JavaScript for better performance

## Common Development Tasks

When extending functionality, maintain these patterns:
- Use the existing manager object structure for new features
- Add new CSS custom properties for colors and spacing
- Implement responsive design from mobile-first perspective
- Store all persistent data in localStorage as JSON
- Use the existing modal system for new dialogs
- Follow the established form validation patterns