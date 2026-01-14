# Database Migrations Guide

This project uses `node-pg-migrate` for database migrations.

## Configuration

Migrations are configured in `.migraterc.js` and use the `DATABASE_URL` environment variable.

## Running Migrations

### Apply all pending migrations
```bash
npm run migrate up
```

### Rollback last migration
```bash
npm run migrate down
```

### Reset database (rollback all, then apply all)
```bash
npm run migrate reset
```

### Create a new migration
```bash
npm run migrate create migration-name
```

This will create a new migration file in the `migrations/` directory.

## Migration Files

- `1701960000000_create-initial-schema.js` - Initial schema (payment_transactions, orders, refunds, terminals)
- `1701960001000_add-restaurants-menus-users.js` - Restaurants, menus, users, and related tables

## Best Practices

1. **Always test migrations** on a development database first
2. **Never modify existing migrations** - create new ones instead
3. **Use transactions** when possible (node-pg-migrate does this automatically)
4. **Backup database** before running migrations in production
5. **Review migration files** before applying to production

## Production Deployment

```bash
# 1. Backup database
pg_dump $DATABASE_URL > backup.sql

# 2. Run migrations
npm run migrate up

# 3. Verify migration status
npm run migrate list
```

## Troubleshooting

If a migration fails:
1. Check the error message
2. Fix the migration file if needed
3. Rollback if necessary: `npm run migrate down`
4. Re-apply: `npm run migrate up`








