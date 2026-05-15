# Last-Day Backend Interview Cheat Sheet

## 1. 2-Minute Project Explanation

"My project has two small backend services and one reusable logging module. The main service is `vehicle_maintenance_scheduler`. It is built with Node.js and Express. It fetches depot and vehicle task data from protected external APIs using `BASE_API_URL` and `ACCESS_TOKEN` from `.env`, then generates an optimized maintenance schedule.

The request flow is: client calls an API, Express receives it in `app.js`, route is matched in `schedule.routes.js`, controller handles the request in `schedule.controller.js`, services fetch external data and run business logic, then JSON response is returned.

The core logic is in `scheduler.service.js`. I used a knapsack-style dynamic programming approach. Each depot has limited mechanic hours, and each task has duration and impact. The goal is to choose tasks with maximum impact without exceeding mechanic hours.

The second service is `notification_app_be`, which fetches notifications and ranks them by priority using type and recency. I also wrote `logging_middleware`, a reusable `Log()` helper that sends logs to the provided logging API."

## 2. APIs With Purpose

### Vehicle Maintenance Scheduler

| Method | API | Purpose |
|---|---|---|
| GET | `/` | Health check: confirms service is running |
| GET | `/api/depots` | Fetches raw depot data from external API |
| GET | `/api/vehicles` | Fetches raw vehicle task data from external API |
| GET | `/api/schedule` | Fetches depots and vehicles, then returns optimized schedules |

### Notification Backend

| Method | API | Purpose |
|---|---|---|
| GET | `/` | Health check |
| GET | `/api/notifications` | Fetches raw notifications from external API |
| GET | `/api/priority-notifications?limit=10` | Returns top priority notifications |

## 3. Database Schema Explanation

Important: The runnable code does **not** connect to a database.

Safe answer:

"In my runnable backend, I did not use a database because the OA data comes from protected external APIs. But in my notification system design document, I proposed PostgreSQL because notification data is structured and needs filtering, sorting, and indexing."

Proposed notification schema:

| Table | Purpose |
|---|---|
| `students` | Stores student profile data |
| `notifications` | Stores notification per student with type, title, message, read status, priority, created time |
| `notification_batches` | Stores one notification sent to many students |
| `notification_delivery_status` | Tracks email/push delivery status, retry count, and failures |

Important indexes:

- `(student_id, is_read, created_at DESC)` for unread notifications.
- `(student_id, created_at DESC)` for notification history.
- `(notification_type, created_at DESC, student_id)` for recent placement notifications.

## 4. Most Likely 30 Questions And Answers

1. **Explain your project.**  
   I built an Express backend that fetches depot and vehicle data from protected APIs and generates optimized maintenance schedules.

2. **What is the main logic?**  
   The main logic is in `scheduler.service.js`, where I use knapsack dynamic programming to select high-impact tasks within mechanic hours.

3. **Why Express.js?**  
   Express is simple, lightweight, and good for building REST APIs quickly.

4. **Explain request flow for `/api/schedule`.**  
   Request goes to `app.js`, then route, controller, external API service, scheduler service, and then JSON response.

5. **Why did you use GET for `/api/schedule`?**  
   Because it does not modify server data. It only fetches and computes a result.

6. **What are routes?**  
   Routes define API paths and connect them to controller functions.

7. **What are controllers?**  
   Controllers handle HTTP request and response.

8. **What are services?**  
   Services contain business logic and external API calls.

9. **Where is business logic written?**  
   In `scheduler.service.js` and `priorityNotifications.js`.

10. **What is `asyncHandler`?**  
    It catches async errors and passes them to Express error middleware.

11. **How do you call protected APIs?**  
    I send `Authorization: Bearer <ACCESS_TOKEN>` header from `.env`.

12. **Is user authentication implemented?**  
    No. Only backend-to-external-API token usage is implemented.

13. **How would you add auth?**  
    I would add JWT login, auth middleware, and protect required routes.

14. **What if external API fails?**  
    The service throws an error, logs it, and the error handler returns failure JSON.

15. **What if `.env` values are missing?**  
    The service throws a server configuration error.

16. **What validation is implemented?**  
    I validate arrays, external response format, and filter invalid task duration/impact.

17. **What validation is missing?**  
    Strong query validation, depot mechanic hour validation, and schema validation like Joi/Zod.

18. **Can same task go to multiple depots?**  
    Yes, currently each depot is optimized independently. If task uniqueness is required, I would track assigned task IDs.

19. **What is the complexity of your scheduler?**  
    `O(numberOfTasks * mechanicHours)` per depot.

20. **What is the notification priority formula?**  
    `priorityScore = typeWeight + recencyScore`.

21. **Why Placement gets highest priority?**  
    Because placement updates are usually most important for students.

