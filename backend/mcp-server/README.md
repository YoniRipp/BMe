# BMe MCP Server

MCP server that exposes BMe schedule, transactions, and goals as tools and resources. All data is read/written only via the BMe backend API (your DB); no external APIs.

## Prerequisites

- BMe backend running with `DATABASE_URL` set and data API available (e.g. `http://localhost:3000`).
- Node 18+.

## Configuration

- **BEME_API_URL** (optional): Base URL of the BMe backend. Default: `http://localhost:3000`.

Create a `.env` in this directory or set the variable in the environment.

## Run

```bash
cd backend/mcp-server
npm start
```

Or from the repo root:

```bash
node backend/mcp-server/index.js
```

The server uses stdio transport (stdin/stdout). It is intended to be spawned by an MCP client (e.g. Cursor).

## Cursor configuration

Add the BMe MCP server in Cursor settings (e.g. `.cursor/mcp.json` or Cursor MCP config):

```json
{
  "mcpServers": {
    "beme": {
      "command": "node",
      "args": ["backend/mcp-server/index.js"],
      "cwd": "/path/to/BMe",
      "env": {
        "BEME_API_URL": "http://localhost:3000"
      }
    }
  }
}
```

Use the absolute path for your BMe project in `cwd`. Ensure the BMe backend is running so the MCP server can call its API.

## Tools

- **add_schedule_item** — Add one item to the daily schedule (title, startTime, endTime, category).
- **list_schedule** — List active schedule items.
- **delete_schedule_item** — Remove a schedule item by id.
- **add_transaction** — Add income or expense (type, amount, category, description, date, isRecurring).
- **list_transactions** — List transactions (optional: month, type).
- **get_balance** — Get balance for the current or given month.
- **add_goal** — Add a goal (type: calories/workouts/savings, target, period).
- **list_goals** — List all goals.

## Resources

- **beme://schedule/today** — Today's schedule (JSON).
- **beme://transactions/this_month** — This month's transactions (JSON).
- **beme://goals** — Current goals (JSON).
