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
        description: 'Record an income or expense. Only call this when the user EXPLICITLY mentions an amount of money (e.g. "for 5", "cost 10", "paid 20"). Do NOT call for a food or drink name alone (e.g. "Diet Coke", "coffee") with no price—do not invent or guess an amount. When the user does state a price for food/drink, use category "Food" and description = item name, and also call add_food. For other expenses use the appropriate category; for income use Salary, Freelance, Investment, Gift, Other.',
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
        description: 'Log a workout. When the user does not give a workout name use title "Workout". When they say a program name (e.g. SS, Starting Strength) use that as title. Do not use an exercise name as the workout title. Examples: "ran 45 minutes", "did squats 5 sets of 3 at 140 kilos", "SS: squat 5x3 140kg deadlift 3x3 160kg". For strength with sets/reps/weight use type "strength" and fill the exercises array. durationMinutes is optional (default 30).',
        parameters: {
          type: 'object',
          properties: {
            date: { type: 'string', description: 'YYYY-MM-DD, default today' },
            title: { type: 'string', description: 'Workout name: "Workout" when none given, or user\'s program name (e.g. SS)' },
            type: { type: 'string', enum: ['strength', 'cardio', 'flexibility', 'sports'], description: 'Use strength when user mentions sets/reps/weight' },
            durationMinutes: { type: 'number', description: 'Optional; default 30' },
            notes: { type: 'string' },
            exercises: {
              type: 'array',
              description: 'For strength: list each exercise with name, sets, reps, weight (kg). Use sets × reps: "5 sets of 3 reps" or "3 reps 5 sets" → sets: 5, reps: 3. Notation "3x3" means 3 sets of 3 reps → sets: 3, reps: 3.',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string', description: 'Use the exact exercise name the user said, capitalized (e.g. Squat, Deadlift, Bench Press). Do not use the workout title here; each exercise has its own name.' },
                  sets: { type: 'number', description: 'Number of sets' },
                  reps: { type: 'number', description: 'Reps per set' },
                  weight: { type: 'number', description: 'Weight in kg (optional)' },
                  notes: { type: 'string' },
                },
                required: ['name', 'sets', 'reps'],
              },
            },
          },
          required: ['title', 'type'],
        },
      },
      {
        name: 'edit_workout',
        description: 'Edit a logged workout. You can change title, type, duration, notes, date, or the exercises list. To change one exercise (e.g. "change squat to 5 sets", "remove deadlift", "add bench press 3x10 60kg"), pass the full exercises array with the updates. To replace or remove exercises, send the new list.',
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
            exercises: {
              type: 'array',
              description: 'Full list of exercises (replaces existing). Each: name, sets, reps, weight (kg optional). Use when user asks to add, remove, or change an exercise.',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  sets: { type: 'number' },
                  reps: { type: 'number' },
                  weight: { type: 'number', description: 'Weight in kg (optional)' },
                  notes: { type: 'string' },
                },
                required: ['name', 'sets', 'reps'],
              },
            },
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
        description: 'Log food or drink consumed. If the user says ONLY a food or drink name (e.g. "Diet Coke", "coffee", "ate an apple") or "had X" without mentioning buying or a price, call ONLY add_food—do not call add_transaction. When the user explicitly says they bought X for Y money, call BOTH add_transaction and add_food. Output food name in English.',
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
        description: 'Log sleep duration in hours. User may say slept 8 hours, slept 7, woke up from 6 to 8 (2 hours), etc.',
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
