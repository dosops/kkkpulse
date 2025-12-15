# Alert & Incident Manager - Design Guidelines

## Architecture Decisions

### Authentication
**Required** - Multi-user app with team collaboration necessitates authentication.

**Implementation:**
- SSO with Apple Sign-In (iOS) and Google Sign-In (Android/cross-platform)
- Login/signup screens with privacy policy & terms links
- Account screen with logout and delete account options (double confirmation for deletion)
- Profile screen with user avatar (generate 4 preset professional avatars: business professional styles), display name, and notification preferences

### Navigation Structure
**Tab Navigation** (4 tabs + Floating Action Button)

**Tabs:**
1. **Alerts** - Active alert feed with status filters
2. **Incidents** - Registered incident registry
3. **Activity** - Team activity log and notifications
4. **Profile** - User settings and account management

**Floating Action Button (FAB):**
- Core action: "Create Alert" (manual alert creation)
- Position: Bottom-right, above tab bar
- Shadow: shadowOffset {width: 0, height: 2}, shadowOpacity: 0.10, shadowRadius: 2
- Safe area inset: bottom = tabBarHeight + Spacing.xl + 16px

---

## Screen Specifications

### 1. Alerts Feed (Tab 1)
**Purpose:** View and triage all active alerts

**Layout:**
- **Header:** Transparent with left: Filter icon, right: Search icon
- **Main Content:** FlatList with pull-to-refresh
  - Top inset: headerHeight + Spacing.xl
  - Bottom inset: tabBarHeight + Spacing.xl
  - Alert Cards (list items) with:
    - Status indicator (colored vertical bar: red=critical, orange=high, yellow=medium, blue=low)
    - Alert title (bold, truncated 2 lines)
    - Timestamp (relative: "5 min ago")
    - Source badge (pill: "Manual" or "System")
    - Optional thumbnail (60×60px rounded) for attached image
    - Severity icon (top-right corner)
- **Filter Modal:** Slide-up sheet with status checkboxes (New, In Progress, Resolved) and severity toggles

**Interactions:**
- Tap card → Navigate to Alert Detail
- Pull down → Refresh alerts
- Visual feedback: Card scales to 0.98 on press with 150ms spring animation

---

### 2. Alert Detail Screen (Stack)
**Purpose:** View full alert information and take action

**Layout:**
- **Header:** Standard navigation bar with left: Back button, right: More menu (⋯)
  - Title: Alert ID or custom title
  - Not transparent (white/dark background)
- **Main Content:** ScrollView
  - Top inset: Spacing.xl
  - Bottom inset: insets.bottom + Spacing.xl
  
**Content Sections:**
1. **Alert Header:**
   - Large severity badge with icon
   - Alert title (H2)
   - Timestamp and source
   - Status indicator chip

2. **Image Section (if present):**
   - Full-width image with aspect ratio preserved
   - Tap to view full-screen modal
   - Loading skeleton if fetching graph

3. **Information Card:**
   - Description (body text)
   - Custom metadata fields (key-value pairs in subtle card)

4. **Action History Timeline:**
   - Vertical timeline showing: "Taken to work by [User]", "Inspected by [User]"
   - Timestamp for each action

5. **Action Buttons (fixed bottom sheet):**
   - 3 primary action buttons in horizontal row:
     - "Take to Work" (primary color)
     - "Inspect" (secondary color)
     - "Register Incident" (accent color, slightly larger/prominent)
   - Buttons should be pill-shaped with icons
   - Safe area inset: Fixed to bottom with padding = insets.bottom + Spacing.md

**Interactions:**
- Each action shows confirmation toast
- "Register Incident" → Navigate to Incident Registration form
- "Inspect" → Mark as inspected, show inspection timestamp
- "Take to Work" → Assign to current user, change status to In Progress

---

### 3. Create Alert Screen (Modal)
**Purpose:** Manually create a new alert

**Triggered by:** FAB press

**Layout:**
- **Header:** Modal header with left: Cancel button, right: "Create" button (disabled until valid)
  - Title: "New Alert"
- **Main Content:** ScrollView form
  - Top inset: Spacing.xl
  - Bottom inset: insets.bottom + Spacing.xl

**Form Fields:**
1. Alert Title (required, text input)
2. Description (multi-line text area)
3. Severity Selector (segmented control: Low, Medium, High, Critical)
4. Image Attachment:
   - Dashed border card with "Add Image" prompt
   - Options: Camera, Photo Library
   - Preview thumbnail once selected with remove (×) button
5. Custom metadata (optional expandable section)

**Submit Action:**
- "Create" button in header
- Shows loading state
- On success: Dismiss modal, show toast, refresh Alerts feed

---

### 4. Register Incident Screen (Stack)
**Purpose:** Convert alert to formal incident with additional details

**Layout:**
- **Header:** Standard nav with left: Cancel, right: "Register" (disabled until valid)
  - Title: "Register Incident"
- **Main Content:** ScrollView form
  - Top inset: Spacing.xl
  - Bottom inset: insets.bottom + Spacing.xl

