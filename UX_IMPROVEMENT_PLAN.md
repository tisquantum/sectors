# Sectors Game UX Improvement Plan

## Executive Summary
This document outlines a comprehensive plan to improve the user experience and flow of the Sectors game client. The improvements focus on clarity, guidance, information architecture, and reducing cognitive load for players.

---

## 1. Information Architecture & Navigation

### 1.1 Current Issues
- Phase information is small and easy to miss
- Multiple views (action, markets, operations, economy) but unclear when to use each
- Sidebar tabs can be hidden/collapsed
- Game state information is scattered across components
- No clear "what should I do now" guidance

### 1.2 Proposed Improvements

#### A. Enhanced Phase Indicator
- **Current**: Small phase name button in top bar
- **Proposed**: 
  - Large, prominent phase banner at top of screen
  - Color-coded by phase type (Stock = yellow, Operations = blue, etc.)
  - Shows current phase, next phase, and estimated time remaining
  - Click to expand full phase list with descriptions
  - Visual progress indicator showing position in turn/round

#### B. Contextual Navigation
- **Smart View Switching**: Automatically switch to relevant view based on phase
  - Stock phases → Markets view
  - Operations phases → Operations view
  - Consumption/Earnings → Operations view with correct tab
- **View Suggestions**: Show subtle hints like "Switch to Operations view to see factory construction"
- **Breadcrumb Navigation**: Show current location in game flow (Turn X → Round Y → Phase Z)

#### C. Unified Information Panel
- **Collapsible Dashboard**: Single panel showing:
  - Current player's cash, net worth, share holdings summary
  - Active orders count
  - Pending actions count
  - Timer status
- **Quick Stats**: Always-visible mini stats bar (cash, net worth, timer)
- **Expandable Details**: Click to see full breakdown

---

## 2. Order Placement & Stock Trading

### 2.1 Current Issues
- Drawer-based order input interrupts flow
- Multiple order types (market, limit, option, short) but unclear when to use each
- Order tracking scattered across components
- No clear feedback on order status
- 60% ownership limit validation happens late

### 2.2 Proposed Improvements

#### A. Inline Order Placement
- **Modal Instead of Drawer**: Full-screen modal for order placement
- **Quick Order Button**: One-click "Buy/Sell" buttons on company cards
- **Order Summary Sidebar**: Persistent sidebar showing:
  - All pending orders
  - Total cost/value
  - Ownership percentages after orders
  - Conflicts/warnings (buy & sell same company, 60% limit)
- **Order Preview**: Show impact before confirming (cash after, ownership %, etc.)

#### B. Order Type Guidance
- **Contextual Help**: Tooltips explaining each order type
- **Smart Defaults**: Pre-select appropriate order type based on context
- **Visual Indicators**: Icons/colors showing which order types are available
- **Order Type Comparison**: Side-by-side comparison modal

#### C. Enhanced Order Management
- **Order Queue Visualization**: 
  - List of all orders with status (pending, filled, cancelled)
  - Group by company
  - Filter by type (buy/sell, IPO/market)
- **Bulk Actions**: Cancel all orders, modify multiple orders
- **Order History**: Show recent orders with outcomes
- **Conflict Detection**: Real-time warnings for:
  - Buying and selling same company
  - Exceeding 60% ownership
  - Insufficient cash

---

## 3. Company Actions & Operations

### 3.1 Current Issues
- Company actions scattered across different views
- Action costs not always clear upfront
- No clear indication of which actions are available/affordable
- Factory construction, marketing, research in separate places

### 3.2 Proposed Improvements

#### A. Unified Company Action Center
- **Company Dashboard**: Single view per company showing:
  - All available actions with costs
  - Current resources (cash, workers, etc.)
  - Action history
  - Pending actions
- **Action Cards**: Visual cards for each action with:
  - Clear cost breakdown
  - Expected outcomes
  - Prerequisites
  - Availability status (enabled/disabled with reason)
- **Action Queue**: Show queued actions before resolution phase

