import React from 'react';
import { Alert, FlatList, Text, TextInput } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';
import { FieldCard } from '../src/components/FieldCard';
import { Button, FormInput } from '../src/components/ui';
import { createSeedData } from '../src/data/seed';
import { loadData, storage } from '../src/data/storage';
import { FieldDetailScreen } from '../src/screens/FieldDetailScreen';
import { formatDate } from '../src/utils/format';
import {
  BookingsScreen,
  ReportsScreen,
  SettingsScreen,
} from '../src/screens/OverviewScreens';

let tree: ReactTestRenderer.ReactTestRenderer | undefined;

beforeEach(async () => {
  await storage.clear();
});
afterEach(async () => {
  await ReactTestRenderer.act(async () => {
    tree?.unmount();
  });
  tree = undefined;
  jest.restoreAllMocks();
});

async function openApp() {
  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(<App />);
  });
  if (!tree) {
    throw new Error('App did not render');
  }
  return tree.root;
}

async function fill(
  root: ReactTestRenderer.ReactTestInstance,
  label: string,
  value: string,
) {
  const input = root
    .findAllByType(FormInput)
    .find(node => node.props.label === label);
  if (!input) {
    throw new Error(`Input not found: ${label}`);
  }
  await ReactTestRenderer.act(async () => {
    input.props.onChangeText(value);
  });
}

async function press(root: ReactTestRenderer.ReactTestInstance, title: string) {
  const button = root
    .findAllByType(Button)
    .find(node => node.props.title === title);
  if (!button) {
    throw new Error(`Button not found: ${title}`);
  }
  await ReactTestRenderer.act(async () => {
    await button.props.onPress();
  });
}

async function pressControl(
  root: ReactTestRenderer.ReactTestInstance,
  role: string,
  label: string,
) {
  const control = root.findAll(
    node =>
      node.props.accessibilityRole === role &&
      node.props.accessibilityLabel === label &&
      typeof node.props.onPress === 'function',
  )[0];
  if (!control) {
    throw new Error(`Control not found: ${label}`);
  }
  await ReactTestRenderer.act(async () => {
    control.props.onPress();
  });
}

test('first launch renders all four seeded field cards', async () => {
  const root = await openApp();
  expect(root.findAllByType(FieldCard)).toHaveLength(4);
  expect(
    root.findAllByType(Text).some(node => node.props.children === 'Sân A1'),
  ).toBe(true);
});

test('deleting a booked field shows an Alert and keeps all fields', async () => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  const root = await openApp();
  const card = root
    .findAllByType(FieldCard)
    .find(node => node.props.field.name === 'Sân A1');
  await ReactTestRenderer.act(async () => {
    card?.props.onDelete();
  });
  expect(alert).toHaveBeenCalledWith(
    'Không thể xoá sân',
    expect.stringContaining('đang có lượt đặt'),
  );
  expect(root.findAllByType(FieldCard)).toHaveLength(4);
});

test('an unbooked field is removed only by the destructive Alert confirmation', async () => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  const root = await openApp();
  const card = root
    .findAllByType(FieldCard)
    .find(node => node.props.field.name === 'Sân B2');
  await ReactTestRenderer.act(async () => {
    card?.props.onDelete();
  });
  expect(root.findAllByType(FieldCard)).toHaveLength(4);
  const buttons = alert.mock.calls[0][2];
  expect(buttons?.some(button => button.style === 'cancel')).toBe(true);
  const confirm = buttons?.find(button => button.style === 'destructive');
  expect(confirm).toBeDefined();
  await ReactTestRenderer.act(async () => {
    confirm?.onPress?.();
  });
  expect(root.findAllByType(FieldCard)).toHaveLength(3);
});

test('a failed load has a working retry instead of replacing the database', async () => {
  jest
    .spyOn(storage, 'getItem')
    .mockRejectedValueOnce(new Error('Read interrupted'));
  const root = await openApp();
  expect(
    root
      .findAllByType(Text)
      .some(node => node.props.children === 'Chưa mở được dữ liệu'),
  ).toBe(true);
  const retry = root
    .findAllByType(Button)
    .find(node => node.props.title === 'Thử lại');
  await ReactTestRenderer.act(async () => {
    retry?.props.onPress();
  });
  expect(root.findAllByType(FieldCard)).toHaveLength(4);
});

