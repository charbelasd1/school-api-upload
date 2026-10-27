# School Management API — CSC456 Project 1

A RESTful Web API built with **Node.js + Express**, using **two databases**:

| Database | Library | Entities |
|---|---|---|
| MongoDB | Mongoose | `Teacher`, `Course`, `Student` |
| SQLite | Sequelize | `AuditLog` (standalone table) |

## Relationships (MongoDB)

```
Teacher 1 ──────< * Course * >──────< * Student
         many-to-one          many-to-many
```

- **Many-to-one — Course → Teacher.** Each course stores one `teacher` ObjectId reference. One teacher teaches many courses.
  The reverse direction (`teacher.courses`) is a Mongoose **virtual** — it's not stored, it's computed with `populate()`.
- **Many-to-many — Students ↔ Courses.** Each student stores an array `courses: [ObjectId]`. One student takes many courses; one course has many students.
  The array lives **only on Student** (single source of truth, so the two sides can never disagree). `course.students` is again a virtual populate.

Integrity rules (MongoDB has no foreign keys, so the code enforces them):
- Creating/updating a course checks that the teacher exists.
- Creating/updating a student checks that every course id exists.
- Deleting a teacher who still has courses → **409 Conflict**.
- Deleting a course **cascades**: it is `$pull`ed out of every student's `courses` array.

## AuditLog (SQLite)

Every create / update / delete / enroll / unenroll on the MongoDB entities writes a row to the `audit_logs` table (see `src/utils/audit.js`). The table also has its own full CRUD routes, plus filtering (`WHERE`), text search (`LIKE`), pagination (`LIMIT/OFFSET`) and a `GROUP BY` stats endpoint to show SQL querying.

## Setup

Requirements: **Node.js 18+** and **MongoDB** running locally (or a MongoDB Atlas connection string). SQLite needs no install — the database is just a file created automatically in `data/`.

```bash
npm install
cp .env.example .env        # Windows: copy .env.example .env
npm run seed                # optional: sample data
npm start                   # or: npm run dev  (auto-restart on change)
```

Server: `http://localhost:3000`

## Endpoints

### Teachers
| Method | Route | Description |
|---|---|---|
| POST | `/api/teachers` | Create |
| GET | `/api/teachers?department=` | List (optional filter) |
| GET | `/api/teachers/:id` | One teacher + their courses |
| GET | `/api/teachers/:id/courses` | Courses taught by the teacher (many-to-one) |
| PUT | `/api/teachers/:id` | Update |
| DELETE | `/api/teachers/:id` | Delete (409 if they still teach courses) |

### Courses
| Method | Route | Description |
|---|---|---|
| POST | `/api/courses` | Create (body needs `teacher` id) |
| GET | `/api/courses?teacher=&minCredits=` | List with teacher populated |
| GET | `/api/courses/:id` | One course + teacher + enrolled students |
| GET | `/api/courses/:id/students` | Students in the course (many-to-many) |
| PUT | `/api/courses/:id` | Update / reassign teacher |
| DELETE | `/api/courses/:id` | Delete + remove from all students |

### Students
| Method | Route | Description |
|---|---|---|
| POST | `/api/students` | Create (optional `courses: [ids]`) |
| GET | `/api/students?major=&year=` | List with courses populated |
| GET | `/api/students/:id` | One student + courses + each course's teacher (nested populate) |
| GET | `/api/students/:id/courses` | Student's courses |
| PUT | `/api/students/:id` | Update |
| DELETE | `/api/students/:id` | Delete |
| POST | `/api/students/:id/courses/:courseId` | **Enroll** |
| DELETE | `/api/students/:id/courses/:courseId` | **Unenroll** |

### Audit logs (SQLite)
| Method | Route | Description |
|---|---|---|
| POST | `/api/audit-logs` | Create manual entry |
| GET | `/api/audit-logs?entity=&action=&entityId=&search=&from=&to=&limit=&page=` | Filter + paginate |
| GET | `/api/audit-logs/stats` | Count per entity/action (GROUP BY) |
| GET | `/api/audit-logs/:id` | One log |
| PUT | `/api/audit-logs/:id` | Update |
| DELETE | `/api/audit-logs/:id` | Delete |

### Status codes used
`200` OK · `201` Created · `400` validation error / bad id · `404` not found · `409` conflict (duplicate, already enrolled, teacher still has courses) · `500` server error

## Testing with Postman

Import `postman/School-API.postman_collection.json`. It has 51 requests in 5 folders, each with test scripts. Requests that create records save their ids into **collection variables** (`teacherId`, `courseId`, `studentId`, …), so later requests reuse them automatically.

Run the whole thing with **Collection Runner** (right-click collection → *Run*) in order. The collection includes negative tests (validation errors, invalid ids, duplicates, already enrolled, delete blocked) and finishes by deleting everything it created. Change `baseUrl` in the collection variables if your port differs.

## Project structure

```
src/
  server.js            entry point: env, connect both DBs, listen
  app.js               express app: middleware + routes + error handling
  seed.js              sample data
  config/
    mongo.js           mongoose.connect
    sqlite.js          Sequelize instance (SQLite file) + sync()
  models/
    mongo/             Teacher, Course, Student (Mongoose schemas)
    sql/AuditLog.js    Sequelize model
  controllers/         request logic for each entity
  routes/              URL -> controller mapping
  middleware/
    errorHandler.js    404 + central error -> JSON
  utils/
    asyncHandler.js    forwards async errors to Express
    ApiError.js        error with HTTP status
    audit.js           writes to the AuditLog table
postman/
  School-API.postman_collection.json
```

Request flow: **route** → `asyncHandler` → **controller** → **model** (Mongoose or Sequelize) → JSON response. Any thrown error goes to `errorHandler`, which picks the status code.

## NoSQL (MongoDB) vs SQL (SQLite)

| | MongoDB + Mongoose | SQLite + Sequelize |
|---|---|---|
| **Data model** | Documents (JSON-like) in collections; can embed arrays (`Student.courses`) | Rows in tables with fixed columns |
| **Schema** | Flexible at the DB level — the schema is enforced by Mongoose in the app, and documents can evolve without migrations | Rigid — columns defined up front (`sequelize.sync()` creates the table); changing it needs `ALTER TABLE`/migrations |
| **Relationships** | References (`ObjectId` + `ref`) resolved by `populate()` in the app; no foreign-key enforcement, so integrity checks are in our controllers | Foreign keys and `JOIN`s are native; a many-to-many would need a junction table (e.g. `enrollments`) |
| **Many-to-many here** | One array field on Student — no extra collection | Would require a third table `student_courses(studentId, courseId)` |
| **Querying** | Query objects (`{ credits: { $gte: 3 } }`), `$addToSet`/`$pull` for arrays, aggregation pipeline | SQL (`WHERE`, `LIKE`, `GROUP BY`, `COUNT`) — generated by Sequelize (`Op.like`, `fn('COUNT')`) |
| **IDs** | 24-char hex `ObjectId` | Auto-increment integer |
| **Scaling** | Designed for horizontal scaling (sharding) and large, varied data | Single file, embedded, no server — great for small apps, logs, tests, local storage |
| **Best for** | Evolving, nested, hierarchical data (profiles, catalogs, content) | Structured, append-heavy, report-style data with strong consistency (logs, transactions, analytics) |

**Why AuditLog is in SQL:** every log has the same shape, logs are append-only, and we want to filter, count and group them — exactly what SQL does well. **Why the school data is in MongoDB:** students/courses are naturally document-shaped and the enrollment list fits neatly as an array inside the student document.
