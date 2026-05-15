# Backend Interview Prep for Affordmed OA Project

This guide is based on the actual files in this repository. Use it as your interview revision sheet. The tone of the answers is intentionally fresher-friendly: honest, simple, and confident.

## 1. Full Project Understanding

### What Is In This Codebase

| Part | Main Purpose | Important Files |
|---|---|---|
| Vehicle maintenance scheduler | Fetch depots and vehicles from protected APIs, then generate optimized maintenance schedules | `vehicle_maintenance_scheduler/src/server.js`, `src/app.js`, `src/routes/schedule.routes.js`, `src/controllers/schedule.controller.js`, `src/services/externalApi.service.js`, `src/services/scheduler.service.js` |
| Notification priority backend | Fetch notifications from protected API and return top priority notifications | `notification_app_be/server.js`, `notification_app_be/priorityNotifications.js` |
| Logging middleware | Reusable `Log()` helper for sending logs to Affordmed logging API | `logging_middleware/index.js` |
| Notification system design | Written design for REST APIs, PostgreSQL schema, indexes, caching, queues, real-time delivery | `notification_system_design.md` |

### Tech Stack

| Technology | Used For | File Evidence |
|---|---|---|
| Node.js | Runtime | CommonJS files across project |
| Express.js | API server and routing | `vehicle_maintenance_scheduler/package.json`, `notification_app_be/package.json` |
| CORS | Allow frontend/API clients to call backend | `app.use(cors())` in both apps |
| dotenv | Load `.env` variables | `require("dotenv").config()` |
| Built-in `fetch` | Calling protected external APIs and log API | `externalApi.service.js`, `server.js`, `logging_middleware/index.js` |
| Nodemon | Dev server auto restart | `dev` script in package files |

Note: `axios` is listed in `vehicle_maintenance_scheduler/package.json`, but the actual code uses `fetch`, not `axios`.

### Architecture

The vehicle scheduler uses a simple layered backend structure:

```txt
Client/Postman
  -> Express app
  -> Route file
  -> Controller
  -> Service
  -> External Affordmed API
  -> Scheduler algorithm
  -> JSON response
```

Files:

- `src/server.js`: Loads env and starts server.
- `src/app.js`: Configures Express, CORS, JSON parsing, request logging, routes, 404 handler, error handler.
- `src/routes/schedule.routes.js`: Defines `/api/schedule`, `/api/depots`, `/api/vehicles`.
- `src/controllers/schedule.controller.js`: Handles request and response.
- `src/services/externalApi.service.js`: Fetches depots and vehicles from protected external API.
- `src/services/scheduler.service.js`: Normalizes input and runs the scheduling algorithm.
- `src/utils/asyncHandler.js`: Sends async errors to Express error middleware.

### Request-Response Flow: `/api/schedule`

1. Client calls `GET /api/schedule`.
2. `src/app.js` logs the incoming request.
3. `src/routes/schedule.routes.js` routes it to `getOptimizedSchedule`.
4. `asyncHandler` catches async errors.
5. Controller calls `fetchDepots()` and `fetchVehicles()`.
6. `externalApi.service.js` calls `${BASE_API_URL}/depots` and `${BASE_API_URL}/vehicles` with bearer token.
7. Controller passes data to `buildMaintenanceSchedule()`.
8. `scheduler.service.js` normalizes data and uses knapsack logic to select tasks.
9. Controller returns `200` with summary and schedules.
10. If any error occurs, Express error middleware returns `err.statusCode || 500`.

### API Endpoints

#### Vehicle Maintenance Scheduler

| Method | Endpoint | File | Purpose |
|---|---|---|---|
| GET | `/` | `vehicle_maintenance_scheduler/src/app.js` | Health check |
| GET | `/api/depots` | `schedule.routes.js`, `schedule.controller.js` | Return raw depots from external API |
| GET | `/api/vehicles` | `schedule.routes.js`, `schedule.controller.js` | Return raw vehicles from external API |
| GET | `/api/schedule` | `schedule.routes.js`, `schedule.controller.js` | Return optimized schedule |

#### Notification App

| Method | Endpoint | File | Purpose |
|---|---|---|---|
| GET | `/` | `notification_app_be/server.js` | Health check |
| GET | `/api/notifications` | `notification_app_be/server.js` | Return raw notifications |
| GET | `/api/priority-notifications?limit=10` | `notification_app_be/server.js` | Return top priority notifications |

### Database Models / Schema

Important honest answer:

> In the runnable backend code, I have not connected a database. The vehicle scheduler fetches data from protected external APIs. For the notification system design, I proposed PostgreSQL tables in `notification_system_design.md`.

