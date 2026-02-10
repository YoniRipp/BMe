/** Voice function declarations for Gemini Function Calling. Schema types use OpenAPI/JSON Schema values. */
export const VOICE_TOOLS = [
  {
    functionDeclarations: [
      {
        name: 'add_schedule',
        description: 'Add one or more items to the daily schedule. User may say work 8-18, eat 18-22, exercise at 7, etc. Hebrew or English.',
        parameters: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string', description: 'Activity name: Work, Eat, Exercise, etc.' },
                  startTime: { type: 'string', description: 'HH:MM 24h' },
                  endTime: { type: 'string', description: 'HH:MM 24h' },
                  category: { type: 'string', enum: ['Work', 'Exercise', 'Meal', 'Sleep', 'Personal', 'Social', 'Other'] },
                  recurrence: { type: 'string', enum: ['daily', 'weekdays', 'weekends'], description: 'Repeating: daily, weekdays (Mon-Fri), weekends' },
                },
                required: ['title'],
              },
            },
          },
          required: ['items'],
        },
      },
      {
        name: 'edit_schedule',
        description: 'Edit an existing schedule item. E.g. change work from 9-5 to 10-6.',
        parameters: {
          type: 'object',
          properties: {
            itemTitle: { type: 'string', description: 'Activity name to edit (e.g. Work, Eat)' },
            itemId: { type: 'string', description: 'Id if known' },
            startTime: { type: 'string', description: 'HH:MM 24h' },
            endTime: { type: 'string', description: 'HH:MM 24h' },
            title: { type: 'string' },
            category: { type: 'string', enum: ['Work', 'Exercise', 'Meal', 'Sleep', 'Personal', 'Social', 'Other'] },
          },
        },
      },
      {
        name: 'delete_schedule',
        description: 'Remove an item from the schedule by title or id.',
        parameters: {
          type: 'object',
          properties: {
            itemTitle: { type: 'string', description: 'Activity name to remove' },
            itemId: { type: 'string', description: 'Optional id if user specified' },
          },
        },
      },
      {
        name: 'add_transaction',
        description: 'Record an income or expense. When the user says they bought or spent money on food or drink (e.g. Coke, coffee, lunch), use category "Food" and set description to the item name. You MUST also call add_food with that item name so both the expense and the food log are recorded. For other expenses use the appropriate category; for income use Salary, Freelance, Investment, Gift, Other. Never use "Other" for food or drink purchases—use "Food".',
        parameters: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['income', 'expense'] },
            amount: { type: 'number', description: 'Amount in currency units' },
            category: {
              type: 'string',
              enum: ['Food', 'Housing', 'Transportation', 'Entertainment', 'Shopping', 'Healthcare', 'Education', 'Other', 'Salary', 'Freelance', 'Investment', 'Gift'],
              description: 'Expense: Food, Housing, Transportation, Entertainment, Shopping, Healthcare, Education, Other. Income: Salary, Freelance, Investment, Gift, Other. Use Food for any food or drink purchase.',
            },
            description: { type: 'string', description: 'Optional description; for food/drink purchases use the item name (e.g. Coke)' },
            date: { type: 'string', description: 'YYYY-MM-DD, default today' },
            isRecurring: { type: 'boolean', description: 'Recurring expense/income' },
          },
          required: ['type', 'amount'],
        },
      },
      {
        name: 'edit_transaction',
        description: 'Edit an income or expense.',
        parameters: {
          type: 'object',
          properties: {
            description: { type: 'string', description: 'Description to match' },
            transactionId: { type: 'string' },
            date: { type: 'string' },
            type: { type: 'string', enum: ['income', 'expense'] },
            amount: { type: 'number' },
            category: { type: 'string' },
          },
        },
      },
      {
        name: 'delete_transaction',
        description: 'Remove a transaction.',
        parameters: {
          type: 'object',
          properties: {
            description: { type: 'string' },
            transactionId: { type: 'string' },
            date: { type: 'string' },
          },
        },
      },
      {
        name: 'add_workout',
        description: 'Log a workout. User may say ran 45 minutes, did strength for an hour, cardio 30 min, etc.',
        parameters: {
          type: 'object',
          properties: {
            date: { type: 'string', description: 'YYYY-MM-DD, default today' },
            title: { type: 'string', description: 'Workout name e.g. Morning Run' },
            type: { type: 'string', enum: ['strength', 'cardio', 'flexibility', 'sports'] },
            durationMinutes: { type: 'number' },
            notes: { type: 'string' },
          },
          required: ['title', 'type', 'durationMinutes'],
        },
      },
      {
        name: 'edit_workout',
        description: 'Edit a logged workout.',
        parameters: {
          type: 'object',
          properties: {
            workoutTitle: { type: 'string' },
            workoutId: { type: 'string' },
            date: { type: 'string', description: 'YYYY-MM-DD for disambiguation' },
            title: { type: 'string' },
            type: { type: 'string', enum: ['strength', 'cardio', 'flexibility', 'sports'] },
            durationMinutes: { type: 'number' },
            notes: { type: 'string' },
          },
        },
      },
      {
        name: 'delete_workout',
        description: 'Remove a workout.',
        parameters: {
          type: 'object',
          properties: {
            workoutTitle: { type: 'string' },
            workoutId: { type: 'string' },
            date: { type: 'string', description: 'YYYY-MM-DD for disambiguation' },
          },
        },
      },
      {
        name: 'add_food',
        description: 'Log food or drink consumed. When the user says they bought or spent money on food/drink (e.g. got a Coke for 9, bought coffee for 5), call BOTH add_transaction (expense, category Food, description item name) AND add_food (food: item name in English). For "ate X" without purchase, call only add_food. Output food name in English.',
        parameters: {
          type: 'object',
          properties: {
            food: { type: 'string', description: 'Food name in English' },
            amount: { type: 'number', description: 'Quantity' },
            unit: { type: 'string', description: 'g, kg, ml, L, cup, slice, serving, etc.' },
            date: { type: 'string', description: 'YYYY-MM-DD, default today' },
          },
          required: ['food'],
        },
      },
      {
        name: 'edit_food_entry',
        description: 'Edit a logged food entry.',
        parameters: {
          type: 'object',
          properties: {
            foodName: { type: 'string' },
            entryId: { type: 'string' },
            date: { type: 'string' },
            name: { type: 'string' },
            calories: { type: 'number' },
            protein: { type: 'number' },
            carbs: { type: 'number' },
            fats: { type: 'number' },
          },
        },
      },
      {
        name: 'delete_food_entry',
        description: 'Remove a food log.',
        parameters: {
          type: 'object',
          properties: {
            foodName: { type: 'string' },
            entryId: { type: 'string' },
            date: { type: 'string' },
          },
        },
      },
      {
        name: 'log_sleep',
        description: 'Log sleep duration in hours. User may say slept 8 hours, slept 7, etc.',
        parameters: {
          type: 'object',
          properties: {
            sleepHours: { type: 'number', description: 'Hours slept' },
            date: { type: 'string', description: 'YYYY-MM-DD, default today' },
          },
          required: ['sleepHours'],
        },
      },
      {
        name: 'edit_check_in',
        description: 'Update sleep hours for a date.',
        parameters: {
          type: 'object',
          properties: {
            date: { type: 'string', description: 'YYYY-MM-DD' },
            sleepHours: { type: 'number' },
          },
          required: ['date', 'sleepHours'],
        },
      },
      {
        name: 'delete_check_in',
        description: 'Remove a sleep log.',
        parameters: {
          type: 'object',
          properties: {
            date: { type: 'string', description: 'YYYY-MM-DD' },
          },
          required: ['date'],
        },
      },
      {
        name: 'add_goal',
        description: 'Add a goal. E.g. save 500 monthly, 3 workouts per week.',
        parameters: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['calories', 'workouts', 'savings'] },
            target: { type: 'number' },
            period: { type: 'string', enum: ['weekly', 'monthly', 'yearly'] },
          },
          required: ['type', 'target', 'period'],
        },
      },
      {
        name: 'edit_goal',
        description: 'Edit a goal.',
        parameters: {
          type: 'object',
          properties: {
            goalType: { type: 'string' },
            goalId: { type: 'string' },
            target: { type: 'number' },
            period: { type: 'string', enum: ['weekly', 'monthly', 'yearly'] },
          },
        },
      },
      {
        name: 'delete_goal',
        description: 'Remove a goal.',
        parameters: {
          type: 'object',
          properties: {
            goalType: { type: 'string' },
            goalId: { type: 'string' },
          },
        },
      },
    ],
  },
];
