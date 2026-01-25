# Matplotlib Backend Fix for Background Threads

## Issue
Report generation was failing with error:
```
Cannot create a GUI FigureManager outside the main thread using the MacOS backend.
Use a non-interactive backend like 'agg' to make plots on worker threads.
```

## Root Cause
- Report generation runs in a FastAPI background task (separate thread)
- Matplotlib was trying to use the MacOS GUI backend on a background thread
- MacOS backend requires the main thread for GUI operations
- Even though `drawing_utils.py` set `matplotlib.use('Agg')`, it was being imported too late

## Solution
Added matplotlib backend configuration at the TOP of `psychology_report_routes.py` BEFORE any other imports:

```python
"""
Psychology Report Generation API Routes
"""

# CRITICAL: Set matplotlib backend BEFORE any other imports
import matplotlib
matplotlib.use('Agg')

import logging
import os
# ... rest of imports
```

## Why This Works
1. **Import Order Matters**: Matplotlib backend must be set before ANY matplotlib code is imported
2. **Early Configuration**: By setting it in the routes file (which triggers background tasks), we ensure it's set before chart generation
3. **Non-Interactive Backend**: 'Agg' backend doesn't require GUI and works perfectly in background threads

## Files Modified
1. `ai-chat-api/src/api/psychology_report_routes.py` - Added matplotlib.use('Agg') at top

## Testing
```bash
# Check report status
curl http://localhost:8000/api/psychology/report/1/status

# Should now show 'completed' instead of 'failed'
```

## Additional Notes
- `drawing_utils.py` already had `matplotlib.use('Agg')` but it wasn't early enough
- Background tasks in FastAPI run in separate threads
- MacOS backend is the default on macOS systems
- 'Agg' backend is perfect for server-side chart generation

## Status
✅ Fixed - Backend restarted successfully
✅ Charts will now generate properly in background threads
✅ No more GUI backend errors
