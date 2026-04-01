// src/lib/tables.ts
// API contract types and validation from @cadre/shared — single source of truth.
export {
  ALLOWED_TABLES,
  type TableName,
  isAllowedTable,
  validateRecords,
  sanitizeRecord,
} from '@cadre/shared/api';