Proposed schema in design doc:

- `students`: student profile data.
- `notifications`: notification data per student.
- `notification_batches`: batch metadata when one message is sent to many students.
- `notification_delivery_status`: delivery tracking for email/push retries.

Important proposed indexes:

- `(student_id, is_read, created_at DESC)` for unread notifications.
- `(student_id, created_at DESC)` for student history.
- `(notification_type, created_at DESC, student_id)` for placement notifications in recent days.

### External APIs / Services

| Service | Used In | Purpose |
|---|---|---|
| Protected base API | `externalApi.service.js`, `notification_app_be/server.js` | Fetch depots, vehicles, notifications |
| Logging API | `logging_middleware/index.js` | Send structured logs |

Environment variables:

- `BASE_API_URL`
- `ACCESS_TOKEN`
- `LOG_API_URL`
- `PORT`

### Authentication / Authorization

There is no user login or role-based authorization in this project. The backend itself uses a bearer token from `.env` to call the protected external APIs.

Interview answer:

> Authentication is not implemented for end users. Since this was an OA task, I focused on calling the provided protected APIs using an access token. If I had more time, I would add JWT-based authentication middleware, protect routes, and use role-based access for admin-level operations.

### Error Handling

Vehicle scheduler:

- Uses `asyncHandler` to catch async route errors.
- Uses central error middleware in `src/app.js`.
- Returns 404 for unknown routes.
- Throws custom errors with `statusCode` in services.

Notification app:

- Uses `try/catch` inside route handlers.
- Returns 500 on failures.
- Has 404 handler.

### Validation

Implemented validation is basic:

- Scheduler checks `depots` and `vehicles` are arrays.
- Vehicle tasks are filtered if task ID is missing, duration/impact are invalid, duration is not positive, or impact is negative.
- External API response format is checked.
- Notification priority function checks notifications array.

Not implemented:

- Joi/Zod/express-validator.
- Strict query validation for `limit`.
- Request body validation, because the runnable APIs are mostly GET endpoints.

### How To Run

Vehicle scheduler:

```bash
cd vehicle_maintenance_scheduler
npm install
npm run dev
```

or:

```bash
npm start
```

Notification backend:

```bash
cd notification_app_be
npm install
npm run dev
```

Required `.env` keys:

```txt
LOG_API_URL=<logging api url>
BASE_API_URL=<protected base api url>
ACCESS_TOKEN=<access token>
PORT=<port number>
```

## 2. Interview Questions And Answers

### A. Project Overview Questions

| Question | Short Answer | Stronger Follow-up |
|---|---|---|
| Explain your project. | I built a Node.js Express backend that fetches depot and vehicle task data from protected APIs and generates an optimized maintenance schedule. | The main scheduling logic is in `scheduler.service.js`, where I normalize depot and vehicle data and use a knapsack-style dynamic programming approach to maximize impact within available mechanic hours. |
| What problem does it solve? | It helps decide which vehicle maintenance tasks should be selected for each depot based on limited mechanic hours. | It is useful when there are more maintenance tasks than available capacity, so we need to choose the most impactful tasks first. |
| What tech stack did you use and why? | I used Node.js, Express, dotenv, CORS, and JavaScript because they are simple for REST APIs and fast to develop for an OA task. | Express helped me separate routes, controllers, and services. dotenv helped keep tokens and URLs outside the code. |
| Explain the architecture. | The request goes from Express route to controller, then service, then external API or algorithm, and finally returns JSON. | This separation keeps routing, request handling, external API calls, and business logic in separate files. |
| What was your role? | I designed and implemented the backend API, the scheduling logic, external API integration, and logging calls. | I also prepared a notification system design document with APIs, schema, indexes, caching, and scaling ideas. |
| What challenge did you face? | The main challenge was converting the optimization requirement into code and handling external API responses safely. | I solved it by normalizing inputs and using dynamic programming for task selection. |

### B. API And Routing Questions

| Question | Short Answer | Stronger Follow-up |
|---|---|---|
| Explain all endpoints. | In scheduler, `/` is health check, `/api/depots` returns raw depots, `/api/vehicles` returns raw vehicles, and `/api/schedule` returns optimized schedules. | In notification app, `/api/notifications` returns raw notifications and `/api/priority-notifications` returns sorted top priority notifications. |
| Why GET? | I used GET because these endpoints only read or compute data and do not modify server state. | If I added create/update/delete operations, I would use POST, PATCH, or DELETE accordingly. |
| What status codes are used? | `200` for success, `404` for unknown route, `400` for invalid scheduler input, `500` for server config errors, and `502` for invalid upstream response. | The notification app currently returns 500 for most caught errors, which I would improve by preserving proper status codes. |
| What happens on `/api/schedule`? | It fetches depots and vehicles, builds schedules, and returns summary plus depot-wise selected tasks. | The controller is `getOptimizedSchedule` in `schedule.controller.js`. |
| How do you handle invalid input? | In scheduler service, I check if depots and vehicles are arrays, and I filter invalid vehicle tasks. | I would add Joi or Zod for stronger validation if request body input was added. |
| What if DB is down? | There is no DB in runnable code. If external API is down, the service throws an error and error middleware returns failure JSON. | In a DB-backed version, I would return 503, log the error, and use retry or fallback if possible. |

