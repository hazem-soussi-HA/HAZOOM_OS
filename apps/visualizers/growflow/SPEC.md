# Daily Habit & Gratitude Tracker - Specification

## Project Overview
- **Name**: GrowFlow - Daily Habit & Gratitude Tracker
- **Type**: Single-page web application
- **Purpose**: Help users build positive habits and practice daily gratitude
- **Target Users**: Anyone wanting to improve their daily routines and mindset

## UI/UX Specification

### Layout Structure
- Header with app name and motivational quote
- Two main sections: Habits & Gratitude
- Footer with encouragement

### Visual Design

#### Color Palette
- Background: `#0f0f0f` (deep black)
- Card Background: `#1a1a1a` (dark gray)
- Primary Accent: `#00d9a5` (mint green - growth/positivity)
- Secondary: `#ff6b6b` (coral - forgratitude)
- Text Primary: `#ffffff`
- Text Secondary: `#888888`
- Success: `#00d9a5`
- Border: `#2a2a2a`

#### Typography
- Font Family: "Outfit" (Google Fonts) - modern, clean
- Headings: 700 weight
- Body: 400 weight
- Quote: italic

#### Visual Effects
- Subtle glow on primary accent elements
- Smooth transitions (0.3s ease)
- Check animation on habit completion
- Confetti burst on daily completion

### Components

1. **Header**
   - App logo/name "GrowFlow"
   - Daily motivational quote (rotates)

2. **Habit Section**
   - Title: "Today's Habits"
   - List of preset positive habits with checkboxes
   - Custom habit input field
   - Progress indicator (X/Y completed)
   - Streak counter

3. **Gratitude Section**
   - Title: "Today's Gratitude"
   - 3 gratitude input fields
   - Save button
   - Past gratitudes list (last 7 days)

4. **Footer**
   - Encouraging message
   - Current streak display

## Functionality Specification

### Core Features
1. **Habit Tracking**
   - 5 preset positive habits:
     - Drink 8 glasses of water
     - Exercise for 20 minutes
     - Read for 15 minutes
     - Practice gratitude
     - Sleep by 11 PM
   - Toggle completion with animation
   - Add custom habits
   - Daily reset at midnight

2. **Gratitude Journal**
   - 3 inputs for daily gratitudes
   - Auto-save to localStorage
   - Display last 7 days of gratitudes

3. **Streak System**
   - Track consecutive days with all habits done
   - Display current streak prominently

4. **Motivational Quotes**
   - Array of 10+ positive quotes
   - Random quote on page load

### Data Storage
- Use localStorage for persistence
- Store: habits, gratitudes, streak data, last visit date

### Edge Cases
- First visit: initialize with defaults
- New day: reset habits, preserve gratitudes
- Invalid input: show friendly message

## Acceptance Criteria
- [ ] Page loads without errors
- [ ] All 5 preset habits displayed with checkboxes
- [ ] Clicking checkbox shows completion animation
- [ ] Custom habit can be added
- [ ] Gratitude inputs save correctly
- [ ] Streak calculates correctly
- [ ] Data persists after page refresh
- [ ] Responsive on mobile devices
- [ ] All animations smooth