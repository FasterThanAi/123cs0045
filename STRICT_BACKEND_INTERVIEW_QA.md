# Strict Backend Interview Questions: Affordmed OA Project

Use this as a hard-mode interview drill. These questions are intentionally uncomfortable because they target the weak spots and tradeoffs in your exact implementation.

## 1. Your scheduler assigns the same task list independently to every depot. Can the same vehicle task be selected for multiple depots?

**Why interviewer may ask:**  
They want to see if you noticed a business-logic flaw in `buildMaintenanceSchedule()` in `vehicle_maintenance_scheduler/src/services/scheduler.service.js`.

**Student-level answer:**  
"Yes, in my current implementation each depot is optimized independently using the same valid task list. So if the business rule says one task can only be assigned once globally, then my current logic would need improvement."

**Strong follow-up answer:**  
"I would clarify the requirement first. If tasks are globally unique, I would maintain an `assignedTaskIds` set and remove already assigned tasks before optimizing the next depot, or design a global optimization approach across all depots. Current code solves per-depot optimization, not global assignment."

**Mistake to avoid:**  
Do not claim the current algorithm guarantees global uniqueness. It does not.

## 2. Why did you use 0/1 knapsack, and what are its limitations here?

**Why interviewer may ask:**  
The main technical logic is `solveKnapsack()` in `scheduler.service.js`.

**Student-level answer:**  
"I used knapsack because each maintenance task has a duration and impact, and each depot has limited mechanic hours. So duration is like weight, impact is value, and mechanic hours is capacity."

**Strong follow-up answer:**  
"The limitation is time and memory complexity: `O(tasks * capacity)` per depot. If mechanic hours or task count becomes very large, this can become expensive and block the Node.js event loop. For production, I could optimize memory to 1D DP, add limits, cache results, or move heavy computation to a worker."

**Mistake to avoid:**  
Do not say it is always scalable. It depends on task count and capacity size.

## 3. What happens if `MechanicHours` is missing or becomes `NaN`?

**Why interviewer may ask:**  
`normalizeDepot()` converts `depot.MechanicHours` using `Number()` but does not validate it before `solveKnapsack()`.

**Student-level answer:**  
"Currently, I validate depots is an array, but I do not strongly validate each depot's mechanic hours. That is a gap."

**Strong follow-up answer:**  
"I should filter or reject depots where `mechanicHours` is not a non-negative integer. Otherwise `Array(capacity + 1)` can behave incorrectly if capacity is `NaN` or invalid."

**Mistake to avoid:**  
Do not pretend every external API field is guaranteed valid unless the task explicitly says so.

## 4. Your `solveKnapsack()` uses `Array(capacity + 1)`. What if capacity is huge?

**Why interviewer may ask:**  
They are testing performance and memory awareness.

**Student-level answer:**  
"If capacity is huge, the DP table can consume a lot of memory."

**Strong follow-up answer:**  
"The current implementation creates a 2D table of `(n + 1) * (capacity + 1)`. For large capacity, I would either validate maximum capacity, use 1D DP, use approximation/greedy if acceptable, or process this in a background worker."

**Mistake to avoid:**  
Do not say Node.js can handle any amount because it is asynchronous. CPU and memory work still matters.

## 5. Why is `/api/schedule` a GET endpoint if it performs computation?

**Why interviewer may ask:**  
They are checking HTTP semantics.

**Student-level answer:**  
"I used GET because it does not modify server data. It fetches external data and returns a computed result."

**Strong follow-up answer:**  
"For this OA it is fine because the computation is immediate and stateless. If scheduling became expensive or stored results, I would use POST to create a scheduling job and return a job ID."

**Mistake to avoid:**  
Do not say GET is only for simple database reads. GET can return computed data if it is safe and idempotent from the server's perspective.

## 6. What happens if the external `/depots` API succeeds but `/vehicles` fails?

**Why interviewer may ask:**  
They want to test partial failure handling in `getOptimizedSchedule()`.

**Student-level answer:**  
"The schedule endpoint will fail because both depots and vehicles are required to generate the schedule."

**Strong follow-up answer:**  
"Currently, the error will be caught by `asyncHandler` and returned through central error middleware. In production, I would log which upstream failed, maybe retry once, and return a clear `502` or `503` depending on the failure."

**Mistake to avoid:**  
Do not say partial schedule can still be generated without vehicles. It cannot.

## 7. Why do you return upstream HTTP status directly from `fetchFromProtectedApi()`?

**Why interviewer may ask:**  
In `externalApi.service.js`, `error.statusCode = response.status`.

**Student-level answer:**  
"I passed the upstream status so the client gets some idea of the failure."

**Strong follow-up answer:**  
"A better production approach is to map upstream errors carefully. For example, if upstream returns 401 because my backend token expired, exposing 401 to the client may be misleading. I might return 502 or 503 and log the exact upstream status internally."

