SELECT
    kt.id as task_id,
    kt.component_name,
    kt.status as task_status,
    kt.created_at as task_created_at,
    ks.name as station_name,
    ks.id as station_id
FROM
    kitchen_tasks kt
    INNER JOIN order_items oi ON kt.order_item_id = oi.id
    INNER JOIN orders o ON oi.order_id = o.id
    INNER JOIN kitchen_stations ks ON kt.station_id = ks.id
    LEFT JOIN tables t ON o.table_id = t.id
    LEFT JOIN menu_items mi ON (
        COALESCE(
            oi.product_id,
            oi.menu_item_id
        ) = mi.id
    )
WHERE
    kt.status IN ('pending', 'sent', 'prepared')
    AND o.company_id = '00000000-0000-0000-0000-000000000000';