**Form Sections:**
1. **Alert Reference:** Non-editable card showing source alert summary
2. **Incident Details:**
   - Incident Title (pre-filled from alert, editable)
   - Severity (pre-filled, editable with picker)
   - Category (dropdown: Hardware, Software, Network, Security, Other)
   - Priority (dropdown: P0-P4)
3. **Custom Fields:**
   - Dynamic form based on incident type
   - Text inputs for additional metadata
4. **Assignee Selector:** User picker (searchable)
5. **Notes:** Multi-line text area

**Submit Action:**
- "Register" button in header
- Confirmation alert: "Convert this alert to an incident?"
- On success: Navigate to Incident Detail, mark original alert as Resolved

---

### 5. Incidents Registry (Tab 2)
**Purpose:** Browse and search registered incidents

**Layout:**
- **Header:** Transparent with search bar prominent, right: Filter icon
- **Main Content:** FlatList with search integration
  - Top inset: headerHeight + Spacing.xl
  - Bottom inset: tabBarHeight + Spacing.xl
  - Incident Cards with:
    - Incident ID (e.g., "INC-2024-001")
    - Title and severity badge
    - Status chip (Open, In Progress, Resolved, Closed)
    - Assigned user avatar + name
    - Last updated timestamp

**Interactions:**
- Tap card → Navigate to Incident Detail
- Search filters by title, ID, assignee
- Pull to refresh

---

### 6. Incident Detail Screen (Stack)
**Purpose:** View full incident information and history

**Layout:**
- **Header:** Standard nav with left: Back, right: Share icon
- **Main Content:** ScrollView
  - Summary card with ID, severity, status, priority
  - Linked alert reference (tap to view original alert)
  - Timeline of updates and status changes
  - Custom field values display
  - Comments section (if multi-user collaboration)

---

### 7. Activity Feed (Tab 3)
**Purpose:** Team activity log and notifications

**Layout:**
- **Header:** Transparent with title "Activity"
- **Main Content:** Grouped FlatList by date
  - Activity items showing: User, action, timestamp, affected alert/incident
  - Icons for different action types (bell for new alerts, checkmark for resolved, etc.)

---

### 8. Profile Screen (Tab 4)
**Purpose:** User settings and account management

**Layout:**
- **Header:** Transparent with title "Profile"
- **Main Content:** ScrollView with sections:
  1. User card (avatar, name, email)
  2. Preferences: Notification settings toggle, theme selector
  3. App info: Version, help docs
  4. Account: Log out, Delete account (nested)

---

## Design System

### Color Palette
- **Primary:** #2563EB (Blue) - Main actions, links
- **Secondary:** #64748B (Slate) - Secondary buttons, borders
- **Accent:** #DC2626 (Red) - Critical severity, destructive actions
- **Success:** #16A34A (Green) - Resolved status, positive actions
- **Warning:** #F59E0B (Amber) - Medium severity
- **Info:** #0EA5E9 (Cyan) - Low severity

### Severity Colors
- Critical: #DC2626 (Red)
- High: #F97316 (Orange)
- Medium: #F59E0B (Amber)
- Low: #0EA5E9 (Cyan)

### Typography
- **Headers:** SF Pro Display (iOS) / Roboto (Android), Bold
- **Body:** SF Pro Text (iOS) / Roboto (Android), Regular
- **H1:** 28px, Bold
- **H2:** 22px, Bold
- **H3:** 18px, Semibold
- **Body:** 16px, Regular
- **Caption:** 14px, Regular

### Spacing Scale
- xs: 4px
- sm: 8px
- md: 16px
- lg: 24px
- xl: 32px

### Component Specifications

**Alert/Incident Cards:**
- Background: White (light mode) / #1E293B (dark mode)
- Border radius: 12px
- Padding: Spacing.md
- No drop shadow (use subtle border instead)
- Press feedback: Scale to 0.98, spring animation

**Action Buttons:**
- Border radius: 24px (pill shape)
- Height: 48px
- Horizontal padding: Spacing.lg
- Icon + text layout
- Press feedback: Opacity 0.7, 100ms ease

**FAB:**
- Size: 56×56px
- Border radius: 28px (circular)
- Icon: Plus symbol
- Background: Primary color with gradient overlay
- Shadow as specified above

**Status Chips:**
- Border radius: 16px
- Padding: 4px 12px
- Font size: 12px, Semibold
- Color-coded by status

### Critical Assets
1. **User Avatars:** 4 preset professional avatars (business casual aesthetic, diverse, minimal illustration style)
2. **Severity Icons:** Custom icons for Critical (flame), High (exclamation triangle), Medium (alert circle), Low (info circle)
3. **Empty States:** Illustration for "No Alerts" and "No Incidents" screens (minimal, professional line art style)

### Accessibility
- Minimum touch target: 44×44px
- Color contrast ratio: 4.5:1 minimum for all text
- VoiceOver/TalkBack labels for all interactive elements
- Support dynamic type scaling
- Loading skeletons for async content