import { createSeedData } from '../src/data/seed';
import {
  loadData,
  persistData,
  storage,
  STORAGE_KEY,
} from '../src/data/storage';

beforeEach(async () => {
  await storage.clear();
});
afterEach(() => {
  jest.restoreAllMocks();
});

test('first launch seeds once, reopening keeps the exact same records', async () => {
  const first = await loadData();
  const reopened = await loadData();
  expect(first.fields.length).toBeGreaterThanOrEqual(4);
  expect(first.bookings.length).toBeGreaterThanOrEqual(3);
  expect(reopened).toEqual(first);
});

test('an intentionally empty saved database stays empty on restart', async () => {
  const empty = { version: 1 as const, fields: [], bookings: [] };
  await persistData(empty);
  expect(await loadData()).toEqual(empty);
});

test('saves fields and bookings together and restores edits', async () => {
  const data = createSeedData();
  data.fields[0].pricePerHour = 520000;
  data.bookings[0].customerName = 'Khách đã cập nhật';
  await persistData(data);
  expect(await loadData()).toEqual(data);
});

test('malformed JSON is reported and never silently replaced with sample data', async () => {
  await storage.setItem(STORAGE_KEY, '{invalid-json');
  await expect(loadData()).rejects.toThrow();
  expect(await storage.getItem(STORAGE_KEY)).toBe('{invalid-json');
});

test('rejects an orphan booking without overwriting the saved snapshot', async () => {
  const data = createSeedData();
  data.bookings[0].fieldId = 'missing-field';
  const raw = JSON.stringify(data);
  await storage.setItem(STORAGE_KEY, raw);
  await expect(loadData()).rejects.toThrow('không hợp lệ');
  expect(await storage.getItem(STORAGE_KEY)).toBe(raw);
});

test('storage read failures propagate instead of triggering a reseed', async () => {
  const read = jest
    .spyOn(storage, 'getItem')
    .mockRejectedValueOnce(new Error('Device read failed'));
  const write = jest.spyOn(storage, 'setItem');
  await expect(loadData()).rejects.toThrow('Device read failed');
  expect(write).not.toHaveBeenCalled();
  read.mockRestore();
});

test('a failed write leaves the previous stored data available for retry', async () => {
  const original = await loadData();
  const write = jest
    .spyOn(storage, 'setItem')
    .mockRejectedValueOnce(new Error('Disk full'));
  await expect(persistData({ ...original, fields: [] })).rejects.toThrow(
    'Disk full',
  );
  write.mockRestore();
  expect(await loadData()).toEqual(original);
});
