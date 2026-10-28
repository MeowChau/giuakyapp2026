import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { AppProvider, useApp } from '../src/context/AppContext';
import { loadData, storage } from '../src/data/storage';
import type { FieldDraft } from '../src/types';

let tree: ReactTestRenderer.ReactTestRenderer | undefined;
let currentApi: ReturnType<typeof useApp> | undefined;
function Probe() {
  currentApi = useApp();
  return null;
}
function api() {
  if (!currentApi) {
    throw new Error('Provider is not mounted');
  }
  return currentApi;
}
const draft: FieldDraft = {
  name: 'Sân C1',
  type: '5 người',
  pricePerHour: '300000',
  status: 'Hoạt động',
};

beforeEach(async () => {
  await storage.clear();
  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(
      <AppProvider>
        <Probe />
      </AppProvider>,
    );
  });
  expect(api().status).toBe('ready');
});
afterEach(async () => {
  await ReactTestRenderer.act(async () => {
    tree?.unmount();
  });
  tree = undefined;
  currentApi = undefined;
  jest.restoreAllMocks();
});

test('concurrent saves serialize without dropping either update', async () => {
  await ReactTestRenderer.act(async () => {
    await Promise.all([
      api().saveField(draft),
      api().saveField({ ...draft, name: 'Sân C2' }),
    ]);
  });
  expect(api().data.fields).toHaveLength(6);
  expect((await loadData()).fields.map(field => field.name)).toEqual(
    expect.arrayContaining(['Sân C1', 'Sân C2']),
  );
});

test('failed save keeps the visible data and allows the next save to retry', async () => {
  jest.spyOn(storage, 'setItem').mockRejectedValueOnce(new Error('Disk full'));
  await ReactTestRenderer.act(async () => {
    await expect(api().saveField(draft)).rejects.toThrow('Disk full');
  });
  expect(api().data.fields).toHaveLength(4);
  await ReactTestRenderer.act(async () => {
    await api().saveField(draft);
  });
  expect(api().data.fields).toHaveLength(5);
  expect((await loadData()).fields).toHaveLength(5);
});

test('refresh loads the saved snapshot without changing the ready status', async () => {
  const updated = {
    ...api().data,
    fields: api().data.fields.map((field, index) =>
      index === 0 ? { ...field, pricePerHour: 420000 } : field,
    ),
  };
  await storage.setItem('app-data-v1', JSON.stringify(updated));
  await ReactTestRenderer.act(async () => {
    await api().refresh();
  });
  expect(api().data).toEqual(updated);
  expect(api().status).toBe('ready');
  expect(api().refreshing).toBe(false);
});

test('refresh deduplicates requests and finishes before queued writes can publish', async () => {
  const snapshot = JSON.stringify(api().data);
  let resolveRead: (value: string | null) => void = () => {
    throw new Error('Read not started');
  };
  const read = jest.spyOn(storage, 'getItem').mockImplementationOnce(
    () =>
      new Promise(resolve => {
        resolveRead = resolve;
      }),
  );
  let first: Promise<void> = Promise.resolve();
  let repeated: Promise<void> = Promise.resolve();
  let write: Promise<void> = Promise.resolve();
  await ReactTestRenderer.act(async () => {
    first = api().refresh();
    repeated = api().refresh();
    write = api().saveField(draft);
  });
  expect(first).toBe(repeated);
  expect(read).toHaveBeenCalledTimes(1);
  expect(api().refreshing).toBe(true);
  expect(api().status).toBe('ready');
  expect(api().data.fields).toHaveLength(4);
  await ReactTestRenderer.act(async () => {
    resolveRead(snapshot);
    await Promise.all([first, write]);
  });
  expect(api().refreshing).toBe(false);
  expect(api().data.fields).toHaveLength(5);
  expect((await loadData()).fields).toHaveLength(5);
});

test('a failed refresh keeps the existing data and permits another refresh', async () => {
  const previous = api().data;
  jest
    .spyOn(storage, 'getItem')
    .mockRejectedValueOnce(new Error('Read failed'));
  await ReactTestRenderer.act(async () => {
    await expect(api().refresh()).rejects.toThrow('Read failed');
  });
  expect(api().data).toEqual(previous);
  expect(api().status).toBe('ready');
  expect(api().refreshing).toBe(false);
  await ReactTestRenderer.act(async () => {
    await api().refresh();
  });
  expect(api().data).toEqual(previous);
});