**Mistake to avoid:**  
Do not expose internal upstream details as if they are always client errors.

## 8. Your logging middleware awaits log calls during requests. Can this slow down APIs?

**Why interviewer may ask:**  
`await Log(...)` appears in request middleware, controllers, and startup.

**Student-level answer:**  
"Yes, since I await the logging API call, it can add latency if the logging API is slow."

**Strong follow-up answer:**  
"For the OA I used the logging middleware directly. In production, I would avoid blocking critical request flow on non-critical logs. I could fire-and-forget, use a queue, batch logs, or use a local logger that ships logs asynchronously."

**Mistake to avoid:**  
Do not say logging has no performance impact.

## 9. What if `Log()` fails?

**Why interviewer may ask:**  
They want reliability awareness.

**Student-level answer:**  
"The `Log()` function catches errors and returns a failure object, so the main app does not crash because of logging failure."

**Strong follow-up answer:**  
"That is good for availability, but currently I am not checking the returned failure everywhere. In production, I would have fallback console/file logs or monitoring for log delivery failure."

**Mistake to avoid:**  
Do not say logs are guaranteed to be delivered.

## 10. Is authentication implemented in your APIs?

**Why interviewer may ask:**  
Your routes are open; only external API calls use bearer token.

**Student-level answer:**  
"User authentication is not implemented. My backend uses an access token from `.env` to call protected external APIs."

**Strong follow-up answer:**  
"If this became a product, I would add JWT authentication middleware, validate tokens on protected routes, and add role checks for admin actions. I would also restrict CORS and add rate limiting."

**Mistake to avoid:**  
Do not confuse backend-to-backend bearer token with user login/authentication.

## 11. Why is open `cors()` risky?

**Why interviewer may ask:**  
Both apps use `app.use(cors())`.

**Student-level answer:**  
"Open CORS allows browser requests from any origin. It is okay for testing, but risky for production."

**Strong follow-up answer:**  
"In production, I would configure allowed origins using an environment variable like `FRONTEND_URL`. CORS is not full security by itself, but restricting origins reduces unwanted browser-based access."

**Mistake to avoid:**  
Do not say CORS protects APIs from all attackers. It mainly controls browser cross-origin behavior.

## 12. Why is there no database in the runnable scheduler?

**Why interviewer may ask:**  
They may expect DB discussion.

**Student-level answer:**  
"The scheduler task uses data from provided external APIs, so I did not add my own database. The backend acts as an integration and processing service."

**Strong follow-up answer:**  
"If requirements included storing schedule history, audit logs, user-specific schedules, or cached external data, then I would add a database. For the notification design, I proposed PostgreSQL in `notification_system_design.md`."

**Mistake to avoid:**  
Do not invent a database that is not in your code.

## 13. Your notification design has PostgreSQL, but code has no PostgreSQL. How do you explain that?

**Why interviewer may ask:**  
They may compare `notification_system_design.md` with `notification_app_be/server.js`.

**Student-level answer:**  
"The design document describes how I would build the full notification platform. The runnable notification service only implements fetching and priority ranking from the provided external API."

**Strong follow-up answer:**  
"I separated design from implementation because the OA had multiple stages. The code covers priority notification logic in `priorityNotifications.js`, while the document covers schema, indexes, caching, and scaling."

**Mistake to avoid:**  
Do not claim the PostgreSQL schema is implemented.

## 14. Your notification priority route accepts `limit`. What if user passes `limit=-100` or `limit=1000000`?

**Why interviewer may ask:**  
`Number(req.query.limit) || 10` is weak validation.

**Student-level answer:**  
"Currently, the limit validation is weak. Negative or very large values are not properly restricted."

**Strong follow-up answer:**  
"I should parse the limit, check it is an integer, set a minimum and maximum, for example 1 to 100, and return 400 for invalid values."

**Mistake to avoid:**  
Do not say `Number()` is complete validation.

## 15. What happens with invalid notification timestamp?

**Why interviewer may ask:**  
`getRecencyScore()` handles invalid dates.

**Student-level answer:**  
"If timestamp is invalid, the recency score becomes 0, so the app does not crash."

**Strong follow-up answer:**  
"That is a graceful fallback, but I would also log or validate invalid notification records because bad timestamps can affect ranking quality."

**Mistake to avoid:**  
Do not say invalid timestamps are ignored completely; they still may rank by type weight.

## 16. Why did you choose Placement = 300, Result = 200, Event = 100?

**Why interviewer may ask:**  
They are testing whether priority logic is arbitrary.

**Student-level answer:**  
"The requirement priority order was Placement, then Result, then Event, so I assigned higher weights to more important types."

**Strong follow-up answer:**  
"The gap of 100 means type has stronger influence than recency. If product wanted very recent events to outrank old placements, I would tune the formula or store weights in config."

