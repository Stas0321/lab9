const { randomUUID } = require('node:crypto');
const { Customer, Parcel, ShipmentRequest } = require('../sut-b/src/models');
async function shipment(db, value = 0) {
  const c = await db.customers.create(new Customer(0, randomUUID(), false));
  const p = await db.parcels.create(new Parcel(0, randomUUID(), 1000, value, 10, 10, 10));
  return db.service.createShipment(new ShipmentRequest(randomUUID(), c.id, p.id, 100));
}
module.exports = { shipment };