test('the shared form prefills an existing field and saves without a discard warning', async () => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  const root = await openApp();
  const card = root
    .findAllByType(FieldCard)
    .find(node => node.props.field.name === 'Sân A1');
  await ReactTestRenderer.act(async () => {
    card?.props.onEdit();
  });
  expect(
    root.findAllByType(FormInput).find(node => node.props.label === 'Tên sân')
      ?.props.value,
  ).toBe('Sân A1');
  await fill(root, 'Tên sân', 'Sân A1 mới');
  await fill(root, 'Giá thuê mỗi giờ (VNĐ)', '320000');
  await press(root, 'Lưu thay đổi');
  expect((await loadData()).fields[0]).toMatchObject({
    name: 'Sân A1 mới',
    pricePerHour: 320000,
  });
  expect(alert).not.toHaveBeenCalled();
});

test('the booking Modal updates the total, accepts an adjacent slot, and confirms cancellation', async () => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  const root = await openApp();
  const card = root
    .findAllByType(FieldCard)
    .find(node => node.props.field.name === 'Sân A1');
  await ReactTestRenderer.act(async () => {
    card?.props.onOpen();
  });
  await press(root, '+ Đặt sân');
  await fill(root, 'Tên khách hàng', 'Khách kiểm tra');
  await fill(root, 'Số điện thoại', '0909876543');
  await fill(root, 'Giờ bắt đầu', '19');
  await fill(root, 'Số giờ thuê', '2');
  expect(
    root.findAllByType(Text).some(node => node.props.children === '600.000 đ'),
  ).toBe(true);
  await press(root, 'Xác nhận đặt sân');
  const saved = await loadData();
  expect(saved.bookings).toHaveLength(4);
  expect(saved.bookings[3]).toMatchObject({
    customerName: 'Khách kiểm tra',
    startHour: 19,
    hours: 2,
  });
  const cancel = root
    .findAllByType(Button)
    .find(node =>
      node.props.accessibilityLabel?.includes(
        'Huỷ lượt đặt của Khách kiểm tra',
      ),
    );
  await ReactTestRenderer.act(async () => {
    cancel?.props.onPress();
  });
  expect((await loadData()).bookings).toHaveLength(4);
  const confirm = alert.mock.calls[0][2]?.find(
    button => button.style === 'destructive',
  );
  expect(confirm).toBeDefined();
  await ReactTestRenderer.act(async () => {
    confirm?.onPress?.();
  });
  expect((await loadData()).bookings).toHaveLength(3);
});

test('initial hydration shows a skeleton until saved fields have loaded', async () => {
  const saved = createSeedData();
  let resolveRead: (value: string | null) => void = () => {
    throw new Error('Read not started');
  };
  jest.spyOn(storage, 'getItem').mockImplementationOnce(
    () =>
      new Promise(resolve => {
        resolveRead = resolve;
      }),
  );
  const root = await openApp();
  expect(
    root.findAllByProps({ testID: 'field-list-skeleton' }).length,
  ).toBeGreaterThan(0);
  expect(root.findAllByType(FieldCard)).toHaveLength(0);
  await ReactTestRenderer.act(async () => {
    resolveRead(JSON.stringify(saved));
  });
  expect(root.findAllByProps({ testID: 'field-list-skeleton' })).toHaveLength(
    0,
  );
  expect(root.findAllByType(FieldCard)).toHaveLength(4);
});

test('pull to refresh shows skeletons and then displays the reloaded fields', async () => {
  const root = await openApp();
  const updated = await loadData();
  updated.fields[0].pricePerHour = 420000;
  let resolveRead: (value: string | null) => void = () => {
    throw new Error('Read not started');
  };
  jest.spyOn(storage, 'getItem').mockImplementationOnce(
    () =>
      new Promise(resolve => {
        resolveRead = resolve;
      }),
  );
  let pending: Promise<void> = Promise.resolve();
  await ReactTestRenderer.act(async () => {
    pending = root.findByType(FlatList).props.onRefresh();
  });
  expect(root.findByType(FlatList).props.refreshing).toBe(true);
  expect(
    root.findAllByProps({ testID: 'field-list-skeleton' }).length,
  ).toBeGreaterThan(0);
  expect(root.findAllByType(FieldCard)).toHaveLength(0);
  await ReactTestRenderer.act(async () => {
    resolveRead(JSON.stringify(updated));
    await pending;
  });
  expect(root.findByType(FlatList).props.refreshing).toBe(false);
  expect(root.findAllByType(FieldCard)[0].props.field.pricePerHour).toBe(
    420000,
  );
});

