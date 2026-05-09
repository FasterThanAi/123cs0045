# Campus Notification System Design

This document describes the REST API design, database schema, scalability strategy, reliability improvements, and priority notification logic for a campus notification platform.

The platform allows students to receive real-time updates related to:

- Placements
- Events
- Results

---

# Stage 1

## Objective

Design REST API endpoints, request structures, response structures, headers, and real-time notification mechanism for a campus notification platform.

The frontend developer should be able to use this API contract to display notifications to logged-in students.

---

## Assumptions

1. Users are already authenticated and authorised.
2. A student can receive many notifications.
3. A notification can belong to one of these types:
   - Placement
   - Event
   - Result
4. Notifications can be read or unread.
5. Pagination is required because a student may have many notifications.
6. Real-time updates are required so students do not need to refresh the page.
7. In production, authentication can be handled using bearer tokens, but for this evaluation users are assumed to be pre-authorised.

---

## Common Headers

For JSON APIs:

```json
{
  "Content-Type": "application/json"
}
```

If authentication is used in production:

```json
{
  "Authorization": "Bearer <token>",
  "Content-Type": "application/json"
}
```

---

## Notification Object Structure

```json
{
  "id": "noti_001",
  "studentId": 101,
  "type": "Placement",
  "title": "Placement Drive",
  "message": "A new placement drive has been announced.",
  "isRead": false,
  "priority": "high",
  "createdAt": "2026-04-22T17:51:18Z"
}
```

| Field | Meaning |
|---|---|
| `id` | Unique ID of the notification |
| `studentId` | Student who receives the notification |
| `type` | Notification category: Placement, Event, or Result |
| `title` | Short heading of the notification |
| `message` | Main notification content |
| `isRead` | Whether the student has read the notification |
| `priority` | Priority level: low, normal, or high |
| `createdAt` | Time when the notification was created |

---

## 1. Create Notification

This API is used by admin, placement cell, or system service to create a notification for one or more students.

### Endpoint

```http
POST /api/notifications
```

### Request Headers

```json
{
  "Authorization": "Bearer <token>",
  "Content-Type": "application/json"
}
```

### Request Body

```json
{
  "studentIds": [101, 102, 103],
  "type": "Placement",
  "title": "Placement Drive",
  "message": "A new placement drive has been announced.",
  "priority": "high"
}
```

### Success Response

```json
{
  "success": true,
  "message": "Notification created successfully",
  "notificationId": "noti_001"
}
```

### Error Response

```json
{
  "success": false,
  "message": "studentIds, type, title and message are required"
}
```

---

## 2. Get Notifications for a Student

This API is used by the frontend to fetch notifications of a specific student.

### Endpoint

```http
GET /api/students/{studentId}/notifications
```

### Example Request

```http
GET /api/students/101/notifications?page=1&limit=20&type=Placement&isRead=false
```

### Request Headers

```json
{
  "Authorization": "Bearer <token>"
}
```

### Query Parameters

| Parameter | Required | Meaning |
|---|---|---|
| `page` | No | Page number |
| `limit` | No | Number of notifications per page |
| `type` | No | Filter by Placement, Event, or Result |
| `isRead` | No | Filter read or unread notifications |

### Success Response

```json
{
  "success": true,
  "studentId": 101,
  "page": 1,
  "limit": 20,
  "notifications": [
    {
      "id": "noti_001",
      "type": "Placement",
      "title": "Placement Drive",
      "message": "A new placement drive has been announced.",
      "isRead": false,
      "priority": "high",
      "createdAt": "2026-04-22T17:51:18Z"
    },
    {
      "id": "noti_002",
      "type": "Event",
      "title": "Tech Fest",
      "message": "Annual tech fest registration is open.",
      "isRead": true,
      "priority": "normal",
      "createdAt": "2026-04-21T10:20:00Z"
    }
  ]
}
```

### Error Response

```json
{
  "success": false,
  "message": "Student not found"
}
```

---

## 3. Get Unread Notifications

This API returns only unread notifications of a student.

### Endpoint

```http
GET /api/students/{studentId}/notifications/unread
```

### Example Request

```http
GET /api/students/101/notifications/unread
```

### Request Headers

```json
{
  "Authorization": "Bearer <token>"
}
```

### Success Response

```json
{
  "success": true,
  "studentId": 101,
  "notifications": [
    {
      "id": "noti_003",
      "type": "Result",
      "title": "Mid Semester Result",
      "message": "Mid semester result has been published.",
      "isRead": false,
      "priority": "normal",
      "createdAt": "2026-04-22T17:50:54Z"
    }
  ]
}
```