### C. Database Questions

| Question | Short Answer | Stronger Follow-up |
|---|---|---|
| Explain your DB schema. | The runnable code has no database. In the design doc, I proposed PostgreSQL with students, notifications, batches, and delivery status tables. | This schema supports per-student notifications, read/unread state, batch sends, and retry tracking. |
| Why PostgreSQL? | Notifications are structured data, so PostgreSQL is good for filtering, sorting, indexes, and transactions. | It supports composite indexes like `(student_id, is_read, created_at DESC)`, which directly matches unread notification queries. |
| Primary and foreign keys? | `students.id` is primary key. `notifications.student_id` references students. Delivery status references notifications and students. | This preserves data integrity and avoids orphan notification records. |
| What indexes would you add? | For notification queries, I would add indexes on student ID, read status, and created time. | Example: `student_id, is_read, created_at DESC` for unread notifications sorted newest first. |
| How handle 1 lakh records? | Use pagination, indexes, avoid returning all rows, and cache counts if needed. | For millions of rows, I would also consider archiving old records and read replicas. |

### D. Authentication And Security Questions

| Question | Short Answer | Stronger Follow-up |
|---|---|---|
| Is auth implemented? | User authentication is not implemented. The app uses bearer token from `.env` for calling protected external APIs. | I would add JWT middleware to protect APIs if this became a real product. |
| What is JWT? | JWT is a signed token that carries user identity and claims. The server verifies it before allowing protected actions. | I would store only non-sensitive data in JWT and keep secrets in environment variables. |
| Why hash passwords? | Plain passwords should never be stored. Hashing protects users even if database is leaked. | bcrypt is commonly used because it is slow by design and includes salt support. |
| What is CORS? | CORS controls which frontend origins can access backend APIs from the browser. | In my code I used `cors()` openly; in production I would restrict it to known frontend domains. |
| Why `.env`? | Secrets like access tokens and API URLs should not be hardcoded. | `.gitignore` already ignores `.env`, which is good. I would add `.env.example` for documentation. |

### E. Code Structure Questions

| Question | Short Answer | Stronger Follow-up |
|---|---|---|
| Why this folder structure? | I separated routes, controllers, services, and utilities to keep responsibilities clear. | Routes define URLs, controllers handle HTTP, services contain business logic and external API calls. |
| Where is business logic? | The main scheduling business logic is in `scheduler.service.js`. | External API logic is in `externalApi.service.js`, so controller stays simple. |
| How improve modularity? | I would split validation into a separate file and add config handling in a dedicated config module. | For notification app, I would separate routes, controllers, and services like the scheduler app. |
| What standards followed? | I used clear function names, small files, consistent JSON responses, and CommonJS modules. | I also used async error handling in scheduler to avoid repeating try/catch. |

### F. Error Handling And Debugging Questions

| Question | Short Answer | Stronger Follow-up |
|---|---|---|
| How handle server errors? | In scheduler, errors go to central error middleware in `app.js`, which logs and returns JSON. | In notification app, I used try/catch in each route, but I would improve it with shared error middleware. |
| 400 vs 401 vs 403 vs 404 vs 500? | 400 bad input, 401 not logged in, 403 no permission, 404 not found, 500 server error. | For upstream bad response, 502 is suitable because our backend depends on another service. |
| How debug? | I used API screenshots/Postman style testing, logs, and checked server responses. | I would add structured logs with request ID in production. |
| Edge cases considered? | Missing env variables, invalid external response format, invalid task duration/impact, invalid notification timestamp. | More edge cases should be added for limit validation and empty data. |

### G. Scalability And Performance Questions

