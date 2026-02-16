# Database Fixes Plan

## Overview

Plan de correcciones para la base de datos del Prompt Library.

---

## Priority 1: Critical Fixes

### FIX-001: Add Foreign Key between Prompt and Category

**Problem:** `Prompt.category` is a string field without referential integrity. Deleting a category leaves orphaned prompts.

**Current State:**

```prisma
model Prompt {
  category  String  // No FK, just a string
}

model Category {
  name  String  @unique
}
```

**Target State:**

```prisma
model Prompt {
  categoryId  String?
  category    Category @relation(fields: [categoryId], references: [id])
}

model Category {
  id      String   @id
  name    String   @unique
  prompts Prompt[]
}
```

**Migration Steps:**

1. Add `categoryId` field as nullable to Prompt
2. Create migration to populate `categoryId` from existing `category` string
3. Add FK constraint
4. Update all API routes to use `categoryId` instead of `category` string
5. Deprecate `category` string field (keep for backward compatibility during transition)
6. Remove `category` string field in next major version

**Files to Update:**

- `prisma/schema.prisma`
- `src/app/api/prompts/route.ts`
- `src/app/api/prompts/[id]/route.ts`
- `src/app/api/stats/route.ts`
- `src/lib/store.ts`
- `src/components/prompt-manager/*`
- `scripts/seed.ts`

**Risk Level:** High (breaking change)
**Estimated Effort:** 4-6 hours

---

### FIX-002: Add Enum Types for Status, RiskLevel, and Role

**Problem:** String fields without DB-level constraints allow invalid values.

**Current State:**

```prisma
model Prompt {
  status    String  @default("draft")
  riskLevel String  @default("low")
}

model User {
  role String @default("user")
}
```

**Target State:**

```prisma
enum PromptStatus {
  draft
  review
  published
  deprecated
}

enum RiskLevel {
  low
  medium
  high
}

enum UserRole {
  owner
  editor
  reviewer
  user
}

model Prompt {
  status    PromptStatus @default(draft)
  riskLevel RiskLevel    @default(low)
}

model User {
  role UserRole @default(user)
}
```

**Migration Steps:**

1. Create enum types in Prisma schema
2. Generate migration (Prisma will handle existing data conversion)
3. Update TypeScript types to match enums
4. Update API validation schemas
5. Update frontend components

**Files to Update:**

- `prisma/schema.prisma`
- `src/types/index.ts`
- `src/lib/validators/prompt.ts`
- `src/app/api/prompts/route.ts`
- `src/app/api/prompts/[id]/route.ts`
- `src/components/prompt-manager/*`

**Risk Level:** Medium
**Estimated Effort:** 2-3 hours

---

## Priority 2: Important Fixes

### FIX-003: Add Soft Delete to Prompts

**Problem:** Physical deletion loses data permanently. No recovery option.

**Target State:**

```prisma
model Prompt {
  deletedAt  DateTime?
  deletedBy  String?
  
  @@index([deletedAt])
}
```

**Migration Steps:**

1. Add `deletedAt` and `deletedBy` fields
2. Update delete endpoints to set `deletedAt` instead of actual delete
3. Add `deletedBy` relation to User
4. Update all queries to filter out soft-deleted records
5. Add admin endpoint to restore deleted prompts
6. Add cleanup job for permanent deletion after X days

**Files to Update:**

- `prisma/schema.prisma`
- `src/app/api/prompts/[id]/route.ts`
- `src/lib/db.ts` (add global filter middleware)
- `src/app/api/stats/route.ts`

**Risk Level:** Medium
**Estimated Effort:** 3-4 hours

---

### FIX-004: Add Index to AuditLog.createdAt

**Problem:** Missing index on `createdAt` slows down queries for recent activity.

**Target State:**

```prisma
model AuditLog {
  createdAt DateTime @default(now())
  
  @@index([createdAt])
}
```

**Migration Steps:**

1. Add index to schema
2. Generate and run migration

**Risk Level:** Low
**Estimated Effort:** 15 minutes

---

### FIX-005: Validate JSON Fields at DB Level

**Problem:** `tags`, `variablesSchema`, `examples` stored as strings without validation.

**Options:**

1. **PostgreSQL JSONB:** Use `Json` type in Prisma for native JSON validation
2. **Application-level validation:** Keep as String but add strict validation

**Recommended Approach:** Use Prisma `Json` type for PostgreSQL

**Target State:**

```prisma
model Prompt {
  tags            Json    @default("[]")
  variablesSchema Json    @default("[]")
  examples        Json?
}
```

**Migration Steps:**

1. Change field types to `Json`
2. Create migration to parse existing JSON strings
3. Update TypeScript types (remove string union types)
4. Update API serialization

**Files to Update:**

- `prisma/schema.prisma`
- `src/types/index.ts`
- `src/app/api/prompts/route.ts`
- `scripts/seed.ts`

**Risk Level:** Medium
**Estimated Effort:** 2-3 hours

---

## Priority 3: Nice to Have

### FIX-006: Add Composite Index for Common Queries

**Problem:** Common query patterns not fully optimized.

**Target State:**

```prisma
model Prompt {
  @@index([status, updatedAt])  // Dashboard queries
  @@index([authorId, status])   // User's prompts by status
  @@index([category, updatedAt])
}
```

**Risk Level:** Low
**Estimated Effort:** 15 minutes

---

### FIX-007: Add Timestamps to All Models

**Problem:** Some models lack `createdAt`/`updatedAt` for auditing.

**Models Missing Timestamps:**

- `Account` - only has `id`
- `Session` - only has `expires`
- `VerificationToken` - only has `expires`

**Target State:**

```prisma
model Account {
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Session {
  createdAt DateTime @default(now())
}
```

**Risk Level:** Low
**Estimated Effort:** 30 minutes

---

### FIX-008: Add Unique Constraint to Prompt.title

**Problem:** Duplicate prompt titles allowed, causing confusion.

**Target State:**

```prisma
model Prompt {
  title String @unique
}
```

**Consideration:** May need to scope uniqueness to category or author.

**Risk Level:** Low
**Estimated Effort:** 30 minutes

---

## Migration Execution Order

| Order | Fix ID | Description | Risk | Effort |
|-------|--------|-------------|------|--------|
| 1 | FIX-004 | Add AuditLog.createdAt index | Low | 15min |
| 2 | FIX-006 | Add composite indexes | Low | 15min |
| 3 | FIX-002 | Add enum types | Medium | 2-3h |
| 4 | FIX-005 | JSON field validation | Medium | 2-3h |
| 5 | FIX-003 | Soft delete | Medium | 3-4h |
| 6 | FIX-001 | FK Prompt-Category | High | 4-6h |
| 7 | FIX-007 | Add missing timestamps | Low | 30min |
| 8 | FIX-008 | Unique prompt titles | Low | 30min |

---

## Testing Strategy

1. **Backup database** before each migration
2. Run migrations on copy of production data
3. Verify data integrity with queries
4. Run full test suite after each fix
5. Manual QA on affected features

---

## Rollback Plan

Each migration should include:

- Down migration to revert schema changes
- Data backup before transformation
- Documented rollback procedure

---

## Estimated Total Effort

| Priority | Fixes | Total Time |
|----------|-------|------------|
| P1 | FIX-001, FIX-002 | 6-9 hours |
| P2 | FIX-003, FIX-004, FIX-005 | 5-7 hours |
| P3 | FIX-006, FIX-007, FIX-008 | 1-2 hours |
| **Total** | **All** | **12-18 hours** |