---

## 4. Get Unread Notification Count

This API is used by the frontend to show unread notification badge count.

### Endpoint

```http
GET /api/students/{studentId}/notifications/unread-count
```

### Example Request

```http
GET /api/students/101/notifications/unread-count
```

### Request Headers

```json
{
  "Authorization": "Bearer <token>"
}
```

### Success Response

```json
{
  "success": true,
  "studentId": 101,
  "unreadCount": 8
}
```

---

## 5. Mark One Notification as Read

This API marks a single notification as read for a student.

### Endpoint

```http
PATCH /api/students/{studentId}/notifications/{notificationId}/read
```

### Example Request

```http
PATCH /api/students/101/notifications/noti_001/read
```

### Request Headers

```json
{
  "Authorization": "Bearer <token>",
  "Content-Type": "application/json"
}
```

### Success Response

```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

### Error Response

```json
{
  "success": false,
  "message": "Notification not found"
}
```

---

## 6. Mark All Notifications as Read

This API marks all unread notifications of a student as read.

### Endpoint

```http
PATCH /api/students/{studentId}/notifications/read-all
```

### Example Request

```http
PATCH /api/students/101/notifications/read-all
```

### Request Headers

```json
{
  "Authorization": "Bearer <token>",
  "Content-Type": "application/json"
}
```

### Success Response

```json
{
  "success": true,
  "message": "All notifications marked as read"
}
```

---

## 7. Delete or Archive Notification

This API removes a notification from the student view.

In production, soft delete or archive is preferred instead of permanent deletion.

### Endpoint

```http
DELETE /api/students/{studentId}/notifications/{notificationId}
```

### Example Request

```http
DELETE /api/students/101/notifications/noti_001
```

### Request Headers

```json
{
  "Authorization": "Bearer <token>"
}
```

### Success Response

```json
{
  "success": true,
  "message": "Notification removed successfully"
}
```

### Error Response

```json
{
  "success": false,
  "message": "Notification not found"
}
```

---

## 8. Get Top Priority Notifications

This API returns the most important unread notifications first.

Priority can be based on notification type, recency, and importance level.

### Endpoint

```http
GET /api/students/{studentId}/notifications/priority
```

### Example Request

```http
GET /api/students/101/notifications/priority?limit=10
```

### Request Headers

```json
{
  "Authorization": "Bearer <token>"
}
```

### Success Response

```json
{
  "success": true,
  "studentId": 101,
  "notifications": [
    {
      "id": "noti_010",
      "type": "Placement",
      "title": "Urgent Placement Update",
      "message": "Interview shortlist has been released.",
      "isRead": false,
      "priority": "high",
      "priorityScore": 395,
      "createdAt": "2026-04-22T17:51:18Z"
    }
  ]
}
```

---

## Real-Time Notification Mechanism

The system should support real-time updates so students do not need to refresh the page.

Two possible approaches are:

1. WebSocket
2. Server-Sent Events

### WebSocket Event

```txt
notification:new
```

### Event Payload

```json
{
  "id": "noti_001",
  "studentId": 101,
  "type": "Placement",
  "title": "Placement Drive",
  "message": "A new placement drive has been announced.",
  "priority": "high",
  "createdAt": "2026-04-22T17:51:18Z"
}
```

### Real-Time Flow

1. Admin or placement cell creates a notification.
2. Backend stores the notification in the database.
3. Backend checks which students should receive it.
4. Backend emits a real-time event to connected students using WebSocket or SSE.
5. Frontend receives the event.
6. Frontend updates the notification badge and notification list instantly.

### Why Not Only Polling?

Repeated polling increases server and database load.

Real-time push is better because:

- Updates are instant
- Unnecessary API calls are reduced
- User experience is better
- Database load is reduced

### WebSocket vs SSE

| Feature | WebSocket | SSE |
|---|---|---|
| Communication | Two-way | Server to client only |
| Complexity | Higher | Lower |
| Best for | Chat, live collaboration, two-way events | Notifications and live feeds |

For this notification platform, SSE is enough if the backend only pushes notification updates. WebSocket is better if future two-way communication is needed.

---

## Stage 1 Summary

Stage 1 provides a clear API contract between frontend and backend.

Main supported actions:

1. Create notification
2. Fetch notifications
3. Fetch unread notifications
4. Fetch unread count
5. Mark one notification as read
6. Mark all notifications as read
7. Delete or archive notification
8. Fetch priority notifications
9. Deliver real-time updates

---

# Stage 2

## Objective

The goal of this stage is to select persistent storage, explain the database choice, design the schema, discuss possible scaling issues, and write queries based on the REST APIs designed in Stage 1.

---

## Recommended Database

The recommended database is PostgreSQL.

---

## Why PostgreSQL?

PostgreSQL is suitable because notification data is structured and the system needs reliable filtering, sorting, indexing, and transactional consistency.

The platform requires frequent queries such as:

```sql
SELECT id, notification_type, title, message, created_at
FROM notifications
WHERE student_id = 101
AND is_read = false
ORDER BY created_at DESC;
```

PostgreSQL is a good choice because it supports:

- Relational schema
- Strong consistency
- Transactions
- Composite indexes
- Efficient filtering and sorting
- SQL analytics
- Reliable data integrity

---

## Database Schema

### students Table

```sql
CREATE TABLE students (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    department VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### notifications Table

```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES students(id),
    notification_type VARCHAR(30) NOT NULL CHECK (
        notification_type IN ('Event', 'Result', 'Placement')
    ),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    priority VARCHAR(20) DEFAULT 'normal',
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### notification_batches Table

This table is useful when one notification is sent to many students.

```sql
CREATE TABLE notification_batches (
    id UUID PRIMARY KEY,
    notification_type VARCHAR(30) NOT NULL CHECK (
        notification_type IN ('Event', 'Result', 'Placement')
    ),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### notification_delivery_status Table

This table tracks email and push delivery status.

```sql
CREATE TABLE notification_delivery_status (
    id BIGSERIAL PRIMARY KEY,
    notification_id UUID NOT NULL REFERENCES notifications(id),
    student_id BIGINT NOT NULL REFERENCES students(id),
    email_status VARCHAR(30) DEFAULT 'pending',
    push_status VARCHAR(30) DEFAULT 'pending',
    retry_count INT DEFAULT 0,
    last_error TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Important Indexes

### Index for unread notification query

```sql
CREATE INDEX idx_notifications_student_read_created
ON notifications (student_id, is_read, created_at DESC);
```

### Index for notification type query

```sql
CREATE INDEX idx_notifications_type_created
ON notifications (notification_type, created_at DESC);
```

### Index for student notification history

```sql
CREATE INDEX idx_notifications_student_created
ON notifications (student_id, created_at DESC);
```

### Index for placement notifications in recent days

```sql
CREATE INDEX idx_notifications_type_created_student
ON notifications (notification_type, created_at DESC, student_id);
```

---

## Example SQL Queries

### Insert Notification

```sql
INSERT INTO notifications (
    id,
    student_id,
    notification_type,
    title,
    message,
    is_read,
    priority
)
VALUES (
    gen_random_uuid(),
    101,
    'Placement',
    'Placement Drive',
    'A new placement drive has been announced.',
    false,
    'high'
);
```

---

### Fetch Notifications for Student

```sql
SELECT id, notification_type, title, message, is_read, priority, created_at
FROM notifications
WHERE student_id = 101
AND is_archived = false
ORDER BY created_at DESC
LIMIT 20 OFFSET 0;
```

---

### Fetch Unread Notifications

```sql
SELECT id, notification_type, title, message, created_at
FROM notifications
WHERE student_id = 101
AND is_read = false
AND is_archived = false
ORDER BY created_at DESC
LIMIT 20;
```

---

### Get Unread Count

```sql
SELECT COUNT(*) AS unread_count
FROM notifications
WHERE student_id = 101
AND is_read = false
AND is_archived = false;
```

---

### Mark One Notification as Read

```sql
UPDATE notifications
SET is_read = true
WHERE student_id = 101
AND id = 'noti_001';
```

---

### Mark All Notifications as Read

```sql
UPDATE notifications
SET is_read = true
WHERE student_id = 101
AND is_read = false;
```

---

### Archive Notification

```sql
UPDATE notifications
SET is_archived = true
WHERE student_id = 101
AND id = 'noti_001';
```

---

## Problems as Data Volume Increases

When the system grows to 50,000 students and millions of notifications, these issues can occur:

1. Slow unread notification queries
2. Slow ordering by created_at
3. Large table scans
4. Expensive count queries
5. High database load on page refresh
6. Slow bulk notification inserts
7. Increasing storage cost
8. Locking or write pressure during placement season

---

## Solutions

1. Use proper composite indexes.
2. Use pagination instead of returning all rows.
3. Cache unread count in Redis.
4. Archive old notifications.
5. Partition large notification tables by date.
6. Use queue-based workers for bulk notification delivery.
7. Use read replicas for read-heavy queries.
8. Avoid `SELECT *` in production APIs.

---

# Stage 3

## Given Query

```sql
SELECT *
FROM notifications
WHERE studentId = 1042
AND isRead = false
ORDER BY createdAt DESC;
```

---

## Is the Query Accurate?

The query is logically correct because it fetches unread notifications for one student and orders the latest notifications first.

However, it is not ideal for production because:

1. It uses `SELECT *`.
2. It does not use `LIMIT`.
3. It may be slow without a composite index.
4. It may return unnecessary columns.
5. It may scan and sort too many rows when the table grows.

---

## Why is this Query Slow?

The database has 50,000 students and 5,000,000 notifications.

Without a proper index, the database may need to:

1. Scan a large number of rows.
2. Filter rows by studentId.
3. Filter unread notifications.
4. Sort results by createdAt.

This becomes expensive as data grows.

---

## Improved Query

```sql
SELECT id, notification_type, title, message, created_at
FROM notifications
WHERE student_id = 1042
AND is_read = false
AND is_archived = false
ORDER BY created_at DESC
LIMIT 20;
```

---

## Recommended Index

```sql
CREATE INDEX idx_notifications_student_read_created
ON notifications (student_id, is_read, created_at DESC);
```

This index helps the database filter by student_id and is_read, and also return rows in created_at order.

---

## Likely Computation Cost

Without index:

```txt
O(N log N)
```

The database may scan many rows and then sort them.

With proper composite index:

```txt
O(log N + K)
```

Where:

- N = number of indexed rows
- K = number of returned rows

Since the query uses `LIMIT 20`, only a small number of rows are returned.

---

## Should We Add Indexes on Every Column?

No.

Adding indexes on every column is not effective because:

1. Indexes consume disk space.
2. Inserts become slower.
3. Updates become slower.
4. Many indexes may not be used.
5. Database maintenance cost increases.

Indexes should be created based on actual query patterns.

---

## Query to Find Students Who Got Placement Notification in Last 7 Days

```sql
SELECT DISTINCT student_id
FROM notifications
WHERE notification_type = 'Placement'
AND created_at >= NOW() - INTERVAL '7 days';
```

Recommended index:

```sql
CREATE INDEX idx_notifications_type_created_student
ON notifications (notification_type, created_at DESC, student_id);
```

---

# Stage 4

## Problem

Notifications are fetched on every page load for every student. This causes high database load and poor user experience.

If every student fetches notifications repeatedly, the database gets overwhelmed.

---

## Suggested Solutions

### 1. Redis Cache

Store frequently accessed notification data in Redis.

Example keys:

```txt
student:1042:unread_count
student:1042:recent_notifications
```

Benefits:

- Very fast reads
- Reduces database load
- Good for unread count and recent notifications

Tradeoff:

- Cache invalidation must be handled carefully

---

### 2. Pagination

Do not fetch all notifications at once.

Use:

```http
GET /api/students/1042/notifications?page=1&limit=20
```

Benefits:

- Smaller response size
- Faster queries
- Better frontend performance

Tradeoff:

- Frontend must handle pagination or infinite scroll

---

### 3. WebSocket or Server-Sent Events

Instead of fetching notifications repeatedly on page load, use real-time push.

Flow:

1. Student connects to WebSocket/SSE.
2. New notification is created.
3. Server pushes notification event to connected student.
4. Frontend updates notification list immediately.

Benefits:

- Reduces repeated polling
- Real-time updates
- Better user experience

Tradeoff:

- Needs connection management

---

### 4. Read Replica

Use read replicas for notification read queries.

Benefits:

- Reduces load on primary database
- Improves read scalability

Tradeoff:

- Replication delay can cause slightly stale reads

---

### 5. Archive Old Notifications

Move old notifications to archive tables.

Example:

```sql
CREATE TABLE archived_notifications AS
SELECT *
FROM notifications
WHERE created_at < NOW() - INTERVAL '6 months';
```

Benefits:

- Smaller active table
- Faster active queries

Tradeoff:

- Archived data needs separate query path

---

## Recommended Combined Approach

Use:

- PostgreSQL for permanent storage
- Redis for unread count and recent notifications
- WebSocket/SSE for real-time updates
- Pagination for notification history
- Queue workers for bulk delivery
- Archiving for old notifications

This provides good performance and reliability.

---

# Stage 5

## Problem

During placement season, the HR clicks "Notify All" and 50,000 students should receive email and in-app notifications simultaneously.

Given pseudocode:

```txt
function notify_all(student_ids: array, message: string):
    for student_id in student_ids:
        send_email(student_id, message)
        save_to_db(student_id, message)
        push_to_app(student_id, message)
```

---

## Shortcomings

This implementation has many issues:

1. It is sequential and slow.
2. A single API request may timeout.
3. If email fails midway, remaining students may not receive notifications.
4. Email sending and DB saving are tightly coupled.
5. No retry mechanism exists.
6. No failure tracking exists.
7. No batching is used.
8. No queue is used.
9. Duplicate notifications can happen during retry.
10. Partial success is not handled clearly.

---

## If Email Failed for 200 Students Midway

The failed email deliveries should not stop the whole process.

The system should:

1. Store failed student IDs.
2. Mark their delivery status as failed.
3. Retry email sending asynchronously.
4. Avoid duplicate notification creation.
5. Continue processing other students.

---

## Should DB Save and Email Sending Happen Together?

No.

The database save should happen first because it is the source of truth.

Email sending and in-app push should happen asynchronously through queues.

This makes the system reliable and fast.

---

## Improved Design

Use:

- API server
- PostgreSQL
- Message queue
- Worker service
- Email provider
- WebSocket/SSE service
- Retry queue

---

## Revised Pseudocode

```txt
function notify_all(student_ids, message, type):
    batch_id = create_notification_batch(type, message)

    for chunk in split(student_ids, 1000):
        save_notifications_to_db(chunk, message, type, batch_id)

        publish_queue_job("SEND_NOTIFICATION", {
            batch_id: batch_id,
            student_ids: chunk,
            message: message,
            type: type
        })

    return {
        status: "accepted",
        message: "Notification processing started",
        batch_id: batch_id
    }
```

Worker:

```txt
function notification_worker(job):
    for student_id in job.student_ids:
        try:
            push_to_app(student_id, job.message)
            send_email(student_id, job.message)
            mark_delivery_success(student_id, job.batch_id)
        catch error:
            mark_delivery_failed(student_id, job.batch_id, error)
            retry_later(student_id, job.batch_id)
```

---

## Benefits

- Fast API response
- Reliable processing
- Retry support
- Failure tracking
- No duplicate notifications
- Better scalability
- Better user experience

---

# Stage 6

## Requirement

The product manager wants a Priority Inbox that always displays the top N most important unread notifications first.

Priority should be based on:

1. Notification type weight
2. Recency

Priority order:

```txt
Placement > Result > Event
```

---

## Priority Formula

```txt
priorityScore = typeWeight + recencyScore
```

Type weights:

```txt
Placement = 300
Result = 200
Event = 100
```

Recency score:

```txt
recencyScore = max(0, 100 - ageInHours)
```

Recent notifications get a higher score.

---

## Approach

1. Fetch notifications from the provided Notification API.
2. Calculate priority score for each notification.
3. Sort notifications by priority score.
4. If priority score is same, sort by latest timestamp.
5. Return top 10 notifications.

---

## Efficient Maintenance of Top 10

If new notifications keep coming in, we do not need to sort all notifications every time.

Use a min-heap of size 10.

For every new notification:

1. Calculate priority score.
2. If heap size is less than 10, insert it.
3. If heap is full and new notification score is greater than heap minimum, remove minimum and insert the new notification.
4. This keeps top 10 efficiently.

Time complexity:

```txt
For one new notification: O(log 10), effectively O(1)
For N notifications initially: O(N log 10), effectively O(N)
```

---

## Stage 6 Code File

The Stage 6 function is implemented in:

```txt
notification_app_be/priorityNotifications.js
```

The function returns top priority notifications based on type and recency.

The route for testing, if implemented, can be:

```http
GET /api/priority-notifications
```

Expected response:

```json
{
  "success": true,
  "count": 10,
  "notifications": [
    {
      "ID": "8a7412bd-6065-4d09-8501-a37f1cc848b",
      "Type": "Placement",
      "Message": "Advanced Micro Devices Inc. hiring",
      "Timestamp": "2026-04-22 17:49:42",
      "priorityScore": 395
    }
  ]
}
```

---

# Final Summary

The design uses:

- REST APIs for standard notification operations
- PostgreSQL for persistent structured storage
- Redis for caching unread counts and recent notifications
- WebSocket or SSE for real-time delivery
- Queue workers for reliable bulk delivery
- Composite indexes for query performance
- Priority scoring for top important notifications

This design is scalable, reliable, and suitable for a campus notification platform handling placements, events, and result updates.