| Question | Short Answer | Stronger Follow-up |
|---|---|---|
| How handle more users? | Run multiple backend instances, add load balancer, cache repeated reads, and optimize database queries. | For scheduler, caching external depot/vehicle data could reduce repeated API calls. |
| Bottlenecks? | External API latency, scheduling DP memory/time, and logging API latency can be bottlenecks. | `solveKnapsack` uses `O(n * capacity)` time and memory. |
| What is caching? | Caching stores frequently used data temporarily so repeated requests are faster. | Redis could cache unread notification counts or recent notifications. |
| Rate limiting? | Rate limiting restricts too many requests from one user/IP. | I would add `express-rate-limit` for public APIs. |
| Concurrent requests? | Node handles many I/O requests asynchronously, but CPU-heavy work can block the event loop. | If scheduling becomes heavy, I would move it to worker threads or background jobs. |

### H. Deployment And Production Questions

| Question | Short Answer | Stronger Follow-up |
|---|---|---|
| How deploy? | I would deploy the Node app on Render, Railway, AWS EC2, or a container platform. | I would set env variables in the hosting dashboard and run `npm start`. |
| Production changes? | Restrict CORS, add auth, validation, rate limiting, monitoring, better logs, and tests. | I would also use process manager like PM2 or Docker depending on deployment. |
| Monitor errors? | Use logs, health checks, uptime monitoring, and maybe Sentry for exceptions. | Add request IDs so each error can be traced across services. |
| Connect frontend/backend? | Frontend calls deployed backend URL and backend enables CORS for that frontend domain. | Secrets remain only on backend, never in frontend. |

### I. Testing Questions

| Question | Short Answer | Stronger Follow-up |
|---|---|---|
| How did you test? | I tested APIs manually using request/response screenshots and by checking successful JSON output. | I also ran syntax checks with `node --check` while reviewing. |
| Test cases? | Health route, raw depots, raw vehicles, schedule generation, missing env, invalid external format, and empty arrays. | For priority notifications: valid timestamp, invalid timestamp, type priority, limit query. |
| Unit tests? | I would unit test `solveKnapsack`, `buildMaintenanceSchedule`, and `getTopPriorityNotifications`. | These functions are good for unit tests because they are mostly pure logic. |
| Integration tests? | I would mock external APIs and call Express routes using Supertest. | That would verify route-controller-service flow. |

### J. Improvement Questions

| Question | Short Answer | Stronger Follow-up |
|---|---|---|
| What improve? | Add tests, stronger validation, auth, rate limiting, README, `.env.example`, and better error handling in notification app. | For scheduler, I would also cache external API calls and prevent duplicate task selection across depots if business rules require it. |
| Limitations? | No database, no user auth, no automated tests, and external API dependency. | The current scheduler optimizes each depot independently, not globally across all depots. |
| Security improvements? | Restrict CORS, validate all inputs, protect routes, rotate tokens, and avoid logging sensitive data. | Use helmet and rate limiting in production. |

### K. HR + Technical Mix Questions

| Question | Short Answer | Stronger Follow-up |
|---|---|---|
| What did you learn? | I learned how to structure Express APIs, integrate protected APIs, handle errors, and think about scalability. | I also learned how indexes and caching matter when notification data grows. |
| Difficult part? | The scheduling algorithm and external API error handling were the most challenging. | I broke it into smaller functions: normalize, validate, solve, and format response. |
| Backend weakness? | I am still improving in production-level topics like monitoring and advanced scaling. | But I understand the basics and I am comfortable learning by building and debugging. |
| Why hire you? | I am comfortable with backend fundamentals, I learn quickly, and I can honestly debug and improve my work. | This project shows I can build APIs, integrate services, and explain design tradeoffs. |
| Production bug? | I would first reproduce or check logs, identify impact, apply a safe fix or rollback, and communicate clearly. | After fixing, I would add a test or monitoring to prevent the same issue. |

## 3. Top 25 Most Likely Questions From My Exact Project