#### B. Resource Management
- **Resource Tracker**: Always-visible resource indicators
  - Cash on hand
  - Available workers
  - Factory capacity
  - Research progress
- **Resource Warnings**: Alerts when resources are low
- **Resource Planning**: Show projected resource usage for queued actions

#### C. Operations Flow
- **Step-by-Step Guide**: Wizard-style flow for complex operations
  - Factory construction → Resource selection → Confirmation
  - Marketing campaign → Campaign type → Target → Confirmation
- **Batch Operations**: Select multiple actions and execute together
- **Action Templates**: Save common action combinations

---

## 4. Visual Feedback & Status

### 4.1 Current Issues
- Limited visual feedback on actions
- Phase transitions can be jarring
- No clear indication of what's happening during resolution phases
- Timer might not be prominent enough

### 4.2 Proposed Improvements

#### A. Action Feedback
- **Success Animations**: Celebrate successful orders/actions
- **Error Messages**: Clear, actionable error messages
- **Loading States**: Show progress during async operations
- **Confirmation Dialogs**: For critical actions (large orders, expensive actions)

#### B. Phase Transitions
- **Transition Animations**: Smooth transitions between phases
- **Phase Summary**: Show what happened in previous phase
- **What's Next**: Preview of upcoming phase with required actions
- **Auto-advance Notifications**: "Phase will advance in 10 seconds..."

#### C. Status Indicators
- **Player Status**: Visual indicators for:
  - Ready/Not Ready
  - Active/Inactive
  - Turn to act
- **Game Status**: 
  - Paused/Active
  - Waiting for players
  - Processing
- **Timer Prominence**: 
  - Larger, more visible timer
  - Color changes as time runs out
  - Audio/visual alerts for low time

---

## 5. Onboarding & Guidance

### 5.1 Current Issues
- No tutorial or onboarding
- Game rules not easily accessible
- Phase descriptions might be unclear
- No help system

### 5.2 Proposed Improvements

#### A. Interactive Tutorial
- **First-Time Player Flow**: Step-by-step tutorial
- **Contextual Tips**: Tooltips and hints for new players
- **Practice Mode**: Sandbox mode to learn mechanics
- **Tutorial Skip**: Option to skip for experienced players

#### B. Help System
- **Help Center**: Accessible help button with:
  - Phase explanations
  - Action guides
  - Rule clarifications
  - FAQ
- **Contextual Help**: Help button on each screen with relevant info
- **Video Tutorials**: Embedded video guides for complex mechanics

#### C. Game Rules Integration
- **Rules Panel**: Collapsible rules panel
- **Quick Reference**: Cheat sheet for common actions
- **Phase Rules**: Show rules specific to current phase

---

## 6. Performance & Technical UX

### 6.1 Current Issues
- Excessive console logging suggests performance concerns
- Multiple refetches might cause lag
- No loading states for some operations
- Potential infinite loop risks in GameContext

### 6.2 Proposed Improvements

#### A. Performance Optimization
- **Reduce Refetches**: Implement better caching strategies
- **Optimistic Updates**: Update UI immediately, sync with server
- **Debouncing**: Better debouncing for rapid actions
- **Lazy Loading**: Load components only when needed

#### B. Loading States
- **Skeleton Screens**: Show skeleton while loading
- **Progress Indicators**: For long-running operations
- **Error Boundaries**: Graceful error handling
- **Retry Mechanisms**: Auto-retry failed operations

#### C. Real-time Updates
- **WebSocket Optimization**: Reduce unnecessary updates
- **Selective Updates**: Only update changed components
- **Batch Updates**: Group multiple updates together

---

## 7. Mobile & Responsive Design

### 7.1 Current Issues
- Complex layouts might not work well on mobile
- Drawer/modal interactions might be awkward
- Information density might be too high for small screens

### 7.2 Proposed Improvements

#### A. Mobile-First Components
- **Bottom Sheet**: Replace drawer with bottom sheet on mobile
- **Swipe Gestures**: Swipe to navigate between views
- **Touch Targets**: Larger buttons for mobile
- **Simplified Views**: Condensed versions for mobile

