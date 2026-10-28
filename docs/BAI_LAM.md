# FootballFieldApp — Quản lý sân bóng mini

Ứng dụng React Native CLI, TypeScript, chạy hoàn toàn bằng dữ liệu trên thiết bị.
Giao diện tiếng Việt, dùng component React Native và `StyleSheet.create`.

## Chạy ứng dụng

Trong PowerShell, mở terminal ở `D:\TH_APP\giua-ky`:

```powershell
npm.cmd install
npm.cmd start
```

Mở terminal thứ hai, kết nối điện thoại có USB debugging hoặc mở máy ảo:

```powershell
npm.cmd run android
```

Sau khi thêm thư viện native, cần chạy lại lệnh Android; chỉ Reload JavaScript
không cập nhật được các module native.

## Cấu trúc mã nguồn

```text
App.tsx                         Khởi tạo safe area, dữ liệu và điều hướng
src/
  types/index.ts                Kiểu Sân, Lượt đặt, dữ liệu form và route
  theme/colors.ts               Bảng màu chung
  theme/index.ts                Cỡ chữ, khoảng cách, bo góc và bóng đổ
  components/
    ui.tsx                      Nút, input, lựa chọn, nhãn trạng thái, header
    FieldCard.tsx               Thẻ sân trong FlatList
    Icon.tsx                    Bộ biểu tượng vẽ bằng component React Native
    Skeleton.tsx                Placeholder tải danh sách sân và lịch đặt
    BookingModal.tsx            Form đặt sân và thành tiền trực tiếp
  screens/
    FieldListScreen.tsx         Danh sách, thống kê, tìm kiếm, lọc và xoá sân
    FieldFormScreen.tsx         Form dùng chung cho thêm/sửa
    FieldDetailScreen.tsx       Thông tin sân, lịch đặt và huỷ lượt đặt
    MainTabs.tsx                Thanh 4 tab, giữ trạng thái khi chuyển tab
    OverviewScreens.tsx         Lịch đặt toàn cụm, báo cáo và cài đặt
  navigation/AppNavigator.tsx   Native Stack cho màn chính, form và chi tiết
  context/AppContext.tsx        State chung, tải ban đầu và tuần tự hoá ghi dữ liệu
  data/
    seed.ts                     Khởi tạo 4 sân, 3 lượt đặt lần đầu
    operations.ts               Các thao tác dữ liệu và bảo vệ ràng buộc
    storage.ts                  Đọc/ghi AsyncStorage, kiểm tra dữ liệu đã lưu
  utils/
    validation.ts               Kiểm tra form, tên trùng và lịch giao nhau
    format.ts                   Định dạng tiền, ngày, giờ và tự sinh ID
  hooks/useReducedMotion.ts     Tôn trọng cài đặt giảm chuyển động
```

## Đối chiếu đề bài

| Câu | Đã triển khai                                                                                                                               |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | FlatList, tên/loại/giá sân, nhãn xanh/cam, số sân hoạt động trên tổng số                                                                    |
| 2   | Nút Thêm sân, Stack Navigation, form thêm/sửa dùng chung, điền sẵn dữ liệu, lựa chọn loại/trạng thái, lỗi dưới input                        |
| 3   | Xác nhận xoá bằng Alert; chặn xoá sân có bất kỳ lượt đặt nào                                                                                |
| 4   | Chi tiết sân và danh sách lượt đặt, Modal đặt sân, thành tiền tính trực tiếp, vô hiệu hoá đặt sân bảo trì                                   |
| 5   | Số điện thoại, ngày thực tế, giờ bắt đầu/thời lượng/giờ kết thúc, chống trùng lịch, xác nhận huỷ lượt đặt                                   |
| 6   | AsyncStorage lưu chung hai danh sách; khởi tạo mẫu một lần; giữ dữ liệu khi mở lại                                                          |
| 7   | Theme chung, font hệ thống, thẻ bo góc có bóng, phản hồi nhấn, nút disabled, trạng thái rỗng, lỗi viền đỏ, safe area, bàn phím và cuộn form |

## Nguyên tắc dữ liệu

- Tên sân được so sánh sau khi bỏ khoảng trắng thừa, chuẩn hoá Unicode và bỏ
  phân biệt hoa/thường. Khi sửa, tên của chính sân đó vẫn được chấp nhận.
- Số điện thoại phải khớp `^0\d{9}$`.
- Ngày phải đúng `dd/mm/yyyy` và tồn tại trong lịch; có kiểm tra năm nhuận.
- Giờ bắt đầu từ 6 đến 22, thời lượng từ 1 đến 3, giờ kết thúc tối đa 23.
- Hai lịch trùng khi cùng sân, cùng ngày và:
  `bắt_đầu_mới < kết_thúc_cũ && kết_thúc_mới > bắt_đầu_cũ`.
  Vì vậy 17–19 giao với 18–20; 19–20 được phép đặt sau 17–19.
- Các thao tác ghi được xếp hàng, kiểm tra lại trên dữ liệu mới nhất, và chỉ
  cập nhật giao diện sau khi lưu thành công. Lỗi ghi giữ lại form để thử lại.
