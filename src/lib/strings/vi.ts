export const vi = {
  navigation: {
    home: 'Trang chủ', explore: 'Khám phá', createTrip: 'Tạo lịch trình',
    map: 'Bản đồ', me: 'Tôi', myTrips: 'Chuyến đi của tôi', signIn: 'Đăng nhập',
  },
  layout: {
    primaryNavigation: 'Điều hướng chính', mobileNavigation: 'Điều hướng trên điện thoại',
    accountNavigation: 'Điều hướng tài khoản', adminNavigation: 'Điều hướng quản trị',
    exitFlow: 'Thoát quy trình', exploreHue: 'Khám phá Huế', admin: 'Quản trị nội dung',
    about: 'Giới thiệu', privacy: 'Chính sách bảo mật', osmCredit: '© OpenStreetMap contributors',
    accountTrips: 'Chuyến đi', saved: 'Đã lưu', settings: 'Cài đặt', places: 'Địa điểm', csvImport: 'Import CSV',
  },
  pages: {
    home: 'Lịch trình Huế, đúng gu của bạn', explore: 'Khám phá Huế', place: 'Chi tiết địa điểm',
    map: 'Bản đồ Huế', about: 'Giới thiệu', privacy: 'Chính sách bảo mật', plan: 'Tạo lịch trình',
    generating: 'Đang tạo lịch trình', draft: 'Lịch trình nháp', trip: 'Lịch trình của bạn',
    sharedTrip: 'Lịch trình được chia sẻ', login: 'Đăng nhập', register: 'Đăng ký',
    forgotPassword: 'Quên mật khẩu', resetPassword: 'Đặt lại mật khẩu', authCallback: 'Đang xác thực',
    trips: 'Chuyến đi của tôi', saved: 'Địa điểm đã lưu', accountSettings: 'Cài đặt tài khoản',
    places: 'Địa điểm', addPlace: 'Thêm địa điểm', editPlace: 'Chỉnh sửa địa điểm', csvImport: 'Import CSV',
  },
  system: {
    loading: 'Đang tải…', notFoundTitle: 'Không tìm thấy trang này',
    notFoundBody: 'Có thể đường dẫn đã thay đổi hoặc không còn tồn tại.',
    forbiddenTitle: 'Bạn chưa có quyền truy cập', errorTitle: 'Đã có lỗi xảy ra',
    placeholder: 'Trang này sẽ được bổ sung ở bước tiếp theo.',
    backHome: 'Về trang chủ', createTrip: 'Tạo lịch trình',
    back: 'Quay lại', retry: 'Thử lại', goHome: 'Về trang chủ',
    errorBody: 'Bạn thử tải lại trang nhé.', serviceConnectionError: 'Không thể kết nối đến dịch vụ. Vui lòng thử lại.',
  },
} as const