| # | Question | Best Answer | File / Code Part | Next Ask | Follow-up Answer |
|---|---|---|---|---|---|
| 1 | Explain `/api/schedule`. | It fetches depots and vehicles, then builds optimized schedules per depot. | `schedule.routes.js`, `schedule.controller.js` | How optimized? | By maximizing task impact within mechanic hours using knapsack DP. |
| 2 | Why did you use GET for schedule? | It does not modify data, it only fetches and computes a response. | `schedule.routes.js` | Is computation okay in GET? | For this OA yes, but if it became long-running I would use POST job creation. |
| 3 | What does `asyncHandler` do? | It catches promise rejections and passes them to Express error middleware. | `utils/asyncHandler.js` | Why needed? | Without it, async errors may not be handled cleanly in every route. |
| 4 | Explain `buildMaintenanceSchedule`. | It validates arrays, normalizes fields, filters valid tasks, runs knapsack for each depot, and returns summary. | `scheduler.service.js` | What are invalid tasks? | Missing taskId, non-integer duration/impact, duration <= 0, impact < 0. |
| 5 | What is knapsack here? | It selects tasks with maximum impact while staying within mechanic hour capacity. | `solveKnapsack` | Complexity? | Time and memory are `O(numberOfTasks * capacity)`. |
| 6 | What is depot capacity? | `MechanicHours` from external API, converted to number. | `normalizeDepot` | What if invalid? | Currently not strongly checked; I would add validation for positive integer capacity. |
| 7 | What external APIs are used? | `/depots`, `/vehicles`, and `/notifications` under `BASE_API_URL`. | `externalApi.service.js`, `notification_app_be/server.js` | How auth? | Bearer token from `ACCESS_TOKEN`. |
| 8 | What happens if `BASE_API_URL` is missing? | Service logs fatal config error and throws 500. | `externalApi.service.js` | Better response? | 500 is okay for server config; do not expose secret details. |
| 9 | What happens if access token is missing? | It logs fatal auth error and throws 500. | `externalApi.service.js` | Is this user auth? | No, it is backend-to-external-service auth. |
| 10 | Why no database? | The task data is fetched from provided APIs, so this backend acts as an integration and processing service. | Whole scheduler app | If asked DB? | I would persist schedules/history if product requirements needed it. |
| 11 | Explain logging middleware. | `Log()` validates stack, level, package, message, then POSTs to logging API. | `logging_middleware/index.js` | What if logging fails? | It returns failure but does not crash main app. |
| 12 | Why central error middleware? | It keeps error response format consistent and avoids repeated try/catch. | `app.js` | Is notification app same? | No, notification app uses route-level try/catch; I would refactor it. |
| 13 | What is CORS doing? | It allows browser clients from other origins to access APIs. | `app.js`, `notification_app_be/server.js` | Production? | Restrict to allowed frontend origins. |
| 14 | Why dotenv? | To keep config like URLs and tokens outside source code. | `server.js`, `.env` keys | Is `.env` committed? | No, `.gitignore` ignores `.env`. |
| 15 | What is `/api/depots`? | It returns raw depots from external API with count. | `getRawDepots` | Why expose raw data? | Useful for debugging and proving external integration works. |
| 16 | What is `/api/vehicles`? | It returns raw vehicles from external API with count. | `getRawVehicles` | Any validation? | External response is checked to contain `vehicles` array. |
| 17 | Explain priority notifications. | It adds score based on type weight plus recency, sorts descending, and returns top N. | `priorityNotifications.js` | Type order? | Placement 300, Result 200, Event 100. |
| 18 | What if timestamp is invalid? | Recency score becomes 0. | `getRecencyScore` | Why? | It avoids crashing and still allows type weight to work. |
| 19 | How does `limit` work? | Query `limit` is converted to number or defaults to 10. | `notification_app_be/server.js` | Weakness? | It does not restrict negative or very large values; I would validate it. |
| 20 | What status for unknown route? | 404 with `{ success:false, message:"Route not found" }`. | `app.js`, notification `server.js` | Why 404? | The route does not exist. |
| 21 | What if external API returns wrong shape? | Scheduler throws 502 invalid response format. | `fetchDepots`, `fetchVehicles` | Why 502? | Because the upstream service returned unexpected data. |
| 22 | How would you test algorithm? | Unit test `solveKnapsack` with known tasks and capacity. | `scheduler.service.js` | Example? | Capacity 5, tasks 2/10 and 3/20 should choose both. |
| 23 | Can same task be assigned to multiple depots? | Currently yes, because each depot optimizes independently using same task list. | `buildMaintenanceSchedule` | Is it wrong? | Depends on requirement; if tasks are globally unique, I would track assigned tasks. |
| 24 | Why include screenshots? | They show API outputs from manual testing. | `screenshots/` folders | Are screenshots tests? | No, automated tests are still needed. |
| 25 | Explain design doc DB indexes. | It recommends composite indexes matching unread and recent notification queries. | `notification_system_design.md` | Why not index every column? | Indexes consume storage and slow writes, so add only for query patterns. |

## 4. Weak Points In My Project And How To Defend Them