#### B. Responsive Layout
- **Adaptive Grid**: Adjust columns based on screen size
- **Collapsible Panels**: Auto-collapse on small screens
- **Priority Content**: Show most important info first on mobile

---

## 8. Accessibility

### 8.1 Proposed Improvements
- **Keyboard Navigation**: Full keyboard support
- **Screen Reader Support**: Proper ARIA labels
- **Color Contrast**: Ensure WCAG compliance
- **Focus Indicators**: Clear focus states
- **Reduced Motion**: Respect prefers-reduced-motion

---

## 9. Social & Multiplayer Features

### 9.1 Current Issues
- Chat might be hidden in sidebar
- No clear indication of other players' actions
- Limited social interaction

### 9.2 Proposed Improvements

#### A. Enhanced Social Features
- **Activity Feed**: Show recent player actions
- **Player Highlights**: Highlight active players
- **Chat Prominence**: Make chat more accessible
- **Emoji Reactions**: Quick reactions to game events

#### B. Spectator Mode
- **Observer View**: For non-playing observers
- **Replay System**: Review past turns/phases
- **Analytics Dashboard**: Game statistics and trends

---

## 10. Implementation Priority

### Phase 1: Critical UX Improvements (Weeks 1-2)
1. Enhanced phase indicator
2. Inline order placement improvements
3. Order conflict detection
4. Better loading states
5. Performance optimization

### Phase 2: Major Features (Weeks 3-4)
1. Unified company action center
2. Order management sidebar
3. Contextual navigation
4. Enhanced visual feedback
5. Help system

### Phase 3: Polish & Enhancement (Weeks 5-6)
1. Interactive tutorial
2. Mobile optimizations
3. Social features
4. Accessibility improvements
5. Advanced features (replay, analytics)

---

## 11. Success Metrics

### User Experience Metrics
- **Time to First Action**: How quickly can a new player perform their first action?
- **Error Rate**: How often do players make mistakes?
- **Task Completion**: Can players complete common tasks without help?
- **User Satisfaction**: Survey scores for ease of use

### Technical Metrics
- **Page Load Time**: Target < 2 seconds
- **Time to Interactive**: Target < 3 seconds
- **Error Rate**: < 1% of actions
- **Uptime**: > 99.9%

### Engagement Metrics
- **Session Length**: Average time per session
- **Return Rate**: Players returning to games
- **Feature Usage**: Which features are used most?

---

## 12. Design Principles

1. **Clarity First**: Information should be clear and unambiguous
2. **Progressive Disclosure**: Show details when needed, hide when not
3. **Consistent Patterns**: Use same patterns throughout the app
4. **Feedback Always**: Every action should have clear feedback
5. **Error Prevention**: Prevent errors before they happen
6. **Accessibility**: Usable by everyone
7. **Performance**: Fast and responsive
8. **Delight**: Small moments of joy in interactions

---

## 13. Next Steps

1. **Review & Prioritize**: Review this plan with stakeholders
2. **Design Mockups**: Create detailed mockups for Phase 1 items
3. **User Testing**: Test current UX to identify pain points
4. **Prototype**: Build prototypes for key improvements
5. **Iterate**: Implement, test, and iterate

---

## Appendix: Quick Wins

These are small improvements that can be implemented quickly:

1. **Larger Timer**: Make timer more prominent
2. **Clearer Phase Name**: Larger, bolder phase indicator
3. **Order Count Badge**: Show number of pending orders
4. **Quick Cash Display**: Always show player's cash
5. **Better Error Messages**: More descriptive error text
6. **Loading Spinners**: Add spinners to all async operations
7. **Success Toasts**: Celebrate successful actions
8. **Keyboard Shortcuts**: Add common keyboard shortcuts
9. **Tooltips**: Add helpful tooltips throughout
10. **Color Coding**: Use consistent color scheme for phases/actions