**Mistake to avoid:**  
Do not say the numbers are universally correct. They are a design choice.

## 17. Why not use a heap for top priority notifications?

**Why interviewer may ask:**  
Your code sorts all notifications, while your design doc mentions heap.

**Student-level answer:**  
"For the current simple implementation, sorting is easy and readable. It is `O(n log n)`."

**Strong follow-up answer:**  
"For very large data streams, a min-heap of size N would be better because it keeps only top N items and works in `O(n log N)`. I mentioned that approach in the design document."

**Mistake to avoid:**  
Do not say sorting is always best for large data.

## 18. What is the difference between `400`, `500`, and `502` in your project?

**Why interviewer may ask:**  
They want practical status code clarity.

**Student-level answer:**  
"400 is for invalid client input. 500 is for server-side problems like missing config. 502 is when an upstream API gives an invalid response."

**Strong follow-up answer:**  
"In `externalApi.service.js`, invalid upstream response format returns 502. Missing `BASE_API_URL` or `ACCESS_TOKEN` is 500 because it is our server configuration problem."

**Mistake to avoid:**  
Do not use 500 for every error in explanation, even though the notification app currently does that.

## 19. Your notification app catches errors and always returns 500. Is that correct?

**Why interviewer may ask:**  
`notification_app_be/server.js` route catch blocks return 500 for all errors.

**Student-level answer:**  
"It works for basic failure handling, but it is not ideal because different errors should have different status codes."

**Strong follow-up answer:**  
"I would create an `asyncHandler` and central error middleware like the scheduler app. I would also attach status codes to errors and preserve 400, 502, or 503 where appropriate."

**Mistake to avoid:**  
Do not defend all errors as 500.

## 20. Why did you create a reusable logging package?

**Why interviewer may ask:**  
They want to know if `logging_middleware` is meaningful.

**Student-level answer:**  
"The OA required logging, so I created a reusable `Log()` function that can be imported by both backend apps."

**Strong follow-up answer:**  
"It validates stack, level, package, and message before sending logs to the logging API. This avoids invalid log calls and keeps logging format consistent."

**Mistake to avoid:**  
Do not call it Express middleware in the strict sense. It is more of a logging helper/package, not an `app.use()` middleware by itself.

## 21. What would happen if `ACCESS_TOKEN` expires?

**Why interviewer may ask:**  
External APIs depend on it.

**Student-level answer:**  
"External API calls would fail, probably with unauthorized response, and my backend would return an error."

**Strong follow-up answer:**  
"In production, I would implement token refresh if supported, monitor 401/403 upstream responses, and avoid exposing token details to clients."

**Mistake to avoid:**  
Do not say `.env` token never changes.

## 22. Why is `.env` not committed?

**Why interviewer may ask:**  
Security basics.

**Student-level answer:**  
"Because it contains secrets like access tokens and API URLs. `.gitignore` includes `.env`."

**Strong follow-up answer:**  
"I would add `.env.example` with only key names, not actual values, so another developer knows required configuration."

**Mistake to avoid:**  
Do not reveal actual token values in interview or screenshots.

## 23. How would you test `solveKnapsack()`?

**Why interviewer may ask:**  
There are no automated tests.

**Student-level answer:**  
"I would write unit tests with small task lists where I already know the correct selected tasks and total impact."

**Strong follow-up answer:**  
"Test cases: empty tasks, capacity 0, exact fit, task duration greater than capacity, tie in impact, invalid tasks filtered by `buildMaintenanceSchedule()`, and multiple depots."

**Mistake to avoid:**  
Do not say Postman testing is enough for algorithm correctness.

## 24. How would you integration test `/api/schedule`?

**Why interviewer may ask:**  
They want testing beyond pure functions.

**Student-level answer:**  
"I would use Supertest to call the Express route and mock the external depots and vehicles APIs."

**Strong follow-up answer:**  
"Since `app.js` exports the app separately from `server.js`, it is easier to test without opening a real port. I would mock `fetch` or the external API service functions."

**Mistake to avoid:**  
Do not say you must start the actual server and hit real Affordmed APIs for every test.

## 25. How does your code handle malformed JSON from external API?

**Why interviewer may ask:**  
`fetchFromProtectedApi()` tries `response.json()` in a try/catch.

**Student-level answer:**  
"If JSON parsing fails, data becomes null. Then if response is OK but format is invalid, `fetchDepots` or `fetchVehicles` throws invalid response format."

**Strong follow-up answer:**  
"That results in a 502 for invalid upstream response shape. This is useful because our backend depends on a proper JSON contract from upstream."

**Mistake to avoid:**  
Do not say parse errors are impossible.

## 26. Is your API idempotent?

**Why interviewer may ask:**  
They are testing REST fundamentals.

**Student-level answer:**  
"The current GET endpoints are idempotent in the sense that calling them multiple times does not change my server state."