| Weak Point | Issue | Honest Interview Defense | Quick Improvement |
|---|---|---|---|
| No user auth | APIs are open to callers. | "For the OA I focused on protected external API integration. User auth was not part of my implementation." | Add JWT middleware placeholder and protect `/api/*`. |
| No DB in runnable code | Data is not persisted. | "The scheduler receives data from external APIs and computes response. I would add DB only if schedule history or user data was required." | Add README explaining no DB dependency. |
| Basic validation | No Joi/Zod. | "I did basic validation manually and filtered invalid tasks. I would use schema validation in production." | Add validation functions for `limit`, depot capacity, env config. |
| No automated tests | Only manual/API screenshot style testing. | "I tested manually due to OA time. The logic functions are easy to unit test next." | Add Jest tests for `solveKnapsack` and `getTopPriorityNotifications`. |
| Notification app less modular | All server logic is in one file. | "The scheduler app is structured better. I would refactor notification app similarly." | Create routes/controllers/services folders. |
| Open CORS | `cors()` allows all origins. | "Fine for testing, but production should restrict frontend origins." | Use `cors({ origin: process.env.FRONTEND_URL })`. |
| No rate limiting | APIs can be spammed. | "Not implemented in OA, but important for production." | Add `express-rate-limit`. |
| Logging waits on API | Each request awaits logging call. | "I used provided logging API directly, but async fire-and-forget or queue would reduce latency." | Do not block request on non-critical logs. |
| No README for main apps | Setup is not documented except package scripts. | "I can improve documentation quickly." | Add README with env keys and endpoints. |
| `axios` unused | Dependency listed but not used. | "I initially considered axios but used built-in fetch. I can remove unused dependency." | Remove `axios` from scheduler package. |
| Scheduler duplicates tasks across depots | Same task may appear in multiple depot schedules. | "Current logic optimizes each depot independently. If task assignment must be unique globally, I would track selected tasks across depots." | Add global assigned task set if requirement says unique tasks. |
| No timeout for external fetch | External API can hang. | "I would add `AbortController` timeout in production." | Wrap `fetch` with timeout helper. |
| No pagination | Raw endpoints return all data from external API. | "For OA dataset it was okay; for large data I would paginate or stream." | Add `limit`/`page` if supported by upstream API. |

## 5. 2-Minute Project Explanation

"My project is a backend built with Node.js and Express. The main part is a vehicle maintenance scheduler. It exposes APIs like `/api/depots`, `/api/vehicles`, and `/api/schedule`. The backend does not store data in its own database. Instead, it uses `BASE_API_URL` and `ACCESS_TOKEN` from `.env` to fetch depot and vehicle data from protected external APIs.

The request first reaches `app.js`, then goes to `schedule.routes.js`, then the controller in `schedule.controller.js`. The controller calls service functions to fetch external data and then sends it to `buildMaintenanceSchedule` in `scheduler.service.js`.

The scheduling logic uses a knapsack-style dynamic programming approach. Each depot has limited mechanic hours, and each vehicle task has duration and impact. The goal is to select tasks that give maximum total impact without exceeding the depot's mechanic hours. I also added basic validation, error handling middleware, and a reusable logging middleware that sends logs to a protected logging API.

There is also a notification priority service where I fetch notifications from an external API and rank them using type weight and recency. I also wrote a design document for a full notification system with PostgreSQL schema, indexes, caching, queues, and real-time updates."

## 6. 5-Minute Project Explanation

"I submitted a backend project mainly focused on API integration and backend logic. It has three parts: vehicle maintenance scheduler, notification priority backend, and reusable logging middleware.

In the vehicle scheduler, I used Node.js and Express. The entry file is `src/server.js`, which loads environment variables and starts the server. The Express app is configured in `src/app.js`, where I added CORS, JSON parsing, request logging, health route, scheduler routes, 404 handling, and central error middleware.

The routes are defined in `src/routes/schedule.routes.js`. There are three main APIs: `/api/depots`, `/api/vehicles`, and `/api/schedule`. The first two return raw data from external APIs. The third one generates the optimized maintenance schedule.

The controller file, `schedule.controller.js`, is responsible for handling the HTTP request and response. It calls `fetchDepots` and `fetchVehicles` from `externalApi.service.js`. That service reads `BASE_API_URL` and `ACCESS_TOKEN` from `.env`, sends GET requests to the protected APIs, checks the response format, and throws proper errors if something is wrong.

After getting depots and vehicles, the controller calls `buildMaintenanceSchedule` from `scheduler.service.js`. This service normalizes external API fields like `ID`, `MechanicHours`, `TaskID`, `Duration`, and `Impact`. It filters invalid tasks. Then for every depot, it calls `solveKnapsack`, which is a dynamic programming solution. Capacity is mechanic hours, duration is task cost, and impact is value. The output includes selected tasks, used hours, unused hours, and total impact.

For error handling, I used `asyncHandler` so async route errors are passed to central error middleware. Unknown routes return 404. Missing env variables and bad upstream responses are handled with meaningful errors. I also used a custom logging middleware from `logging_middleware/index.js`, which validates log fields and sends logs to the provided logging API.

