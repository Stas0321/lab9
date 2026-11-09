const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { Client } = require('pg');
const root = path.resolve(__dirname, '..');
if (fs.existsSync(path.join(root, '.env.local'))) {
  const values = require('node:util').parseEnv(fs.readFileSync(path.join(root, '.env.local'), 'utf8'));
  for (const [key, value] of Object.entries(values)) if (process.env[key] === undefined) process.env[key] = value;
}
function config(schema) {
  return { host: process.env.DB_HOST || '127.0.0.1', port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME || 'delivery_variant08_test', user: process.env.DB_USER || 'delivery_student',
    password: process.env.DB_PASSWORD || '', ...(schema ? { options: `-c search_path=${schema}` } : {}) };
}
function safeSchema(name) {
  if (!/^lab(?:8|9|10)_[a-z0-9_]+$/.test(name)) throw new Error('Unsafe test schema');
  return name;
}
async function database(prefix = 'lab8', explicitSchema) {
  const schema = safeSchema(explicitSchema || `${prefix}_${randomUUID().replaceAll('-', '')}`);
  const admin = new Client(config());
  try { await admin.connect(); await admin.query(`CREATE SCHEMA "${schema}"`); } finally { await admin.end(); }
  const client = new Client(config(schema));
  await client.connect();
  await client.query(fs.readFileSync(path.join(root, 'sut-b/migrations/V1__create_tables.sql'), 'utf8'));
  const { CustomerRepository, ParcelRepository, ShipmentRepository } = require('../sut-b/src/repositories');
  const { ShippingService } = require('../sut-b/src/service');
  const customers = new CustomerRepository(client), parcels = new ParcelRepository(client), shipments = new ShipmentRepository(client);
  return { schema, client, customers, parcels, shipments,
    service: new ShippingService(customers, parcels, shipments, { isAllowed: async () => true }),
    async close() {
      try { await client.end(); } finally {
        const cleanup = new Client(config());
        await cleanup.connect();
        try { await cleanup.query(`DROP SCHEMA "${safeSchema(schema)}" CASCADE`); } finally { await cleanup.end(); }
      }
    },
  };
}
async function api(prefix = 'lab9') {
  const db = await database(prefix);
  const previous = process.env.PGOPTIONS;
  process.env.PGOPTIONS = `-c search_path=${db.schema}`;
  const { createApp } = require('../sut-b/src/api');
  const server = await new Promise(resolve => { const s = createApp().listen(0, '127.0.0.1', () => resolve(s)); });
  return { ...db, url: `http://127.0.0.1:${server.address().port}`,
    async close() { await new Promise((resolve, reject) => server.close(e => e ? reject(e) : resolve()));
      if (previous === undefined) delete process.env.PGOPTIONS; else process.env.PGOPTIONS = previous;
      await db.close(); },
  };
}
module.exports = { database, api, config, safeSchema, root };
