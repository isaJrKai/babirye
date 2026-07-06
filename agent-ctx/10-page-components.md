# Task: BABIRYE v10.0.0 UI Page Components

## Summary
Created all 7 page components for the BABIRYE v10.0.0 project under `/home/z/my-project/src/pages/`. All files are `'use client'` components using the `useApi` hook from `@/hooks/use-api`, shadcn/ui components, framer-motion animations, and recharts for data visualization.

## Files Created

### 1. `forensic-page.tsx` (~220 lines)
- Fetches from `/api/tools?type=forensic`
- 12 forensic tool cards in responsive grid
- Category badges, status indicators (dormant/active/error), colored left border
- Category filter pills (android, ios, computer, network, memory, advanced)
- Search bar, Activate/Deactivate toggle buttons
- Loading skeletons, error states with retry

### 2. `offensive-page.tsx` (~250 lines)
- Fetches from `/api/tools?type=offensive`
- 10 category tabs with tool count badges
- Risk level color system (low=green, medium=yellow, high=orange, critical=red)
- Risk level filter, search functionality
- Container image display, status badges

### 3. `defensive-page.tsx` (~270 lines)
- Fetches from `/api/tools?type=defensive`
- 7 collapsible category sections with active/dormant counts
- Stats bar (total/active/dormant)
- Category-specific icons and colors
- Global search + category filter

### 4. `micro-defensive-page.tsx` (~300 lines)
- Fetches from `/api/tools?type=micro_defensive`
- Compact table view with Checkbox bulk selection
- 8 category tabs within the table
- PieChart (recharts) for category distribution
- Bulk Activate/Deactivate operations

### 5. `sensors-page.tsx` (~310 lines)
- Fetches from `/api/sensors`
- 4 summary stat cards (Total, Online, Offline, Anomalies)
- Type filter tabs (Radar, Sonar, LiDAR, Acoustic, EW)
- Sensor cards with animated status dots, sensitivity bar, latest reading
- Add Sensor dialog with full form
- Click-to-open detail panel with mini LineChart reading history

### 6. `vip-page.tsx` (~360 lines)
- Fetches from 5 VIP endpoints (profiles, drones, vehicles, wearables, incidents)
- VIP profile cards with threat level + protection level
- SOS alert banner with animated pulse
- Drones tab: table with battery Progress, GPS, camera/thermal toggles
- Vehicles tab: table with fuel Progress, GPS, speed, heading
- Wearables tab: cards with heart rate, temperature, SOS border
- Incidents tab: table with severity badges, resolved status
- Add VIP dialog

### 7. `potentials-page.tsx` (~400 lines)
- Fetches from `/api/potentials` and `/api/potentials?view=categories`
- BarChart (recharts) for category distribution
- Category pills, difficulty filter, impact filter, search
- Expandable cards with full description, requirements, scenario count
- Tag badges with truncation
- Explore mode with debounced search and relevance scores
- Scrollable grid with max-height

## Tech Stack Used
- shadcn/ui: Card, Badge, Table, Button, Dialog, Select, Input, Progress, Skeleton, ScrollArea, Tabs, Separator, Tooltip, Switch, Checkbox, Alert, Label, Textarea, Slider, Collapsible
- framer-motion: AnimatePresence, motion (layout animations, enter/exit)
- recharts: PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, ResponsiveContainer
- lucide-react: 30+ icons
- All components: `'use client'`, TypeScript strict, responsive design