test('refreshing the booking list preserves the detail route and replaces its skeleton', async () => {
  const root = await openApp();
  const card = root.findAllByType(FieldCard)[0];
  await ReactTestRenderer.act(async () => {
    card.props.onOpen();
  });
  const saved = await loadData();
  let resolveRead: (value: string | null) => void = () => {
    throw new Error('Read not started');
  };
  jest.spyOn(storage, 'getItem').mockImplementationOnce(
    () =>
      new Promise(resolve => {
        resolveRead = resolve;
      }),
  );
  let pending: Promise<void> = Promise.resolve();
  await ReactTestRenderer.act(async () => {
    pending = root
      .findByType(FieldDetailScreen)
      .findByType(FlatList)
      .props.onRefresh();
  });
  expect(
    root.findByType(FieldDetailScreen).findByType(FlatList).props.refreshing,
  ).toBe(true);
  expect(
    root.findAllByProps({ testID: 'booking-list-skeleton' }).length,
  ).toBeGreaterThan(0);
  await ReactTestRenderer.act(async () => {
    resolveRead(JSON.stringify(saved));
    await pending;
  });
  expect(
    root.findByType(FieldDetailScreen).findByType(FlatList).props.refreshing,
  ).toBe(false);
  expect(root.findAllByProps({ testID: 'booking-list-skeleton' })).toHaveLength(
    0,
  );
});

test('refresh errors show an Alert and keep the previous fields available', async () => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  const root = await openApp();
  jest
    .spyOn(storage, 'getItem')
    .mockRejectedValueOnce(new Error('Read failed'));
  await ReactTestRenderer.act(async () => {
    await root.findByType(FlatList).props.onRefresh();
  });
  expect(alert).toHaveBeenCalledWith(
    'Không thể tải lại danh sách sân',
    'Read failed',
  );
  expect(root.findByType(FlatList).props.refreshing).toBe(false);
  expect(root.findAllByType(FieldCard)).toHaveLength(4);
});

test('catalog search, type chips and status filter work together', async () => {
  const root = await openApp();
  await pressControl(root, 'button', 'Sân 7 người');
  expect(
    root.findAllByType(FieldCard).map(card => card.props.field.name),
  ).toEqual(['Sân B1', 'Sân B2']);
  const search = root
    .findAllByType(TextInput)
    .find(
      input =>
        input.props.accessibilityLabel === 'Tìm sân theo tên hoặc loại sân',
    );
  await ReactTestRenderer.act(async () => {
    search?.props.onChangeText('5 người');
  });
  expect(root.findAllByType(FieldCard)).toHaveLength(0);
  await pressControl(root, 'button', 'Tất cả sân');
  expect(root.findAllByType(FieldCard)).toHaveLength(2);
  await ReactTestRenderer.act(async () => {
    search?.props.onChangeText('');
  });
  await pressControl(root, 'button', 'Lọc trạng thái sân');
  await pressControl(root, 'radio', 'Bảo trì');
  await press(root, 'Xong');
  expect(
    root.findAllByType(FieldCard).map(card => card.props.field.name),
  ).toEqual(['Sân B2']);
});

