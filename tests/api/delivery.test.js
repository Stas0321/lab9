const { randomUUID } = require('node:crypto');
const { api } = require('../../support/database');
let app;
beforeEach(async () => { app = await api('lab9'); });
afterEach(async () => { if (app) await app.close(); });
async function post(route, data, status = 201) {
  const response = await fetch(app.url + route, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data || {}) });
  expect(response.status).toBe(status);
  return response.json();
}
async function create() {
  const c = await post('/customers', { code: randomUUID(), regular: false });
  const p = await post('/parcels', { code: randomUUID(), weightGrams: 1000, declaredValue: 10000 });
  return post('/shipments', { reference: randomUUID(), customerId: c.id, parcelId: p.id, distanceKm: 100 });
}
test('POST + GET persist shipment and insurance in real PostgreSQL', async () => {
  const s = await create();
  expect(s).toMatchObject({ status: 'Registered', baseFee: 7000, adjustment: 200, total: 7200 });
  const response = await fetch(app.url + '/shipments/' + s.id);
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual(s);
  const row = (await app.client.query('SELECT total, status FROM shipments WHERE id=$1', [s.id])).rows[0];
  expect(Number(row.total)).toBe(7200); expect(row.status).toBe('Registered');
});
test('dispatch and deliver persist final state', async () => {
  const s = await create();
  expect((await post(`/shipments/${s.id}/dispatch`, {}, 200)).status).toBe('Dispatched');
  expect((await post(`/shipments/${s.id}/deliver`, {}, 200)).status).toBe('Delivered');
  expect((await app.client.query('SELECT status FROM shipments WHERE id=$1', [s.id])).rows[0].status).toBe('Delivered');
});
test('cancel persists refund; second cancel returns backend 409', async () => {
  const s = await create();
  expect(await post(`/shipments/${s.id}/cancel`, {}, 200)).toMatchObject({ status: 'Cancelled', refund: 7200 });
  expect(await post(`/shipments/${s.id}/cancel`, {}, 409)).toMatchObject({ code: 'SHIPMENT_CONFLICT' });
  const row = (await app.client.query('SELECT refund, status FROM shipments WHERE id=$1', [s.id])).rows[0];
  expect(Number(row.refund)).toBe(7200); expect(row.status).toBe('Cancelled');
});
test('delivery before dispatch is rejected and state stays Registered', async () => {
  const s = await create();
  expect(await post(`/shipments/${s.id}/deliver`, {}, 409)).toMatchObject({ code: 'SHIPMENT_CONFLICT' });
  expect((await app.client.query('SELECT status FROM shipments WHERE id=$1', [s.id])).rows[0].status).toBe('Registered');
});
test('invalid parcel returns 400 and creates no row', async () => {
  expect(await post('/parcels', { code: randomUUID(), weightGrams: 0, declaredValue: 0 }, 400)).toMatchObject({ code: 'INVALID_REQUEST' });
  expect(Number((await app.client.query('SELECT count(*) FROM parcels')).rows[0].count)).toBe(0);
});