The second runnable service is `notification_app_be`. It fetches notifications from the protected API and has an endpoint `/api/priority-notifications`. The priority algorithm is in `priorityNotifications.js`. It gives Placement notifications the highest weight, then Result, then Event, and adds a recency score. It sorts by score and timestamp and returns the top N.

The design document, `notification_system_design.md`, covers a bigger notification platform. I proposed REST endpoints, PostgreSQL schema, indexes, Redis caching, WebSocket/SSE, queues, retries, and scaling improvements. The runnable code is smaller, but the design document shows how I would build it for production."

## 7. Line-by-Line Interview Defense For Important Files

### `vehicle_maintenance_scheduler/src/server.js`

- Loads `.env` using `dotenv`.
- Imports Express app from `app.js`.
- Imports `Log` from reusable logging middleware.
- Reads `PORT` from env or defaults to `3000`.
- Starts server and logs startup.

Possible questions:

- Why separate `server.js` and `app.js`?
  - "It makes the Express app easier to test because app setup is separate from listening on a port."

### `vehicle_maintenance_scheduler/src/app.js`

- Creates Express app.
- Adds CORS and JSON body parsing.
- Adds request logging middleware.
- Adds health check route.
- Mounts scheduler routes under `/api`.
- Adds 404 handler.
- Adds central error handler.

Possible questions:

- Why central error handler?
  - "It keeps error responses consistent and avoids repeated try/catch in every route."

### `vehicle_maintenance_scheduler/src/routes/schedule.routes.js`

- Creates Express router.
- Imports controller functions.
- Wraps controller functions with `asyncHandler`.
- Defines:
  - `GET /schedule`
  - `GET /depots`
  - `GET /vehicles`

Possible questions:

- Why use router?
  - "It keeps route definitions separate from app configuration."

### `vehicle_maintenance_scheduler/src/controllers/schedule.controller.js`

- `getRawDepots`: fetches depots and returns count plus data.
- `getRawVehicles`: fetches vehicles and returns count plus data.
- `getOptimizedSchedule`: fetches depots and vehicles, builds schedule, returns summary and schedules.

Possible questions:

- Why controller does not contain algorithm?
  - "The controller should focus on HTTP request/response. Algorithm belongs in service layer."

### `vehicle_maintenance_scheduler/src/services/externalApi.service.js`

- `getAuthHeaders`: creates JSON and bearer token headers.
- `fetchFromProtectedApi`: checks env variables, calls external API, parses JSON, handles non-OK response.
- `fetchDepots`: calls `/depots` and validates `data.depots`.
- `fetchVehicles`: calls `/vehicles` and validates `data.vehicles`.

Possible questions:

- Why 502 for invalid response?
  - "Because our backend is okay, but the upstream response format is wrong for our expectation."

### `vehicle_maintenance_scheduler/src/services/scheduler.service.js`

- `normalizeDepot`: converts external depot format to internal format.
- `normalizeVehicle`: converts external vehicle task format to internal format.
- `validateInput`: checks arrays.
- `solveKnapsack`: dynamic programming algorithm.
- `buildMaintenanceSchedule`: validates, normalizes, filters tasks, runs schedule for each depot, returns summary.

Possible questions:

- What are duration and impact?
  - "Duration is the mechanic hours needed. Impact is the value or importance of completing that task."

### `vehicle_maintenance_scheduler/src/utils/asyncHandler.js`

- Accepts an async route handler.
- Wraps it in `Promise.resolve`.
- Calls `next(error)` on rejection.

Possible questions:

- Why not use try/catch everywhere?
  - "This helper avoids repetition and keeps routes cleaner."

### `notification_app_be/server.js`

- Loads env.
- Creates Express app.
- Defines `fetchNotifications`.
- Health route.
- Raw notifications route.
- Priority notifications route.
- 404 handler.
- Starts server.

Possible questions:

- What would you refactor?
  - "I would split it into routes, controllers, and services like the scheduler project."

### `notification_app_be/priorityNotifications.js`

- `getTypeWeight`: Placement 300, Result 200, Event 100.
- `getRecencyScore`: Newer notifications get higher score.
- `getPriorityScore`: type weight plus recency score.
- `getTopPriorityNotifications`: maps score, sorts, slices top N.

Possible questions:

- Why this scoring?
  - "It matches the requirement: Placement is most important, then Result, then Event, and recent messages should rank higher."

### `logging_middleware/index.js`

- Defines allowed stacks, levels, and package names.
- Validates log input.
- Reads `LOG_API_URL` and `ACCESS_TOKEN`.
- Sends POST request to logging API.
- Returns success/failure object.

Possible questions:

- What if log API fails?
  - "The `Log` function catches failure and returns an error object, so the app does not crash."