test('all four main tabs open their content and retain the field search', async () => {
  const root = await openApp();
  const search = root
    .findAllByType(TextInput)
    .find(
      input =>
        input.props.accessibilityLabel === 'Tìm sân theo tên hoặc loại sân',
    );
  await ReactTestRenderer.act(async () => {
    search?.props.onChangeText('Sân A1');
  });
  await pressControl(root, 'tab', 'Lịch đặt');
  expect(root.findAllByType(BookingsScreen)).toHaveLength(1);
  await pressControl(root, 'tab', 'Báo cáo');
  expect(root.findAllByType(ReportsScreen)).toHaveLength(1);
  expect(
    root
      .findByType(ReportsScreen)
      .findAllByType(Text)
      .some(node => node.props.children === '1.850.000 đ'),
  ).toBe(true);
  await pressControl(root, 'tab', 'Cài đặt');
  expect(root.findAllByType(SettingsScreen)).toHaveLength(1);
  await press(root, 'Tải lại dữ liệu');
  expect(
    root
      .findByType(SettingsScreen)
      .findAllByType(Text)
      .some(
        node => node.props.children === 'Đã tải lại dữ liệu trên thiết bị.',
      ),
  ).toBe(true);
  await pressControl(root, 'tab', 'Sân bóng');
  expect(search?.props.value).toBe('Sân A1');
  const selected = root.findAll(
    node =>
      node.props.accessibilityRole === 'tab' &&
      node.props.accessibilityLabel === 'Sân bóng',
  )[0];
  expect(selected?.props.accessibilityState.selected).toBe(true);
});

test('the redesigned add form saves only the original field properties', async () => {
  const root = await openApp();
  await press(root, '+ Thêm sân');
  await fill(root, 'Tên sân', 'Sân C1');
  await fill(root, 'Giá thuê mỗi giờ (VNĐ)', '500000');
  await pressControl(root, 'radio', 'Sân 7 người');
  await pressControl(root, 'radio', 'Bảo trì');
  await press(root, 'Thêm sân');
  const added = (await loadData()).fields.find(
    field => field.name === 'Sân C1',
  );
  expect(added).toMatchObject({
    type: '7 người',
    pricePerHour: 500000,
    status: 'Bảo trì',
  });
  expect(Object.keys(added ?? {}).sort()).toEqual([
    'id',
    'name',
    'pricePerHour',
    'status',
    'type',
  ]);
});

test('invalid form values show inline errors and cancelling asks before discarding edits', async () => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  const root = await openApp();
  await press(root, '+ Thêm sân');
  await fill(root, 'Tên sân', 'Sân A1');
  await fill(root, 'Giá thuê mỗi giờ (VNĐ)', '0');
  await press(root, 'Thêm sân');
  expect(
    root.findAllByType(FormInput).find(input => input.props.label === 'Tên sân')
      ?.props.error,
  ).toContain('đã tồn tại');
  expect(
    root
      .findAllByType(FormInput)
      .find(input => input.props.label === 'Giá thuê mỗi giờ (VNĐ)')?.props
      .error,
  ).toContain('lớn hơn 0');
  expect((await loadData()).fields).toHaveLength(4);
  await press(root, 'Huỷ bỏ');
  expect(alert.mock.calls[0][0]).toBe('Bỏ thay đổi chưa lưu?');
  expect((await loadData()).fields).toHaveLength(4);
  const discard = alert.mock.calls[0][2]?.find(
    button => button.style === 'destructive',
  );
  await ReactTestRenderer.act(async () => {
    discard?.onPress?.();
  });
  expect(root.findAllByType(FieldCard)).toHaveLength(4);
});

test('the detail calendar filters by day and passes the selected date into the booking form', async () => {
  const root = await openApp();
  await ReactTestRenderer.act(async () => {
    root.findAllByType(FieldCard)[0].props.onOpen();
  });
  const nextDay = new Date();
  nextDay.setDate(nextDay.getDate() + 1);
  const date = formatDate(nextDay);
  await pressControl(root, 'button', 'Xem lịch ngày ' + date);
  expect(
    root.findByType(FieldDetailScreen).findByType(FlatList).props.data,
  ).toHaveLength(0);
  await press(root, '+ Đặt sân');
  expect(
    root
      .findAllByType(FormInput)
      .find(input => input.props.label === 'Ngày đặt sân')?.props.value,
  ).toBe(date);
  await fill(root, 'Tên khách hàng', 'Khách ngày mai');
  await fill(root, 'Số điện thoại', '0901234567');
  await press(root, 'Xác nhận đặt sân');
  expect(
    root.findByType(FieldDetailScreen).findByType(FlatList).props.data,
  ).toHaveLength(1);
  expect(
    (await loadData()).bookings.find(
      booking => booking.customerName === 'Khách ngày mai',
    )?.date,
  ).toBe(date);
  await pressControl(root, 'button', 'Xem tất cả lịch đặt');
  expect(
    root.findByType(FieldDetailScreen).findByType(FlatList).props.data,
  ).toHaveLength(2);
});
