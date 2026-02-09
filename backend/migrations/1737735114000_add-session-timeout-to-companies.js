/* eslint-disable camelcase */
/**
 * Migration: Add Session Timeout Configuration to Companies
 * Adds session_timeout_minutes field to allow per-company timeout configuration
 */

exports.up = (pgm) => {
    // Add session_timeout_minutes to companies table
    pgm.addColumn('companies', {
        session_timeout_minutes: {
            type: 'integer',
            notNull: true,
            default: 20,
            comment: 'Session timeout in minutes for inactivity auto-logout'
        }
    }, { ifNotExists: true });

    console.log('Added session_timeout_minutes to companies table with default value of 20 minutes');
};

exports.down = (pgm) => {
    pgm.dropColumn('companies', 'session_timeout_minutes', { ifExists: true });
};