- Kéo xuống từ đầu danh sách sân hoặc lịch đặt để đọc lại AsyncStorage.
  Skeleton hiển thị trong lần mở đầu và trong lúc tải lại thực tế, không thêm
  thời gian chờ giả. Tải lại dùng chung hàng đợi với thao tác ghi, giữ màn
  hình đang mở và dữ liệu hiện có nếu đọc lỗi; có thể kéo xuống thử lại.
  Skeleton dùng Animated của React Native và tắt nhấp nháy khi bật Giảm chuyển động.
- Dữ liệu rỗng đã lưu vẫn được giữ rỗng; không tự tạo lại mẫu. Dữ liệu hỏng
  hoặc lỗi đọc hiển thị trạng thái lỗi/Thử lại, không tự ghi đè dữ liệu cũ.
- Tất cả thao tác xoá sân và huỷ lượt đặt đều đi qua Alert xác nhận. Logic dữ
  liệu cũng chặn xoá sân đang có lịch để tránh lượt đặt không còn sân.

## Thiết kế theo mobile-design

Hướng thiết kế: công cụ quản lý cụm sân dành cho chủ sân, ưu tiên Android,
giao diện gọn, dễ đọc và dễ thao tác một tay. Mức biến tấu 4/10, chuyển động
2/10, mật độ thông tin 5/10. Xanh sân cỏ là màu chính; xanh lá/cam biểu thị
trạng thái kèm nhãn chữ. Font hệ thống, thang khoảng cách đều, một bộ nút và
input dùng chung. Không dùng thư viện UI dựng sẵn hay animation phụ thuộc
thư viện ngoài danh sách cho phép.

Danh sách có thanh tìm theo tên/loại sân, nút Thêm sân bên cạnh, bộ lọc
5 người/7 người và hộp lọc trạng thái. Thẻ sân dùng ảnh minh hoạ đóng gói
trong ứng dụng, nhãn trạng thái trên ảnh, giá thuê và nút chi tiết/sửa/xoá.
Ảnh và prompt được ghi tại [assets/fields/README.md](../assets/fields/README.md).

Thanh dưới gồm Sân bóng, Lịch đặt, Báo cáo, Cài đặt; được viết bằng Pressable,
không thêm thư viện bottom-tabs. Lịch đặt tổng hợp dữ liệu đã lưu; báo cáo
tính giá trị lịch theo đơn giá hiện tại, không coi đó là doanh thu đã thu.
Cài đặt cho phép tải lại dữ liệu và xem hướng dẫn. Chuyển tab giữ bộ lọc,
tìm kiếm và nội dung đã mở; Back Android từ tab phụ trở về Sân bóng.

Form thêm/sửa theo bố cục ảnh bìa, input có biểu tượng, nút chọn loại sân và
trạng thái, hai nút Lưu/Huỷ cố định phía dưới. Ảnh bìa là minh hoạ cố định;
chỉ giữ các trường gốc của đề, không thêm tiện ích hay loại sân ngoài 5/7 người.

Chi tiết sân có ảnh bìa, ba ô loại sân/đơn giá/trạng thái, thanh chọn ngày
và thẻ lịch đặt theo khung giờ. Chọn ngày sẽ lọc lịch và điền sẵn ngày đó khi
mở Modal đặt sân. Nút Tất cả vẫn cho xem toàn bộ lịch của sân. Số lượt trong
từng ngày lấy từ dữ liệu đã lưu; nhãn Đã đặt không đại diện cho thanh toán.

Form có nhãn luôn hiển thị, lỗi sau khi rời ô hoặc gửi form, trạng thái đang
lưu và chống gửi lặp. Vùng bấm tối thiểu 48, text giữ cài đặt phóng to của hệ
thống. Các màn hình có safe area; form dùng KeyboardAvoidingView/ScrollView.
Giao diện hiện dùng bảng màu sáng thống nhất. Native Stack giữ thao tác quay
lại của hệ điều hành; Modal có nút Đóng và xử lý nút Back Android.

## Kiểm tra

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test -- --runInBand --watch=false
```

Thử thủ công các luồng:

1. Lần mở đầu thấy 4 sân, trong đó 3 sân hoạt động; có 3 lượt đặt mẫu.
2. Thêm sân tên rỗng/trùng hoặc giá 0: lỗi dưới ô nhập, viền đỏ.
3. Sửa tên, loại, giá, trạng thái rồi kiểm tra lại ở danh sách/chi tiết.
4. Xoá sân A1 đang có lịch: Alert báo không thể xoá.
5. Xoá sân B2 không có lịch: Huỷ giữ nguyên; Xoá mới thực hiện.
6. Với ngày mẫu của sân A1 có 17–19, thử 18–20 (bị chặn), 19–20 (hợp lệ).
7. Nhập số điện thoại sai, ngày 31/02, 22 giờ + 2 giờ: báo lỗi rõ ràng.
8. Đổi số giờ từ 1 sang 2: thành tiền cập nhật ngay.
9. Mở sân bảo trì: nút Đặt sân bị vô hiệu hoá, có giải thích.
10. Huỷ lượt đặt: chỉ xoá khi xác nhận; khung giờ được đặt lại.
11. Tắt/mở ứng dụng: các thay đổi vẫn còn. Cuộn form khi bàn phím mở.

Kiểm tra native iOS cần macOS/Xcode và cài CocoaPods. Việc kiểm tra Android
không thay thế kiểm tra bàn phím, cỡ chữ và VoiceOver trên iOS.
