/**
 * initDB.js
 * ---------
 * Creates all database tables and seeds initial data on first run.
 * Uses bcryptjs to hash passwords. Safe to call on every startup —
 * existence checks prevent duplicate seed data.
 */

const db = require('./database');
const bcrypt = require('bcryptjs');

// ---------------------------------------------------------------------------
// DDL — Table definitions
// ---------------------------------------------------------------------------

const CREATE_USERS = `
  CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,
    name          TEXT NOT NULL,
    email         TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role          TEXT CHECK(role IN ('driver','manager')) NOT NULL DEFAULT 'driver',
    active        INTEGER NOT NULL DEFAULT 1,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`;

const CREATE_VEHICLES = `
  CREATE TABLE IF NOT EXISTS vehicles (
    id               SERIAL PRIMARY KEY,
    plate            TEXT UNIQUE NOT NULL,
    model            TEXT NOT NULL,
    year             INTEGER NOT NULL,
    status           TEXT CHECK(status IN ('available','in_use','maintenance')) NOT NULL DEFAULT 'available',
    current_mileage  INTEGER NOT NULL DEFAULT 0,
    image_url        TEXT,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`;

const CREATE_HANDOVERS = `
  CREATE TABLE IF NOT EXISTS handovers (
    id             SERIAL PRIMARY KEY,
    vehicle_id     INTEGER NOT NULL REFERENCES vehicles(id),
    driver_id      INTEGER NOT NULL REFERENCES users(id),
    checkout_time  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    checkin_time   TIMESTAMP,
    start_mileage  INTEGER NOT NULL,
    end_mileage    INTEGER,
    status         TEXT CHECK(status IN ('active','completed')) NOT NULL DEFAULT 'active',
    destination    TEXT
  )
`;

const CREATE_DAMAGES = `
  CREATE TABLE IF NOT EXISTS damages (
    id           SERIAL PRIMARY KEY,
    vehicle_id   INTEGER NOT NULL REFERENCES vehicles(id),
    driver_id    INTEGER NOT NULL REFERENCES users(id),
    handover_id  INTEGER REFERENCES handovers(id),
    part_id      TEXT NOT NULL,
    severity     TEXT CHECK(severity IN ('low','medium','high')) NOT NULL,
    status       TEXT CHECK(status IN ('reported','repairing','fixed')) NOT NULL DEFAULT 'reported',
    notes        TEXT,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at  TIMESTAMP
  )
`;

const CREATE_VEHICLE_PHOTOS = `
  CREATE TABLE IF NOT EXISTS vehicle_photos (
    id          SERIAL PRIMARY KEY,
    vehicle_id  INTEGER NOT NULL REFERENCES vehicles(id),
    driver_id   INTEGER NOT NULL REFERENCES users(id),
    photo_url   TEXT NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`;

const CREATE_FUEL_LOGS = `
  CREATE TABLE IF NOT EXISTS fuel_logs (
    id                  SERIAL PRIMARY KEY,
    vehicle_id          INTEGER NOT NULL REFERENCES vehicles(id),
    driver_id           INTEGER NOT NULL REFERENCES users(id),
    liters              REAL NOT NULL,
    total_cost          REAL NOT NULL,
    fuel_type           TEXT NOT NULL,
    receipt_image_url   TEXT,
    ocr_cnpj_extracted  TEXT,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`;

const CREATE_MAINTENANCES = `
  CREATE TABLE IF NOT EXISTS maintenances (
    id             SERIAL PRIMARY KEY,
    vehicle_id     INTEGER NOT NULL REFERENCES vehicles(id),
    type           TEXT NOT NULL,
    description    TEXT,
    status         TEXT CHECK(status IN ('scheduled','in_progress','done')) NOT NULL DEFAULT 'scheduled',
    scheduled_date TEXT,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`;

// ---------------------------------------------------------------------------
// Seed helpers
// ---------------------------------------------------------------------------

