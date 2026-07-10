require('dotenv').config();
const db = require('./src/config/database');
const sql = `
    SELECT v.id, v.plate, v.model, v.year, v.status, v.current_mileage, v.image_url, v.created_at,
           u.name AS current_driver_name,
           h.destination AS current_destination,
           lh.start_mileage as initial_km,
           lh.end_mileage as final_km
    FROM vehicles v
    LEFT JOIN handovers h ON h.vehicle_id = v.id AND h.status = 'active'
    LEFT JOIN users u ON u.id = h.driver_id
    LEFT JOIN LATERAL (
        SELECT start_mileage, end_mileage 
        FROM handovers 
        WHERE vehicle_id = v.id 
        ORDER BY created_at DESC 
        LIMIT 1
    ) lh ON true
    ORDER BY v.plate ASC
`;
db.query(sql).then(r => { console.log('OK', r.rowCount); process.exit(0); }).catch(e => { console.error('ERROR', e.message); process.exit(1); });