22. **Do you use database in runnable code?**  
    No, because data is fetched from external APIs.

23. **Which DB would you choose for notifications?**  
    PostgreSQL, because data is structured and needs filtering, sorting, and indexes.

24. **How would you improve DB performance?**  
    Use indexes, pagination, caching, and avoid `SELECT *`.

25. **How did you test APIs?**  
    I tested manually using API responses/screenshots. I would add Jest and Supertest.

26. **What unit tests would you add?**  
    Tests for `solveKnapsack`, `buildMaintenanceSchedule`, and `getTopPriorityNotifications`.

27. **What production improvements are needed?**  
    Auth, tests, rate limiting, restricted CORS, better validation, monitoring, and README.

28. **What is CORS?**  
    CORS controls which browser origins can call backend APIs.

29. **What if API traffic increases?**  
    Use load balancing, caching, rate limiting, and background workers for heavy work.

30. **What did you learn?**  
    I learned API structure, external API integration, error handling, logging, and basic optimization.

## 5. Weak Points And Safe Answers

| Weak Point | Safe Answer |
|---|---|
| No user auth | "User auth was not part of my implementation. I used bearer token only for protected external API calls. I would add JWT middleware in production." |
| No DB in runnable code | "The data source was external APIs, so I did not add a DB. I would add DB if we need schedule history or user-specific data." |
| No automated tests | "I tested manually for OA, but I would add Jest unit tests and Supertest integration tests." |
| Open CORS | "It is okay for development. In production I would restrict it to frontend domain." |
| Weak validation | "I did basic validation, but production should use Joi/Zod and stricter checks." |
| No rate limiting | "I would add rate limiting to prevent abuse." |
| Logging API is awaited | "It works, but can add latency. In production I would make logging async or queue-based." |
| Notification app less modular | "I would refactor it into routes, controllers, and services like the scheduler app." |
| Same task may repeat across depots | "Current logic optimizes each depot independently. If unique assignment is needed, I would track assigned tasks." |

## 6. Backend Status Codes

| Code | Meaning | Use In Interview |
|---|---|---|
| 200 | OK | Successful API response |
| 201 | Created | New resource created, like user/notification |
| 400 | Bad Request | Invalid input |
| 401 | Unauthorized | User not logged in or token missing |
| 403 | Forbidden | User logged in but not allowed |
| 404 | Not Found | Route/resource not found |
| 500 | Internal Server Error | Server/config/code error |
| 502 | Bad Gateway | Upstream API returned invalid response |
| 503 | Service Unavailable | External dependency/server temporarily unavailable |

## 7. Authentication Basics

- Authentication means checking who the user is.
- Authorization means checking what the user is allowed to do.
- JWT is a signed token used to identify a logged-in user.
- Passwords should be hashed using bcrypt/argon2, not stored in plain text.
- Secrets like JWT secret and access token should be in `.env`.

Safe line:

"My project does not implement user login, but I understand how I would add JWT auth middleware to protect routes."

## 8. Security Basics

- Do not hardcode secrets.
- Keep `.env` out of Git.
- Restrict CORS in production.
- Validate input.
- Add rate limiting.
- Do not expose internal error details.
- Do not log sensitive tokens/passwords.
- Use HTTPS in production.
- Hash passwords if login is added.

## 9. Scalability Basics

- Add pagination for large data.
- Add caching for repeated reads.
- Use Redis for unread counts or recent notifications.
- Use indexes for DB queries.
- Use load balancer and multiple app instances.
- Move heavy computation to background workers.
- Add API timeouts and retries for external calls.
- Use queues for bulk notification sending.

Project-specific line:

"For my scheduler, the main bottlenecks are external API latency and DP computation if task count or mechanic hours become very large."

## 10. Testing Basics

Manual testing done:

- Health route.
- `/api/depots`.
- `/api/vehicles`.
- `/api/schedule`.
- `/api/priority-notifications`.

Tests to add:

- Unit tests for `solveKnapsack`.
- Unit tests for invalid tasks.
- Unit tests for notification priority scoring.
- Integration tests for routes using Supertest.
- Mock external APIs instead of calling real APIs in tests.

Safe line:

"I tested manually for the OA, but the next improvement would be automated unit and integration tests."

## 11. Final Confidence Lines

- "I can clearly explain what is implemented and what is only designed."
- "The runnable scheduler does not use a database; it depends on protected external APIs."
- "The core backend flow is route, controller, service, external API, business logic, response."
- "My main algorithm is knapsack DP to maximize impact within mechanic hours."
- "This project is not production-perfect, but I know the missing pieces: auth, tests, validation, rate limiting, monitoring, and better error handling."
- "As a fresher, I focused on building the correct flow first, and I can improve it step by step for production."