## 8. Backend Concepts To Revise Based On This Project

1. Express routing and middleware.
2. Difference between route, controller, service, utility.
3. HTTP methods and status codes.
4. REST API request-response cycle.
5. Environment variables and `.env`.
6. CORS.
7. Bearer token authorization for external APIs.
8. Error handling middleware in Express.
9. Async/await and promise error handling.
10. External API integration using `fetch`.
11. JSON parsing and response format.
12. Input validation.
13. Dynamic programming basics, especially 0/1 knapsack.
14. Time and space complexity.
15. SQL schema basics: primary key, foreign key, indexes.
16. PostgreSQL vs NoSQL at a basic level.
17. Composite indexes.
18. Pagination.
19. Caching and Redis basics.
20. Rate limiting.
21. Logging and monitoring.
22. JWT basics.
23. Password hashing and bcrypt basics.
24. Deployment basics for Node.js.
25. Unit testing and integration testing with Jest/Supertest.

## 9. Mock Interview: 20 Questions With Ideal Answers

1. Q: Can you explain your project briefly?
   A: I built an Express backend that fetches depot and vehicle maintenance data from protected APIs and generates optimized maintenance schedules using a knapsack-style algorithm.

2. Q: Why did you use Express?
   A: Express is lightweight and simple for REST APIs. It helped me define routes, middleware, and error handling quickly.

3. Q: What are your main endpoints?
   A: In scheduler, `/api/depots`, `/api/vehicles`, and `/api/schedule`. In notification app, `/api/notifications` and `/api/priority-notifications`.

4. Q: Explain request flow for `/api/schedule`.
   A: Request reaches `app.js`, goes to `schedule.routes.js`, then `getOptimizedSchedule`, then external API service, then scheduler service, and response is returned as JSON.

5. Q: What algorithm did you use?
   A: I used 0/1 knapsack dynamic programming to maximize impact within limited mechanic hours.

6. Q: What is the complexity?
   A: For each depot, it is `O(numberOfTasks * mechanicHours)` in time and memory.

7. Q: Is there a database?
   A: Not in the runnable scheduler. It fetches data from external APIs. The notification design document proposes PostgreSQL.

8. Q: How do you authenticate external API requests?
   A: I add `Authorization: Bearer <ACCESS_TOKEN>` header using token from `.env`.

9. Q: Is user authentication implemented?
   A: No. I would add JWT middleware if this were production.

10. Q: How are errors handled?
    A: Scheduler uses `asyncHandler` and central error middleware. Services throw errors with status codes.

11. Q: What if external API fails?
    A: The service throws an error, logs it, and the error middleware returns a failure response.

12. Q: Why use `.env`?
    A: To avoid hardcoding secrets and config like API URLs, tokens, and port.

13. Q: What is CORS?
    A: It controls browser access from different origins. I used it for development, but would restrict origins in production.

14. Q: What validation did you add?
    A: I check arrays, validate external response format, and filter tasks with invalid duration, impact, or task ID.

15. Q: What would you improve first?
    A: I would add automated tests, stronger validation, README, `.env.example`, and auth/rate limiting.

16. Q: How would you test this backend?
    A: Unit test pure functions like `solveKnapsack` and integration test routes using Supertest with mocked external APIs.

17. Q: How would it scale?
    A: Use multiple server instances, caching, timeouts, rate limiting, and for heavy computations use background workers.

18. Q: Explain notification priority.
    A: Priority score is type weight plus recency score. Placement has highest weight, then Result, then Event.

19. Q: Why not index every DB column?
    A: Indexes improve reads but slow writes and consume storage, so we index based on query patterns.

20. Q: What did you learn?
    A: I learned to structure Express code, integrate protected APIs, handle errors, think about optimization, and explain backend design tradeoffs.

## 10. Quick Answers For Common Status Code Follow-ups

| Code | Meaning | Project Context |
|---|---|---|
| 200 | Success | Health, raw data, schedule, notifications |
| 400 | Bad request | Invalid input like non-array depots/vehicles |
| 401 | Unauthenticated | Not implemented for users, would be used for missing/invalid JWT |
| 403 | Forbidden | Not implemented, would be used for insufficient role |
| 404 | Route not found | Unknown endpoint |
| 500 | Server error | Missing env/config or unexpected server issue |
| 502 | Bad gateway/upstream issue | External API returned invalid format |

## 11. One Honest Closing Line For Interview

"This project is not production-perfect, but I can clearly explain what I built, where the limitations are, and how I would improve it. My main focus was correct API flow, external API integration, error handling, and implementing the scheduling/priority logic cleanly."
