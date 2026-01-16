# BeMe 1.0 - Personal Life Management Application

**Version 1.0.0**

A comprehensive, all-in-one personal life management application built with modern web technologies. BeMe helps you track your finances, monitor your fitness, manage your wellness, set and achieve goals, and organize your life - all in one beautiful, intuitive interface.

## Table of Contents

- [About BeMe](#about-beme)
- [Key Features](#key-features)
- [Detailed Feature Documentation](#detailed-feature-documentation)
- [Technical Architecture](#technical-architecture)
- [Getting Started](#getting-started)
- [User Guide](#user-guide)
- [Development Information](#development-information)
- [Browser Support and Compatibility](#browser-support-and-compatibility)
- [Limitations and Known Issues](#limitations-and-known-issues)
- [Future Enhancements](#future-enhancements)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgments](#acknowledgments)

## About BeMe

BeMe is a personal life management application designed to help you take control of your life by centralizing all your important data and activities. Whether you want to track your spending, log your workouts, monitor your nutrition, manage your schedule, or achieve your goals, BeMe provides a unified platform for everything.

### Core Philosophy

BeMe is built on the principle that effective life management comes from having clear visibility into all aspects of your life. By bringing together financial tracking, fitness monitoring, wellness management, goal setting, and scheduling in one place, BeMe enables you to make informed decisions and maintain a holistic view of your personal progress.

### Target Audience

BeMe is designed for individuals who:
- Want to take control of their personal finances
- Are committed to tracking their fitness and health
- Value data-driven insights into their lifestyle patterns
- Prefer a self-hosted, privacy-focused solution
- Need a comprehensive yet simple tool for life management

### What Makes BeMe Unique

- **All-in-One Solution**: Unlike apps that focus on a single aspect of life management, BeMe integrates finances, fitness, wellness, goals, and scheduling into one cohesive platform
- **Privacy-First**: All data is stored locally in your browser - your information never leaves your device
- **Zero Configuration**: Start using BeMe immediately with sample data or begin from scratch - no complex setup required
- **Beautiful, Intuitive Interface**: Modern, responsive design that works seamlessly on desktop and mobile devices
- **Extensive Customization**: Tailor the app to your preferences with currency, date format, units, and theme settings
- **Comprehensive Analytics**: Deep insights into your spending patterns, workout frequency, nutrition habits, and progress toward goals

## Key Features

BeMe 1.0 includes the following major feature areas:

- 🏠 **Dashboard**: Centralized view of your financial summary, daily schedule, quick stats, and active goals
- 💰 **Money Management**: Complete financial tracking with multiple period views, advanced filtering, and interactive charts
- 💪 **Body & Fitness**: Detailed workout logging, exercise tracking, workout templates, and streak monitoring
- ⚡ **Energy & Wellness**: Food tracking with macro nutrients, sleep monitoring, calorie balance, and daily check-ins
- 📊 **Insights & Analytics**: Comprehensive analytics for finances, fitness, and health with trend analysis and visualizations
- 🎯 **Goals & Progress**: Set and track goals for calories, workouts, and savings with automatic progress calculation
- 👥 **Groups**: Create and manage collaborative groups with custom types and member management
- ⚙️ **Settings**: Extensive customization options including currency, date format, units, theme, and notifications
- 📦 **Data Export**: Export all your data as JSON for backup and portability

## Detailed Feature Documentation

### Dashboard (Home Page)

The Dashboard is your command center, providing a comprehensive overview of all aspects of your life at a glance.

#### Financial Summary

The financial summary card displays your current financial status:
- **Current Balance**: Net balance (income minus expenses) for the current month
- **Monthly Income**: Total income for the current month
- **Monthly Expenses**: Total expenses for the current month
- **Visual Indicators**: Color-coded displays (green for positive balance, red for negative)

All calculations are done in real-time from your transaction data, giving you immediate insight into your financial health.

#### Daily Schedule Management

Manage your daily routine with the schedule management system:
- **Schedule Items**: Create items with title, time range (start and end times), category, and emoji
- **Time-Based Organization**: Schedule items are automatically sorted by time order
- **Active/Inactive Toggle**: Enable or disable schedule items without deleting them
- **Quick Access**: Prominent add button with consistent UI matching the rest of the app
- **Edit and Delete**: Click any schedule item to edit, or use the delete button to remove it

Schedule items support custom categories and can be organized in a specific order for your daily routine.

#### Quick Stats Display

The dashboard shows three key metrics:
- **Workouts This Week**: Count of workouts logged in the past 7 days
- **Average Sleep**: Average hours of sleep from recent wellness check-ins
- **Savings Rate**: Percentage of income saved (calculated as (income - expenses) / income × 100)

These stats update automatically as you add new data, providing immediate feedback on your lifestyle patterns.

#### Goals Section

View and manage all your active goals:
- **Goal Cards**: Each goal displays with its type icon, target, current progress, and percentage complete
- **Progress Bars**: Visual progress indicators with color coding (green for on track, yellow for moderate progress, red for behind)
- **Achievement Indicators**: Special visual treatment when goals are 100% complete
- **Quick Actions**: Add new goals or edit existing ones directly from the dashboard

Goals automatically calculate progress based on related data (transactions for savings goals, workouts for fitness goals, food entries for calorie goals).

#### Onboarding Tour

New users are guided through the application with an interactive onboarding tour that highlights:
- Key features and sections
- How to add your first data entries
- Navigation and interface elements

The tour can be dismissed and is only shown once per user session.

### Money Management

BeMe's money management module provides comprehensive financial tracking with powerful filtering and visualization capabilities.

#### Transaction Management

**Adding Transactions**:
- Click the prominent "+" button or "Add Transaction" card to open the transaction modal
- Select transaction type (Income or Expense)
- Enter amount, category, date, and optional description
- Mark as recurring for transactions that repeat regularly
- All fields are validated with inline error messages

**Editing Transactions**:
- Click any transaction card to edit
- Modify any field including type, amount, category, date, or description
- Changes are saved automatically

**Deleting Transactions**:
- Use the delete button on any transaction card
- Confirmation dialog prevents accidental deletions

#### Multiple Period Views

View your financial data across different time periods:
- **Daily View**: Transactions and balance for today
- **Weekly View**: Transactions and balance for the current week
- **Monthly View**: Transactions and balance for the current month (default)
- **Yearly View**: All transactions and balance for the current year

Switch between periods by clicking the balance cards at the top of the page. Each view recalculates income, expenses, and balance for the selected period.

#### Transaction Filtering

Advanced filtering capabilities help you find exactly what you're looking for:

**Type Filter**:
- **All**: Show both income and expenses
- **Income**: Show only income transactions
- **Expense**: Show only expense transactions

**Search Filter**:
- Search by transaction category or description
- Real-time search with debouncing for performance
- Case-insensitive matching

**Date Range Filter**:
- Filter transactions by start and end dates
- Supports any date range you specify
- Works in combination with period views

**Amount Range Filter**:
- Filter by minimum and/or maximum amount
- Useful for finding large transactions or small expenses
- Can be combined with other filters

**Category Filter**:
- Filter by one or more transaction categories
- Multi-select category filtering
- Category list updates based on transaction type

#### Transaction Categories

Pre-defined categories for different transaction types:

**Income Categories**:
- Salary, Freelance, Investment, Gift, Other

**Expense Categories**:
- Food, Transportation, Housing, Entertainment, Shopping, Healthcare, Education, Utilities, Other

Categories help organize your financial data and enable better insights through categorization analysis.

#### Recurring Transactions

Mark any transaction as recurring to identify regular income or expenses. This feature helps you:
- Identify regular cash flow patterns
- Plan for recurring expenses
- Track subscription services and regular income

#### Financial Charts

Interactive data visualizations provide insights into your financial patterns:

**Chart Types**:
- **Bar Chart**: Compare income vs expenses across time periods
- **Line Chart**: View trends over time with smooth lines
- **Pie Chart**: See proportional breakdown of income and expenses

**Chart Features**:
- Switch between chart types using tabs
- Period selection (daily, weekly, monthly, yearly)
- Hover tooltips showing exact values
- Responsive design that adapts to screen size
- Color-coded data (green for income, red for expenses)

Charts automatically update when you switch periods or add new transactions.

#### European Date Format

All dates throughout the money section (and the entire app) use the DD/MM/YY format by default, though this can be customized in Settings.

#### Balance Cards

Visual cards at the top of the money page show:
- **Daily Balance**: Today's income, expenses, and net balance
- **Weekly Balance**: Current week's financial summary
- **Monthly Balance**: Current month's financial summary (highlighted as active)
- **Yearly Balance**: Current year's financial summary

Cards are clickable and switch the period view when selected, providing quick navigation between different time horizons.

### Body & Fitness

The Body & Fitness module helps you track your workouts, monitor your exercise progress, and maintain consistent fitness routines.

#### Workout Logging

Log comprehensive workout information:

**Workout Details**:
- **Title**: Name your workout (e.g., "Morning Run", "Upper Body Strength")
- **Type**: Select from Strength, Cardio, Flexibility, or Sports
- **Date**: When the workout occurred
- **Duration**: Total workout time in minutes
- **Notes**: Optional notes about how you felt, conditions, or other observations

**Exercise Tracking**:
Each workout can include multiple exercises with detailed tracking:
- **Exercise Name**: Name of the exercise (e.g., "Bench Press", "Running")
- **Sets**: Number of sets completed
- **Reps**: Number of repetitions per set
- **Weight**: Weight used (optional, useful for strength training)
- **Notes**: Exercise-specific notes

This detailed tracking enables you to:
- Monitor strength progression over time
- Track volume and intensity
- Identify patterns in your training
- Maintain workout variety

#### Workout Templates

Save frequently performed workouts as templates:
- Create a template from any workout
- Reuse templates to quickly log repeated routines
- Edit templates to update exercises, sets, or reps
- Templates appear in a dedicated section in the workout modal

This feature is perfect for:
- Strength training programs
- Cardio routines
- Stretching or yoga sequences
- Sport-specific training sessions

#### Workout Streak Tracking

Monitor your consistency with visual streak tracking:

**Period Views**:
- **Weekly Streak**: See which days of the week you worked out
- **Monthly Streak**: View workout frequency across the month
- **Yearly Streak**: Long-term consistency tracking

**Visual Grid**:
- Grid displays days/weeks/months with workout indicators
- Color-coded cells show workout frequency
- Easy to spot patterns and identify gaps in training
- Motivates consistency through visual feedback

The streak display helps you maintain accountability and see your progress at a glance.

#### Workout Filtering

Find specific workouts quickly with advanced filtering:

**Search Filter**:
- Search by workout title or notes
- Real-time search as you type
- Searches across all workout fields

**Type Filter**:
- Filter by workout type (Strength, Cardio, Flexibility, Sports)
- Quick toggle to see only specific workout types

**Date Range Filter**:
- Filter workouts by start and end dates
- Useful for analyzing specific time periods
- Works with all period views

**Duration Range Filter**:
- Filter by minimum and/or maximum duration
- Find short or long workouts
- Useful for analyzing training volume

#### Exercise Management

Detailed exercise tracking within workouts:
- **Multiple Exercises**: Add as many exercises as needed to a workout
- **Set/Rep Tracking**: Track sets and reps for each exercise
- **Weight Tracking**: Optional weight tracking for strength exercises
- **Exercise Notes**: Add specific notes for each exercise
- **Validation**: All exercise fields are validated to ensure data quality

This granular tracking enables:
- Progressive overload monitoring
- Exercise-specific progress tracking
- Detailed workout history
- Performance analysis

### Energy & Wellness

The Energy & Wellness module helps you monitor your nutrition, track your sleep, and maintain awareness of your overall wellness.

#### Food Tracking

Comprehensive food logging with macro nutrient tracking:

**Food Entry Details**:
- **Food Name**: Name of the food item (e.g., "Chicken Breast", "Oatmeal")
- **Date**: When the food was consumed
- **Calories**: Total calories for the serving
- **Macro Nutrients**:
  - **Protein**: Grams of protein
  - **Carbs**: Grams of carbohydrates
  - **Fats**: Grams of fats

**Period Views**:
Track food intake across different time periods:
- **Daily**: Today's food entries and calorie balance
- **Weekly**: Current week's nutrition summary
- **Monthly**: Current month's totals and averages
- **Yearly**: Year-long nutrition overview

Switch between periods using the period selector cards to see different time horizons.

#### Calorie Balance

The calorie balance feature shows:
- **Total Calories Consumed**: Sum of all food entries for the selected period
- **Daily Average**: Average calories per day when viewing weekly/monthly/yearly periods
- **Macro Breakdown**: Percentage distribution of protein, carbs, and fats
- **Visual Indicators**: Color-coded displays showing if you're meeting your goals

The macro breakdown shows:
- **Protein Percentage**: Percentage of calories from protein
- **Carb Percentage**: Percentage of calories from carbohydrates
- **Fat Percentage**: Percentage of calories from fats

This helps you maintain balanced nutrition and meet specific dietary goals.

#### Search and Filter Food Entries

Powerful filtering helps you analyze your nutrition:

**Search Filter**:
- Search food entries by name
- Real-time search functionality
- Case-insensitive matching

**Date Range Filter**:
- Filter food entries by date range
- Useful for analyzing specific periods
- Works with period views

**Calorie Range Filter**:
- Filter by minimum and/or maximum calories
- Find high or low-calorie foods
- Analyze calorie distribution

**Food Entry Management**:
- Click any food entry to edit
- Delete entries with confirmation
- Add new entries with the prominent "+" button

#### Sleep Tracking

Monitor your sleep patterns with simple, effective tracking:

**Sleep Logging**:
- **Hours Slept**: Log the number of hours you slept
- **Date**: When you slept
- **Daily Check-ins**: Simplified check-in focused on sleep

**Period Views**:
- **Daily**: Today's sleep hours
- **Weekly**: Current week's sleep summary and average
- **Monthly**: Current month's sleep average
- **Yearly**: Year-long sleep overview

**Sleep Insights**:
- Average sleep hours per period
- Sleep consistency tracking
- Visual displays showing sleep patterns

#### Daily Check-ins

Simplified wellness check-ins focused on sleep:
- Quick daily check-in process
- Focus on essential data (sleep hours)
- Minimal friction to encourage consistency
- Historical tracking of sleep patterns

The simplified approach makes it easy to maintain daily wellness tracking without overwhelming you with too many data points.

### Insights & Analytics

The Insights page provides comprehensive analytics and visualizations across all your life management data, helping you understand patterns and trends.

#### Financial Insights

**Spending & Income Trends**:
- Line chart showing income and expense trends over the last 12 months
- Visual comparison of income vs expenses
- Identify months with budget issues or surpluses
- Trend lines help predict future patterns

**Category Breakdown**:
- Pie chart showing distribution of expenses by category
- See which categories consume most of your budget
- Identify areas for potential savings
- Color-coded categories for easy identification

**Monthly Expense Summaries**:
- Total expenses for the current month
- Average expense amount
- Most common expense category
- Top spending categories ranked

**Financial Analytics Features**:
- Automatic calculation of savings rate
- Spending pattern identification
- Category-based analysis
- Period-over-period comparisons

#### Fitness Insights

**Workout Frequency Trends**:
- Bar chart showing workout frequency over the last 12 weeks
- See your consistency patterns
- Identify weeks with low activity
- Track progress toward fitness goals

**Workout Type Distribution**:
- Pie chart showing breakdown by workout type
- See balance between strength, cardio, flexibility, and sports
- Identify if you need more variety
- Track specialization or diversification

**Fitness Statistics**:
- Total workouts for the current month
- Average workout duration
- Most common workout type
- Workout frequency per week

**Progression Tracking**:
- Track workout volume over time
- See improvements in consistency
- Identify patterns in training frequency

#### Health Insights

**Calorie Intake Trends**:
- Line chart showing calorie consumption over the last 30 days
- Identify patterns in eating habits
- See correlation with fitness activities
- Track progress toward calorie goals

**Sleep Hours Trends**:
- Line chart showing sleep patterns over time
- Identify sleep consistency
- See average sleep hours
- Track improvements in sleep quality

**Macro Nutrient Distribution**:
- Pie chart showing percentage breakdown of protein, carbs, and fats
- See if you're meeting macro targets
- Identify imbalances in nutrition
- Track changes in eating patterns over time

**Health Statistics**:
- Average daily calories for the current month
- Average sleep hours for the current month
- Macro nutrient averages
- Consistency metrics

#### Interactive Charts

All charts in the Insights page are fully interactive:
- **Hover Tooltips**: See exact values by hovering over data points
- **Responsive Design**: Charts adapt to different screen sizes
- **Color Coding**: Consistent color scheme across all visualizations
- **Period Selection**: Charts update based on available data
- **Multiple Chart Types**: Choose the visualization that best represents your data

#### Trend Analysis

The Insights page calculates:
- **Current vs Previous**: Compare current period to previous period
- **Percentage Changes**: See growth or decline percentages
- **Trend Direction**: Identify upward, downward, or stable trends
- **Pattern Recognition**: Spot recurring patterns in your data

These insights help you make informed decisions about your lifestyle and identify areas for improvement.

### Goals & Progress

The Goals system helps you set targets and track your progress toward important life objectives.

#### Goal Types

BeMe supports three types of goals:

**Calorie Goals**:
- Set target calories for a specific period (weekly, monthly, or yearly)
- Track total calories consumed from food entries
- Automatic calculation of current progress
- Perfect for maintaining, losing, or gaining weight

**Workout Goals**:
- Set target number of workouts for a period
- Track workout frequency automatically
- Monitor consistency in fitness routine
- Motivates regular exercise habits

**Savings Goals**:
- Set target savings rate as a percentage
- Calculated from income and expenses
- Track financial discipline
- Helps achieve financial objectives

#### Goal Periods

Goals can be set for different time periods:
- **Weekly**: Short-term goals for the current week
- **Monthly**: Medium-term goals for the current month
- **Yearly**: Long-term goals for the current year

This flexibility allows you to set both short-term milestones and long-term objectives.

#### Progress Tracking

Each goal displays comprehensive progress information:

**Visual Progress Bars**:
- Color-coded progress bars (green for on track, yellow for moderate, red for behind)
- Visual representation of percentage complete
- Easy to see progress at a glance

**Progress Metrics**:
- **Current Value**: Actual progress made (automatically calculated)
- **Target Value**: Goal you're working toward
- **Percentage Complete**: How much of the goal you've achieved
- **Remaining**: How much more you need to reach the goal

**Achievement Indicators**:
- Special visual treatment when goals reach 100%
- Checkmark icon for completed goals
- Celebration of achievement to maintain motivation

#### Goal Management

**Creating Goals**:
- Click "New Goal" button from the dashboard
- Select goal type (calories, workouts, or savings)
- Enter target value
- Choose period (weekly, monthly, or yearly)
- Goal is immediately active and tracking

**Editing Goals**:
- Click "Edit" on any goal card
- Modify target value or period
- Progress recalculates automatically
- Changes are saved immediately

**Deleting Goals**:
- Delete goals you no longer need
- Confirmation dialog prevents accidents
- Completed goals can be archived or removed

#### Automatic Calculation

All goal progress is calculated automatically:
- **Calorie Goals**: Sum calories from food entries in the goal period
- **Workout Goals**: Count workouts in the goal period
- **Savings Goals**: Calculate savings rate from transactions in the goal period

No manual tracking required - BeMe does the work for you, ensuring accurate progress monitoring.

### Groups

The Groups feature enables you to create and manage collaborative groups for shared activities and organization.

#### Group Management

**Creating Groups**:
- Click "New Group" to create a group
- Enter group name and description
- Select group type (Household, Event, Project, or Other)
- Add custom group type if needed
- Group is immediately available for use

**Group Types**:
- **Household**: For family or roommate management
- **Event**: For planning and organizing events
- **Project**: For collaborative projects
- **Other**: Custom types you define

**Custom Group Types**:
- Create custom group types beyond the defaults
- Custom types are saved and available for future groups
- Flexible categorization for your specific needs

#### Member Management

Add and manage group members:
- Add members to groups
- View member list for each group
- Manage member roles and permissions (foundation for future features)
- Member management interface prepares for collaboration features

#### Group Settings

Configure group preferences:
- Update group name and description
- Change group type
- Modify group settings
- Group settings modal provides comprehensive configuration

#### Future Collaboration Features

The Groups module provides the foundation for future collaborative features:
- Shared expense tracking (planned)
- Group task management (planned)
- Group calendars (planned)
- Shared goals (planned)

Current implementation focuses on group organization and member management, with collaboration features planned for future releases.

### Settings

BeMe provides extensive customization options to tailor the application to your preferences.

#### Currency Settings

Choose your preferred currency:
- **Supported Currencies**: USD, EUR, GBP, JPY, CAD, AUD
- **Currency Selection**: Dropdown selector in Settings
- **Preview**: See how currency formatting looks before saving
- **Application-Wide**: Currency preference applies to all financial displays

Currency formatting updates throughout the app, ensuring consistency in financial displays.

#### Date Format

Select your preferred date format:
- **MM/DD/YY**: Month/Day/Year format (e.g., 01/23/24)
- **DD/MM/YY**: Day/Month/Year format (e.g., 23/01/24) - Default
- **YYYY-MM-DD**: ISO format (e.g., 2024-01-23)

**Preview**: See a preview of the selected format before saving
**Application-Wide**: Date format applies to all date displays throughout the app

The European format (DD/MM/YY) is the default, but you can change it to match your regional preferences.

#### Units

Choose between metric and imperial units:
- **Metric**: Kilograms (kg) and centimeters (cm)
- **Imperial**: Pounds (lbs) and inches (in)

Units preference affects:
- Weight measurements in workouts
- Height and measurement displays
- Any future body metric tracking

#### Theme

Customize the application appearance:
- **Light Theme**: Bright, light color scheme
- **Dark Theme**: Dark color scheme for low-light environments
- **System Theme**: Automatically matches your operating system preference

**Theme Features**:
- Instant theme switching
- Preference is saved and persists across sessions
- System theme automatically updates when OS preference changes
- Smooth transitions between themes

#### Notifications

Manage browser notifications:
- **Enable/Disable**: Toggle notifications on or off
- **Permission Management**: Request browser notification permission
- **Test Notifications**: Test notification functionality
- **Notification Preferences**: Configure notification settings

**Notification Features**:
- Browser Notification API integration
- Permission request with user-friendly interface
- Toast notifications for in-app feedback (always available)
- Foundation for scheduled reminders (future feature)

#### Data Export

Export all your data for backup:
- **Complete Export**: All transactions, workouts, food entries, check-ins, schedule items, groups, goals, and settings
- **JSON Format**: Human-readable JSON format
- **Automatic Filename**: Exports include date in filename
- **One-Click Download**: Simple export process

**Export Contents**:
- All financial transactions
- All workouts and templates
- All food entries
- All wellness check-ins
- All schedule items
- All groups and members
- All goals
- All settings preferences
- Export timestamp

#### Data Management

**Clear All Data**:
- Remove all data from the application
- Confirmation dialog prevents accidental deletion
- Useful for starting fresh or testing
- Cannot be undone - use export first for backup

**Reset Settings**:
- Restore all settings to default values
- Does not affect your data (transactions, workouts, etc.)
- Only resets preferences and configuration
- Confirmation dialog for safety

**Data Import** (Future):
- Import previously exported data
- Restore from backup
- Merge data from multiple exports
- Planned for future releases

## Technical Architecture

### Technology Stack

BeMe 1.0 is built with modern web technologies:

**Frontend Framework**:
- **React 18**: Latest version of React for building user interfaces
- **TypeScript 5.3.3**: Type-safe JavaScript for improved code quality and developer experience

**Build Tool**:
- **Vite 4.5.3**: Fast, modern build tool with instant server start and optimized production builds

**Styling**:
- **Tailwind CSS 3.4.1**: Utility-first CSS framework for rapid UI development
- **Dark Mode Support**: Built-in dark mode with system preference detection

**Routing**:
- **React Router v6**: Declarative routing with lazy loading for optimal performance

**UI Components**:
- **Shadcn UI**: High-quality, accessible UI components built on Radix UI primitives
- **Radix UI**: Unstyled, accessible component primitives for building design systems
- Components include: Dialog, Select, Tabs, Progress, RadioGroup, Label, and more

**Icons**:
- **Lucide React 0.344.0**: Beautiful, consistent icon library with tree-shaking support

**Charts & Visualization**:
- **Recharts 2.12.0**: Composable charting library built on React and D3
- Supports Line, Bar, Pie, and other chart types

**Date Handling**:
- **date-fns 3.3.0**: Modern JavaScript date utility library
- Functions for formatting, parsing, and manipulating dates

**State Management**:
- **React Context API**: Built-in React state management
- Multiple context providers for different data domains
- Separation of concerns with dedicated contexts

**Data Persistence**:
- **Browser LocalStorage**: Client-side storage for data persistence
- Custom storage utility with date revival
- Error handling and quota management

**Notifications**:
- **Browser Notification API**: Native browser notifications
- **Sonner 2.0.7**: Elegant toast notifications for user feedback

**Testing**:
- **Vitest 1.0.4**: Fast unit test framework
- **React Testing Library 14.1.2**: Testing utilities for React components
- **@testing-library/jest-dom 6.1.5**: Custom matchers for DOM testing

### Project Structure

```
BMe/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── layout/         # Layout components (TopBar, BottomNav, Layout)
│   │   ├── shared/         # Shared components (PageHeader, EmptyState, SearchBar, etc.)
│   │   ├── ui/             # Shadcn UI base components (Button, Card, Dialog, etc.)
│   │   ├── money/          # Money feature components
│   │   ├── body/           # Body/fitness feature components
│   │   ├── energy/         # Energy/wellness feature components
│   │   ├── home/           # Home dashboard components
│   │   ├── goals/          # Goals feature components
│   │   ├── groups/         # Groups feature components
│   │   └── onboarding/     # Onboarding tour component
│   ├── context/            # React Context providers
│   │   ├── AppContext.tsx        # App-wide settings and user
│   │   ├── TransactionContext.tsx   # Financial transactions
│   │   ├── WorkoutContext.tsx       # Workouts and templates
│   │   ├── EnergyContext.tsx        # Food entries and check-ins
│   │   ├── ScheduleContext.tsx      # Daily schedule items
│   │   ├── GroupContext.tsx         # Groups and members
│   │   ├── GoalsContext.tsx         # Goals and progress
│   │   └── NotificationContext.tsx  # Notification preferences
│   ├── hooks/              # Custom React hooks
│   │   ├── useTransactions.ts   # Transaction operations
│   │   ├── useWorkouts.ts       # Workout operations
│   │   ├── useEnergy.ts         # Energy/wellness operations
│   │   ├── useSchedule.ts       # Schedule operations
│   │   ├── useGroups.ts         # Group operations
│   │   ├── useGoals.ts          # Goal operations
│   │   ├── useSettings.ts       # Settings access
│   │   ├── useLocalStorage.ts   # LocalStorage persistence
│   │   ├── useDebounce.ts       # Debouncing utility
│   │   └── useFormat.ts         # Formatting utilities
│   ├── lib/                # Utility functions and constants
│   │   ├── analytics.ts        # Analytics and trend calculations
│   │   ├── validation.ts       # Form validation functions
│   │   ├── storage.ts          # LocalStorage wrapper with date revival
│   │   ├── utils.ts            # General utilities (formatting, ID generation)
│   │   ├── notifications.ts    # Notification API wrapper
│   │   ├── onboarding.ts       # Onboarding tour configuration
│   │   ├── export.ts           # Data export/import functions
│   │   └── constants.ts        # App-wide constants and sample data
│   ├── pages/              # Page components
│   │   ├── Home.tsx            # Dashboard page
│   │   ├── Money.tsx           # Money management page
│   │   ├── Body.tsx            # Body & fitness page
│   │   ├── Energy.tsx          # Energy & wellness page
│   │   ├── Insights.tsx        # Insights & analytics page
│   │   ├── Groups.tsx          # Groups page
│   │   └── Settings.tsx        # Settings page
│   ├── types/              # TypeScript type definitions
│   │   ├── transaction.ts      # Transaction types
│   │   ├── workout.ts          # Workout and exercise types
│   │   ├── energy.ts           # Food entry and check-in types
│   │   ├── schedule.ts         # Schedule item types
│   │   ├── group.ts            # Group types
│   │   ├── goals.ts            # Goal types
│   │   ├── settings.ts         # Settings types
│   │   └── user.ts             # User types
│   ├── App.tsx             # Main app component with routing and providers
│   ├── main.tsx            # Application entry point
│   ├── index.css           # Global styles and Tailwind directives
│   └── setupTests.ts       # Test configuration and setup
├── public/                 # Static assets
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
├── vite.config.ts         # Vite configuration
├── tailwind.config.js     # Tailwind CSS configuration
└── README.md              # This file
```

### State Management

BeMe uses React Context API for state management with a modular approach:

**Context Architecture**:
- Each major feature area has its own context provider
- Contexts are organized by data domain (transactions, workouts, energy, etc.)
- Separation of concerns ensures maintainability and testability

**Context Providers**:
- **AppContext**: Global app settings and user information
- **TransactionContext**: Financial transactions and operations
- **WorkoutContext**: Workouts, templates, and exercise tracking
- **EnergyContext**: Food entries and wellness check-ins
- **ScheduleContext**: Daily schedule items
- **GroupContext**: Groups and member management
- **GoalsContext**: Goals and progress calculation
- **NotificationContext**: Notification preferences and permissions

**Data Flow**:
1. User interactions trigger actions in components
2. Actions call context methods
3. Context methods update state
4. State changes persist to LocalStorage
5. UI updates reactively through React's rendering system

**Local Storage Persistence**:
- All contexts use `useLocalStorage` hook for persistence
- Data is automatically saved on every change
- Date objects are properly serialized and revived
- Error handling for storage quota and availability

### Data Persistence

**LocalStorage Implementation**:
- Custom storage utility (`lib/storage.ts`) wraps browser LocalStorage
- Type-safe get/set operations with TypeScript generics
- Date object revival: Dates are serialized as ISO strings and automatically converted back to Date objects on retrieval
- Error handling for storage quota exceeded and unavailable storage
- Storage quota checking before large operations

**Storage Keys**:
All data is stored with prefixed keys:
- `beme_transactions`: Financial transactions
- `beme_workouts`: Workout logs
- `beme_workout_templates`: Saved workout templates
- `beme_energy`: Wellness check-ins
- `beme_food_entries`: Food logging entries
- `beme_schedule`: Daily schedule items
- `beme_groups`: Groups and members
- `beme_custom_group_types`: Custom group types
- `beme_settings`: Application settings
- `beme_goals`: User goals

**Sample Data Initialization**:
- App loads sample data if no existing data is found
- Sample data demonstrates app capabilities
- Users can clear sample data and start fresh
- Sample data includes transactions, workouts, food entries, check-ins, and schedule items

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js 18 or higher**: Required for running the development server and building the application
- **npm, yarn, or pnpm**: Package manager for installing dependencies
- **Modern web browser**: Chrome, Firefox, Safari, or Edge (latest versions recommended)

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd BMe
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```
   This will install all required dependencies including React, TypeScript, Vite, and all UI libraries.

3. **Start the development server**:
   ```bash
   npm run dev
   ```
   The development server will start and display the local URL (typically `http://localhost:5173`).

4. **Open in your browser**:
   Navigate to the displayed URL in your web browser to start using BeMe.

### Building for Production

To create a production build:

```bash
npm run build
```

This command will:
- Type-check the TypeScript code
- Compile and optimize the React application
- Bundle assets for optimal loading
- Output files to the `dist` directory

The production build is optimized for:
- Small bundle sizes
- Fast loading times
- Browser compatibility
- Production performance

### Preview Production Build

To preview the production build locally:

```bash
npm run preview
```

This starts a local server serving the production build, allowing you to test the optimized version before deployment.

### Running Tests

BeMe includes comprehensive test coverage:

**Run all tests**:
```bash
npm test
```

**Run tests in watch mode** (for development):
```bash
npm test -- --watch
```

**Run tests with UI** (interactive test interface):
```bash
npm run test:ui
```

**Run tests with coverage report**:
```bash
npm run test:coverage
```

**Test Framework**:
- **Vitest**: Fast unit test framework compatible with Jest
- **React Testing Library**: Utilities for testing React components
- **jsdom**: DOM implementation for Node.js testing environment

Tests are located alongside source files with `.test.ts` or `.test.tsx` extensions.

### Type Checking

Check TypeScript types without building:

```bash
npm run lint
```

This runs the TypeScript compiler in check-only mode, reporting any type errors without generating output files.

## User Guide

### First Launch

When you first open BeMe, you'll see:

1. **Onboarding Tour**: An interactive tour that highlights key features and navigation
   - Click through the tour to learn about the app
   - Tour can be dismissed and won't show again in the same session

2. **Sample Data**: The app comes pre-loaded with sample data:
   - Sample financial transactions
   - Sample workouts and exercises
   - Sample food entries
   - Sample wellness check-ins
   - Sample schedule items

   This helps you understand the app's capabilities. You can clear this data anytime in Settings.

3. **Navigation**: The bottom navigation bar provides quick access to:
   - 🏠 Home (Dashboard)
   - 💰 Money
   - 💪 Body
   - ⚡ Energy
   - 📊 Insights
   - ⚙️ Settings

### Core Workflows

#### Adding a Transaction

1. Navigate to the Money page
2. Click the "+" button or "Add Transaction" card
3. Select transaction type (Income or Expense)
4. Enter amount, category, date, and optional description
5. Mark as recurring if applicable
6. Click "Add Transaction"

The transaction appears immediately in your list and affects your balance calculations.

#### Logging a Workout

1. Navigate to the Body page
2. Click the "+" button or "Add Workout" card
3. Enter workout title and select type
4. Set date and duration
5. Add exercises with sets, reps, and weight
6. Add optional notes
7. Click "Save"

Your workout is logged and appears in your workout list and streak grid.

#### Tracking Food Intake

1. Navigate to the Energy page
2. In the "Calorie Balance" section, click the "+" button
3. Enter food name, calories, and macro nutrients (protein, carbs, fats)
4. Select the date (defaults to today)
5. Click "Add Food"

The food entry is added to your log and updates your calorie balance and macro breakdown.

#### Setting a Goal

1. Navigate to the Home page (Dashboard)
2. In the Goals section, click "New Goal"
3. Select goal type (Calories, Workouts, or Savings)
4. Enter your target value
5. Choose period (Weekly, Monthly, or Yearly)
6. Click "Add Goal"

Your goal appears on the dashboard with progress automatically calculated from your data.

#### Managing Your Schedule

1. Navigate to the Home page (Dashboard)
2. In the Daily Schedule section, click "Add your first schedule item" or the "+" button
3. Enter schedule item title
4. Set start and end times
5. Select category and optional emoji
6. Click "Save"

Schedule items appear in chronological order and can be edited or deleted at any time.

#### Creating a Group

1. Navigate to the Groups page
2. Click "New Group"
3. Enter group name and description
4. Select group type (Household, Event, Project, or Other)
5. Add custom type if needed
6. Click "Create Group"

Your group is created and ready for member management.

### Data Management

#### How Data is Stored

All your data is stored locally in your browser's LocalStorage:
- **Privacy**: Your data never leaves your device
- **Persistence**: Data persists across browser sessions
- **No Account Required**: No login or registration needed
- **Browser-Specific**: Data is stored per browser and device

#### Export Your Data

To create a backup of all your data:

1. Navigate to Settings
2. Scroll to "Data Management" section
3. Click "Export All Data"
4. A JSON file downloads containing all your data
5. Save this file in a safe location

**Export includes**:
- All transactions
- All workouts and templates
- All food entries
- All wellness check-ins
- All schedule items
- All groups
- All goals
- All settings

#### Clearing Data

To start fresh or remove all data:

1. Navigate to Settings
2. Scroll to "Data Management" section
3. Click "Clear All Data"
4. Confirm the action in the dialog

**Warning**: This action cannot be undone. Export your data first if you want to keep a backup.

#### Data Backup Recommendations

- Export your data regularly (weekly or monthly)
- Store backups in multiple locations (cloud storage, external drive)
- Keep recent backups before making major changes
- Export before clearing browser data or switching devices

### Customization

#### Changing Theme

1. Navigate to Settings
2. Find the "Theme" section
3. Select Light, Dark, or System
4. Theme changes immediately

System theme automatically matches your operating system preference and updates when your OS theme changes.

#### Setting Currency

1. Navigate to Settings
2. Find the "Currency" section
3. Select your preferred currency from the dropdown
4. See a preview of the formatting
5. Changes apply immediately to all financial displays

#### Changing Date Format

1. Navigate to Settings
2. Find the "Date Format" section
3. Select your preferred format
4. See a preview of the formatting
5. Changes apply to all date displays throughout the app

#### Setting Units

1. Navigate to Settings
2. Find the "Units" section
3. Select Metric (kg, cm) or Imperial (lbs, in)
4. Changes affect weight and measurement displays

#### Managing Notifications

1. Navigate to Settings
2. Find the "Notifications" section
3. Toggle "Enable Notifications"
4. Grant browser permission when prompted
5. Test notifications to verify setup

Notifications require browser permission. If permission is denied, you can enable it in your browser settings.

## Development Information

### Code Quality

**TypeScript**:
- Full TypeScript implementation for type safety
- Strict type checking enabled
- Type definitions for all data structures
- Compile-time error detection

**Code Organization**:
- Feature-based component organization
- Separation of concerns (components, hooks, contexts, utilities)
- Consistent naming conventions
- Modular architecture for maintainability

**Linting**:
- TypeScript compiler for type checking
- Consistent code style throughout
- No linting errors in production code

### Testing Strategy

BeMe includes comprehensive test coverage:

**Unit Tests**:
- Utility functions (formatting, validation, storage)
- Custom hooks (useLocalStorage, useDebounce)
- Analytics calculations
- Notification utilities

**Component Tests**:
- React component rendering
- User interaction testing
- Form validation testing
- Modal and dialog testing

**Context Tests**:
- State management testing
- CRUD operations testing
- Data persistence testing
- Error handling testing

**Integration Tests**:
- Page-level component testing
- Feature workflow testing
- Cross-component interaction testing

**Test Coverage**:
- Core functionality thoroughly tested
- Edge cases and error scenarios covered
- User interaction flows validated
- Data persistence verified

### Error Handling

**Error Boundary**:
- React Error Boundary catches component errors
- Graceful fallback UI for unexpected errors
- Error details logged for debugging
- User-friendly error messages

**Form Validation**:
- Inline validation with immediate feedback
- Clear error messages for each field
- Prevents invalid data submission
- Type-safe validation functions

**Storage Error Handling**:
- Graceful handling of LocalStorage quota exceeded
- Fallback behavior when storage unavailable
- User notifications for storage issues
- Recovery strategies for storage errors

**Network Independence**:
- All functionality works offline
- No network requests required
- Data stored locally ensures reliability
- No dependency on external services

### Performance

**Lazy Loading**:
- Page components loaded on-demand
- Reduced initial bundle size
- Faster initial page load
- Improved user experience

**Memoization**:
- React.memo for expensive components
- useMemo for calculated values
- useCallback for event handlers
- Optimized re-renders

**Efficient Calculations**:
- Cached computed values
- Efficient date range filtering
- Optimized aggregation functions
- Minimal unnecessary recalculations

**Bundle Optimization**:
- Tree-shaking for unused code
- Code splitting by route
- Optimized production builds
- Minimal JavaScript bundle size

## Browser Support and Compatibility

### Supported Browsers

BeMe 1.0 supports modern web browsers:

- **Chrome/Edge**: Latest 2 versions
- **Firefox**: Latest 2 versions
- **Safari**: Latest 2 versions
- **Opera**: Latest 2 versions

### Required Features

Your browser must support:
- **ES6+ JavaScript**: Modern JavaScript features
- **LocalStorage API**: For data persistence
- **CSS Grid and Flexbox**: For layout
- **CSS Custom Properties**: For theming

### Recommended

For the best experience:
- Enable JavaScript
- Allow LocalStorage (for data persistence)
- Grant notification permission (optional, for notifications)
- Use latest browser version for optimal performance

### Mobile Support

BeMe is fully responsive and works on:
- Mobile phones (iOS and Android)
- Tablets
- Desktop computers
- Any device with a modern browser

The responsive design adapts to different screen sizes, providing an optimal experience on all devices.

## Limitations and Known Issues

### LocalStorage Limitations

**Storage Quota**:
- Browser LocalStorage has size limitations (typically 5-10MB)
- Large amounts of data may exceed quota
- Export data regularly to manage storage usage
- Consider clearing old data if approaching limits

**Browser-Specific Storage**:
- Data is stored per browser and device
- Data doesn't sync across devices
- Switching browsers requires data export/import
- Clearing browser data removes all BeMe data

### Single-User Application

**No Multi-User Support**:
- Designed for single-user use
- No account system or authentication
- No user isolation or data separation
- Each browser instance is independent

### No Cloud Sync

**Local-Only Storage**:
- Data exists only on your device
- No automatic backup or sync
- Manual export required for backups
- Data loss risk if device is lost or browser data cleared

**Workaround**: Regularly export your data and store backups in cloud storage or external drives.

### No Real-Time Collaboration

**Groups Feature Limitations**:
- Groups exist locally only
- No real-time synchronization
- No shared data between users
- Foundation for future collaboration features

### Offline-Only

**No Network Features**:
- All functionality works offline
- No data synchronization
- No cloud-based features
- No external API integrations

### Known Issues

- **Date Revival**: Some edge cases with date parsing may occur with imported data
- **Large Datasets**: Performance may degrade with very large datasets (thousands of entries)
- **Browser Quota**: No automatic warning when approaching LocalStorage quota limits

These limitations are part of the current architecture and may be addressed in future versions.

## Future Enhancements

BeMe 1.0 provides a solid foundation, and the following enhancements are planned for future releases:

### Authentication System

- User accounts with email/password authentication
- Social login options (Google, Apple, etc.)
- Secure user data isolation
- Multi-device account synchronization

### Backend API Integration

- RESTful API backend
- Centralized data storage
- API endpoints for all data operations
- Secure data transmission

### Cloud Data Sync

- Automatic data synchronization across devices
- Real-time updates
- Conflict resolution
- Backup and restore from cloud

### Mobile App

- Native mobile application (React Native)
- iOS and Android support
- Push notifications
- Offline functionality with sync
- Native mobile features

### Group Collaboration Features

- Shared expense tracking
- Group task management
- Shared calendars and schedules
- Collaborative goal setting
- Real-time group updates

### Additional Features Under Consideration

- Data import functionality
- Advanced reporting and analytics
- Recurring transaction automation
- Workout program templates
- Nutrition database integration
- Integration with fitness trackers
- Budget planning and forecasting
- Habit tracking
- Journal and notes
- Photo attachments for entries

## Contributing

Contributions to BeMe are welcome! Here's how you can help:

### How to Contribute

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/your-feature-name`
3. **Make your changes**: Follow the existing code style and patterns
4. **Write tests**: Add tests for new features or bug fixes
5. **Test your changes**: Run `npm test` to ensure all tests pass
6. **Commit your changes**: Use clear, descriptive commit messages
7. **Push to your fork**: `git push origin feature/your-feature-name`
8. **Submit a Pull Request**: Provide a clear description of your changes

### Code Style Guidelines

- Follow existing TypeScript patterns
- Use functional components with hooks
- Maintain component organization by feature
- Write self-documenting code with clear variable names
- Add comments for complex logic
- Keep components focused and single-purpose

### Testing Requirements

- New features should include tests
- Bug fixes should include regression tests
- Maintain or improve test coverage
- All tests must pass before submitting PR

### Pull Request Process

1. Ensure your code follows the project's style
2. Update documentation if needed
3. Add tests for new functionality
4. Ensure all tests pass
5. Request review from maintainers
6. Address any feedback or requested changes

Thank you for contributing to BeMe!

## License

BeMe is licensed under the MIT License.

```
MIT License

Copyright (c) 2024 BeMe

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Acknowledgments

BeMe 1.0 is built with the following amazing open-source technologies and libraries:

### Core Technologies

- **React**: JavaScript library for building user interfaces
- **TypeScript**: Typed superset of JavaScript
- **Vite**: Next-generation frontend build tool

### UI Libraries

- **Shadcn UI**: Beautiful, accessible component library
- **Radix UI**: Unstyled, accessible UI primitives
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Beautiful icon library

### Data & Utilities

- **date-fns**: Modern JavaScript date utility library
- **Recharts**: Composable charting library for React

### Developer Tools

- **Vitest**: Fast unit test framework
- **React Testing Library**: Simple and complete testing utilities

### Design Principles

BeMe is designed with the following principles in mind:

- **Privacy First**: Your data stays on your device
- **Simplicity**: Intuitive interface that's easy to use
- **Performance**: Fast, responsive, and efficient
- **Accessibility**: Built with accessibility in mind
- **Modularity**: Clean, maintainable code architecture

---

**BeMe 1.0** - Take control of your life, one data point at a time.

For questions, issues, or feature requests, please open an issue on the repository.