**Strong follow-up answer:**  
"However, the result may change if external API data changes or time-based priority score changes. So it is safe, but not necessarily identical forever."

**Mistake to avoid:**  
Do not confuse idempotent with always returning the same response.

## 27. What production readiness is missing?

**Why interviewer may ask:**  
They want honest self-review.

**Student-level answer:**  
"Missing pieces are automated tests, stronger validation, user authentication, rate limiting, restricted CORS, better README, and production monitoring."

**Strong follow-up answer:**  
"I would also add fetch timeouts, structured logs with request IDs, centralized config validation on startup, and better error mapping for upstream failures."

**Mistake to avoid:**  
Do not say it is fully production ready.

## 28. What if the external API is very slow?

**Why interviewer may ask:**  
Your `fetch()` calls have no timeout.

**Student-level answer:**  
"Currently the request may wait too long because I have not added a timeout."

**Strong follow-up answer:**  
"I would use `AbortController` to set a timeout, return a clear 503/504-style error, and maybe retry safely for GET requests."

**Mistake to avoid:**  
Do not say Express automatically times out everything safely.

## 29. How would you handle 10 lakh vehicle tasks?

**Why interviewer may ask:**  
Scalability under large input.

**Student-level answer:**  
"The current in-memory DP approach would not be suitable for that scale."

**Strong follow-up answer:**  
"I would not load everything blindly. I would paginate/filter upstream data, preselect eligible tasks, use database-backed processing if stored, consider greedy/approximation depending on business need, and run heavy work in background jobs."

**Mistake to avoid:**  
Do not say just add more RAM.

## 30. Why separate controller and service?

**Why interviewer may ask:**  
Code-structure fundamentals.

**Student-level answer:**  
"Controller handles HTTP request and response. Service handles external API calls or business logic."

**Strong follow-up answer:**  
"This makes code easier to test. For example, `scheduler.service.js` can be unit tested without Express, and controllers stay small."

**Mistake to avoid:**  
Do not say separation is only for folder cleanliness. It improves maintainability and testability.

## 31. Why is `axios` in dependencies if you used `fetch`?

**Why interviewer may ask:**  
They noticed unused dependencies.

**Student-level answer:**  
"I initially considered using axios, but finally used built-in `fetch`. So axios is unused and can be removed."

**Strong follow-up answer:**  
"Removing unused dependencies is better for smaller install size and lower maintenance/security surface."

**Mistake to avoid:**  
Do not claim axios is used when it is not.

## 32. What is your biggest weakness in this project?

**Why interviewer may ask:**  
They want honesty and ownership.

**Student-level answer:**  
"The biggest weakness is that I focused on implementation and manual testing, but I did not add automated tests and strong validation."

**Strong follow-up answer:**  
"If I had more time, my first improvements would be unit tests for algorithm functions, validation for external data and query params, and integration tests for the API routes."

**Mistake to avoid:**  
Do not give a fake weakness like "I worked too hard."

## 33. If I ask you to improve one file right now, which file and why?

**Why interviewer may ask:**  
They want prioritization.

**Student-level answer:**  
"I would improve `scheduler.service.js` because it contains the core business logic and needs stronger validation for depot capacity and task uniqueness depending on requirements."

**Strong follow-up answer:**  
"Second, I would improve `notification_app_be/server.js` by splitting route/controller/service and adding central error handling like the scheduler app."

**Mistake to avoid:**  
Do not choose a random file. Pick the file with highest business risk.

## 34. How would you add database persistence for schedules?

**Why interviewer may ask:**  
They want to connect your code to DB design.

**Student-level answer:**  
"I would create tables for schedule runs, depot schedules, and selected tasks. Each schedule run would store timestamp and input source."

**Strong follow-up answer:**  
"A simple schema could be `schedule_runs`, `depot_schedules`, and `schedule_tasks`. `depot_schedules` references a run, and `schedule_tasks` references depot schedule. I would index by `created_at` and `depot_id` for history queries."

**Mistake to avoid:**  
Do not force the notification schema onto the scheduler problem.

## 35. Why should passwords be hashed, even though your app has no passwords?

**Why interviewer may ask:**  
Security fundamentals around future auth.

**Student-level answer:**  
"If I add user login, passwords should never be stored as plain text. They should be hashed."

**Strong follow-up answer:**  
"I would use bcrypt or argon2 with salt. During login, I would compare the entered password with the stored hash. This protects users if the database is leaked."

**Mistake to avoid:**  
Do not say encryption and hashing are the same. Passwords should be hashed, not decrypted later.

## Final Strict Interviewer Advice

When you answer, be honest about what is implemented and what is only designed. The strongest pattern is:

```txt
Current implementation: ...
Limitation: ...
Production improvement: ...
```

That sounds much better than pretending the project is perfect.