async function seedUsers(passwordHash) {
  const usersToSeed = [
    // Gestores
    { name: 'Daniella Lopes',  email: 'daniella.lopes@drevomoveis.com.br', password_hash: passwordHash, role: 'manager' },
    { name: 'Amanda Texeira',  email: 'amanda.texeira@drevomoveis.com.br', password_hash: passwordHash, role: 'manager' },
    { name: 'Kaue Salles',     email: 'kaue.salles@drevomoveis.com.br',    password_hash: passwordHash, role: 'manager' },
    { name: 'Leandro Tomba',   email: 'leandrotomba@drevomoveis.com.br',   password_hash: passwordHash, role: 'manager' },
    { name: 'Mateus Moraes',   email: 'mateus.moraes@drevomoveis.com.br',  password_hash: passwordHash, role: 'manager' },
    { name: 'Jennifer Mendes', email: 'jennifer.mendes@drevomoveis.com.br',password_hash: passwordHash, role: 'manager' },
    { name: 'Yukio Outi',      email: 'yukioouti@drevomoveis.com.br',      password_hash: passwordHash, role: 'manager' },
    { name: 'Claudemir',       email: 'claudemir@drevomoveis.com.br',      password_hash: passwordHash, role: 'manager' },
    { name: 'Mauricio',        email: 'mauricio@drevomoveis.com.br',       password_hash: passwordHash, role: 'manager' },
    // Motoristas (Login simples no campo email)
    { name: 'Ilgner',        email: 'ilgner',        password_hash: passwordHash, role: 'driver' },
    { name: 'Gabriel',       email: 'gabriel',       password_hash: passwordHash, role: 'driver' },
    { name: 'Fabio Uemori',  email: 'fabio.uemori',  password_hash: passwordHash, role: 'driver' },
    { name: 'Fabio Barba',   email: 'fabio.barba',   password_hash: passwordHash, role: 'driver' },
    { name: 'Fernando',      email: 'fernando',      password_hash: passwordHash, role: 'driver' },
    { name: 'Pedro',         email: 'pedro',         password_hash: passwordHash, role: 'driver' },
    { name: 'Kaue',          email: 'kaue',          password_hash: passwordHash, role: 'driver' },
    { name: 'Leandro',       email: 'leandro',       password_hash: passwordHash, role: 'driver' },
    { name: 'Yukio',         email: 'yukio',         password_hash: passwordHash, role: 'driver' },
    { name: 'Jennifer',      email: 'jennifer',      password_hash: passwordHash, role: 'driver' },
    { name: 'Jel',           email: 'jel',           password_hash: passwordHash, role: 'driver' },
    { name: 'Jonathan',      email: 'jonathan',      password_hash: passwordHash, role: 'driver' },
  ];

  for (const user of usersToSeed) {
    const res = await db.query('SELECT id FROM users WHERE email = $1', [user.email]);
    if (res.rows.length === 0) {
      await db.query(
        'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4)',
        [user.name, user.email, user.password_hash, user.role]
      );
      console.log(`  👤 User seeded: \${user.email} (\${user.role})`);
    }
  }
}

async function seedVehicles() {
  const vehiclesToSeed = [
    { plate: 'UNO-0001', model: 'Fiat Uno Cinza',  year: 2021, image_url: '/vehicles/uno_cinza.png' },
    { plate: 'UNO-0002', model: 'Fiat Uno Verde',  year: 2022, image_url: '/vehicles/uno_verde.png' },
    { plate: 'UNO-0003', model: 'Fiat Uno Branco', year: 2023, image_url: '/vehicles/uno_branco.png' },
    { plate: 'STR-0001', model: 'Fiat Strada',     year: 2024, image_url: '/vehicles/strada.png' },
  ];

  for (const vehicle of vehiclesToSeed) {
    const res = await db.query('SELECT id FROM vehicles WHERE plate = $1', [vehicle.plate]);
    if (res.rows.length === 0) {
      await db.query(
        'INSERT INTO vehicles (plate, model, year, image_url) VALUES ($1, $2, $3, $4)',
        [vehicle.plate, vehicle.model, vehicle.year, vehicle.image_url]
      );
      console.log(`  🚛 Vehicle seeded: \${vehicle.plate} — \${vehicle.model}`);
    }
  }
}

async function seedDamages() {
  const damagesToSeed = [
    { vehicle_id: 1, driver_id: 2, part_id: 'door_front_left', severity: 'high'   },
    { vehicle_id: 1, driver_id: 2, part_id: 'bumper_rear',      severity: 'medium' },
  ];

  for (const damage of damagesToSeed) {
    const res = await db.query(
      'SELECT id FROM damages WHERE vehicle_id = $1 AND part_id = $2',
      [damage.vehicle_id, damage.part_id]
    );
    if (res.rows.length === 0) {
      await db.query(
        'INSERT INTO damages (vehicle_id, driver_id, part_id, severity) VALUES ($1, $2, $3, $4)',
        [damage.vehicle_id, damage.driver_id, damage.part_id, damage.severity]
      );
      console.log(`  💥 Damage seeded: \${damage.part_id} on vehicle \${damage.vehicle_id}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

async function initializeDB() {
  console.log('\\n🔧 Initializing database schema...');

  await db.query(CREATE_USERS);
  await db.query(CREATE_VEHICLES);
  await db.query(CREATE_HANDOVERS);
  await db.query(CREATE_DAMAGES);
  await db.query(CREATE_FUEL_LOGS);
  await db.query(CREATE_MAINTENANCES);
  await db.query(CREATE_VEHICLE_PHOTOS);

  try {
    await db.query(`ALTER TABLE handovers ADD COLUMN destination TEXT`);
  } catch (err) {
    // Column might already exist, ignore error
  }

  console.log('  ✅ All tables created/verified.');

  const SEED_PASSWORD = 'drevo123';
  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(SEED_PASSWORD, salt);

  console.log('\\n🌱 Seeding initial data...');
  await seedUsers(passwordHash);
  await seedVehicles();
  await seedDamages();

  console.log('\\n✅ Database initialization complete.\\n');
}

module.exports = { initializeDB };
