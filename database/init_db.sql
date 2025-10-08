-- ==============================================
--  KHỞI TẠO DATABASE. CHẠY RIÊNG PHẦN NÀY ĐỂ TẠO DATABASE.
-- ==============================================
-- DROP DATABASE IF EXISTS website_htbd;
CREATE DATABASE website_htbd
    WITH OWNER = postgres
    ENCODING = 'UTF8'
    CONNECTION LIMIT = -1;

-- ==============================================
--  BẮT ĐẦU CHẠY QUERY Ở ĐÂY ĐỂ TẠO BẢNG
-- ==============================================
-- ==============================================

-- ==============================================
--  ENUM TYPES
-- ==============================================
CREATE TYPE loaiVaiTro AS ENUM ('banDoc', 'nhanVien', 'quanTriVien');
CREATE TYPE loaiPhongBan AS ENUM ('giamDoc', 'nghiepVu', 'congTacBanDoc', 'hanhChinhToChuc', 'tinHoc');
CREATE TYPE loaiGioiTinh AS ENUM ('nam', 'nu');
CREATE TYPE kieuThe AS ENUM ('doc', 'muon', 'thieuNhi', 'shub');
CREATE TYPE loaiYeuCauThe AS ENUM ('daYeuCau', 'dangXuLy', 'duocDuyet', 'tuChoi');
CREATE TYPE trangThaiVanChuyen AS ENUM ('dangChuanBi', 'dangVanChuyen', 'daGiaoHang', 'giaoHangThatBai');
CREATE TYPE tinhTrangMuon AS ENUM ('daMuon', 'daTra', 'quaHan');
CREATE TYPE tinhTrangDatTruoc AS ENUM ('kichHoat', 'daHuy', 'daHoanThanh');
CREATE TYPE tinhTrangGiao AS ENUM ('daYeuCau', 'dangTienHanh', 'daHoanThanh', 'daHuy');
CREATE TYPE tinhTrangPhong AS ENUM ('moCua', 'daDong', 'dangBaoTri');
CREATE TYPE tinhTrangChoNgoi AS ENUM ('coSan', 'daDatTruoc', 'dangSuDung');
CREATE TYPE tinhTrangDatCho AS ENUM ('kichHoat', 'daHuy', 'daHoanThanh');
CREATE TYPE tinhTrangDatPhong AS ENUM ('kichHoat', 'daHuy', 'daHoanThanh');

-- ==============================================
--  CÁC BẢNG DỮ LIỆU
-- ==============================================

-- 1. TinhThanhPho
CREATE TABLE TinhThanhPho (
  maTinhThanhPho BIGSERIAL PRIMARY KEY,
  tenTinhThanhPho TEXT UNIQUE NOT NULL
);

-- 2. PhuongXa
CREATE TABLE PhuongXa (
  maPhuongXa BIGSERIAL PRIMARY KEY,
  tenPhuongXa TEXT UNIQUE NOT NULL,
  maTinhThanhPho BIGINT REFERENCES TinhThanhPho(maTinhThanhPho)
);

-- 3. NguoiDung
CREATE TABLE NguoiDung (
  maNguoiDung BIGSERIAL PRIMARY KEY,
  tenDangNhap TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE,
  soDienThoai TEXT,
  passwordHash TEXT NOT NULL,
  vaiTro loaiVaiTro NOT NULL DEFAULT 'banDoc',
  trangThai BOOLEAN DEFAULT TRUE,
  ngayTao TIMESTAMPTZ DEFAULT now()
);

-- 4. NhanVien
CREATE TABLE NhanVien (
  maNhanVien BIGSERIAL PRIMARY KEY,
  maNguoiDung BIGINT UNIQUE REFERENCES NguoiDung(maNguoiDung),
  hoTen TEXT NOT NULL,
  maNhanVienNoiBo TEXT UNIQUE,
  phongBan loaiPhongBan,
  chucVu TEXT,
  ngayTuyenDung DATE,
  diaChi TEXT NOT NULL,
  maPhuongXa BIGINT REFERENCES PhuongXa(maPhuongXa),
  ghiChu TEXT
);

-- 5. BanDoc
CREATE TABLE BanDoc (
  maBanDoc BIGSERIAL PRIMARY KEY,
  maNguoiDung BIGINT UNIQUE REFERENCES NguoiDung(maNguoiDung),
  hoTen TEXT NOT NULL,
  ngaySinh DATE NOT NULL,
  gioiTinh loaiGioiTinh NOT NULL,
  cccd_cmnd TEXT NOT NULL,
  diaChi TEXT NOT NULL,
  maPhuongXa BIGINT REFERENCES PhuongXa(maPhuongXa),
  email TEXT,
  soDienThoai TEXT NOT NULL,
  ngheNghiep TEXT,
  thongTinBoSung JSONB,
  ngayDangKy TIMESTAMPTZ DEFAULT now()
);

-- 6. LoaiThe
CREATE TABLE LoaiThe (
  maLoaiThe SMALLSERIAL PRIMARY KEY,
  tenThe kieuThe UNIQUE NOT NULL,
  moTa TEXT,
  taiLieuMuonToiDa INT DEFAULT 3,
  soNgayMuonMacDinh INT DEFAULT 14
);

-- 7. YeuCauThe
CREATE TABLE YeuCauThe (
  maYeuCauThe BIGSERIAL PRIMARY KEY,
  maBanDoc BIGINT REFERENCES BanDoc(maBanDoc),
  maLoaiThe SMALLINT REFERENCES LoaiThe(maLoaiThe),
  thoiGianBatDau TIMESTAMPTZ DEFAULT now(),
  hinhThucYeuCau TEXT,
  thongTinBoSung JSONB,
  lePhi NUMERIC(10,2) DEFAULT 0,
  trangThaiQuyTrinh loaiYeuCauThe DEFAULT 'daYeuCau',
  maNhanVien BIGINT REFERENCES NhanVien(maNhanVien),
  thoiGianXuLy TIMESTAMPTZ,
  noiNhanThe TEXT,
  maPhuongXa BIGINT REFERENCES PhuongXa(maPhuongXa),
  thoiGianDuKien TIMESTAMPTZ,
  ghiChu TEXT
);

-- 8. VanChuyen
CREATE TABLE VanChuyen (
  maVanChuyen BIGSERIAL PRIMARY KEY,
  maYeuCauThe BIGINT REFERENCES YeuCauThe(maYeuCauThe),
  donViVanChuyen TEXT,
  maTheoDoi TEXT UNIQUE,
  nguoiGui TEXT,
  nguoiNhan TEXT,
  diaChiNhan TEXT,
  maPhuongXa BIGINT REFERENCES PhuongXa(maPhuongXa),
  soDienThoaiNhanHang TEXT,
  trangThai trangThaiVanChuyen DEFAULT 'dangChuanBi',
  thoiGianGiaoHang TIMESTAMPTZ,
  thoiGianGiaoHangThanhCong TIMESTAMPTZ,
  chiPhiVanChuyen NUMERIC(10,2),
  ghiChu TEXT
);

-- 9. TheBanDoc
CREATE TABLE TheBanDoc (
  maThe BIGSERIAL PRIMARY KEY,
  maBanDoc BIGINT REFERENCES BanDoc(maBanDoc),
  maLoaiThe SMALLINT REFERENCES LoaiThe(maLoaiThe),
  soThe TEXT UNIQUE NOT NULL,
  maNhanVien BIGINT REFERENCES NhanVien(maNhanVien),
  ngayPhatHanh TIMESTAMPTZ DEFAULT now(),
  ngayHetHan DATE,
  phuongThucVanChuyen TEXT,
  maVanChuyen BIGINT REFERENCES VanChuyen(maVanChuyen),
  trangThaiThe BOOLEAN DEFAULT TRUE,
  thongTinBoSung JSONB
);

-- 10. DanhMuc
CREATE TABLE DanhMuc (
  maDanhMuc BIGSERIAL PRIMARY KEY,
  tenDanhMuc TEXT NOT NULL,
  maDanhMucCha BIGINT REFERENCES DanhMuc(maDanhMuc) ON DELETE SET NULL
);

-- 11. TuKhoa
CREATE TABLE TuKhoa (
  maTuKhoa BIGSERIAL PRIMARY KEY,
  tenTuKhoa TEXT NOT NULL,
  maTuKhoaCha BIGINT REFERENCES TuKhoa(maTuKhoa) ON DELETE SET NULL
);

-- 12. TacPham
CREATE TABLE TacPham (
  maTacPham BIGSERIAL PRIMARY KEY,
  tenTacPham TEXT NOT NULL,
  tacGia TEXT,
  moTa TEXT,
  isbn TEXT UNIQUE,
  namXuatBan INT,
  ngayTao TIMESTAMPTZ DEFAULT now()
);

-- 13. TacPham_DanhMuc
CREATE TABLE TacPham_DanhMuc (
  maTacPham BIGINT REFERENCES TacPham(maTacPham),
  maDanhMuc BIGINT REFERENCES DanhMuc(maDanhMuc),
  PRIMARY KEY(maTacPham, maDanhMuc)
);

-- 14. TacPham_TuKhoa
CREATE TABLE TacPham_TuKhoa (
  maTacPham BIGINT REFERENCES TacPham(maTacPham),
  maTuKhoa BIGINT REFERENCES TuKhoa(maTuKhoa),
  PRIMARY KEY(maTacPham, maTuKhoa)
);

-- 15. BanSao
CREATE TABLE BanSao (
  maBanSao BIGSERIAL PRIMARY KEY,
  maTacPham BIGINT REFERENCES TacPham(maTacPham),
  maBanSaoNoiBo TEXT UNIQUE,
  viTri TEXT,
  viTriKeNgan TEXT,
  dinhDangBanSao TEXT,
  ngayMua DATE,
  trangThaiVatLy TEXT,
  trangThaiChoMuon BOOLEAN DEFAULT TRUE,
  ngayNhap TIMESTAMPTZ DEFAULT now()
);

-- 16. MuonTra
CREATE TABLE MuonTra (
  maMuonTra BIGSERIAL PRIMARY KEY,
  maBanSao BIGINT REFERENCES BanSao(maBanSao),
  maBanDoc BIGINT REFERENCES BanDoc(maBanDoc),
  maNhanVien BIGINT REFERENCES NhanVien(maNhanVien),
  thoiGianMuon TIMESTAMPTZ DEFAULT now(),
  ngayTra DATE,
  ngayTraThucTe TIMESTAMPTZ,
  trangThaiMuon tinhTrangMuon DEFAULT 'daMuon',
  soLanGiaHan SMALLINT DEFAULT 0,
  soLanGiaHanToiDa SMALLINT DEFAULT 2,
  tienPhat NUMERIC(10,2) DEFAULT 0,
  ghiChu TEXT
);

-- 17. GiaHan
CREATE TABLE GiaHan (
  maGiaHan BIGSERIAL PRIMARY KEY,
  maMuonTra BIGINT REFERENCES MuonTra(maMuonTra),
  maNhanVien BIGINT REFERENCES NhanVien(maNhanVien),
  thoiDiemGiaHan TIMESTAMPTZ DEFAULT now(),
  ngayTraMoi DATE,
  lyDoGiaHan TEXT
);

-- 18. DatTruoc
CREATE TABLE DatTruoc (
  maDatTruoc BIGSERIAL PRIMARY KEY,
  maBanSao BIGINT REFERENCES BanSao(maBanSao),
  maBanDoc BIGINT REFERENCES BanDoc(maBanDoc),
  thoiDiemDatTruoc TIMESTAMPTZ DEFAULT now(),
  trangThaiDatTruoc tinhTrangDatTruoc DEFAULT 'kichHoat',
  hinhThucThongBao TEXT,
  thoiDiemHoanThanh TIMESTAMPTZ,
  ghiChu TEXT
);

-- 19. YeuCauGiao
CREATE TABLE YeuCauGiao (
  maYeuCauGiao BIGSERIAL PRIMARY KEY,
  maBanDoc BIGINT REFERENCES BanDoc(maBanDoc),
  maMuonTra BIGINT REFERENCES MuonTra(maMuonTra),
  hinhThucYeuCau TEXT NOT NULL,
  diaChi TEXT NOT NULL,
  maPhuongXa BIGINT REFERENCES PhuongXa(maPhuongXa),
  soDienThoai TEXT,
  thoiGianYeuCau TIMESTAMPTZ DEFAULT now(),
  maNhanVien BIGINT REFERENCES NhanVien(maNhanVien),
  trangThai tinhTrangGiao DEFAULT 'daYeuCau',
  thoiGianCoTheNhanHang TIMESTAMPTZ,
  thoiGianNhanHangThucTe TIMESTAMPTZ,
  lePhi NUMERIC(10, 2),
  thongTinBoSung JSONB,
  ghiChu TEXT
);

-- 20. Phong
CREATE TABLE Phong (
  maPhong BIGSERIAL PRIMARY KEY,
  tenPhong TEXT NOT NULL,
  loaiPhong TEXT,
  sucChua INT,
  viTri TEXT,
  trangThai tinhTrangPhong DEFAULT 'moCua',
  thongTinThietBiTaiPhong JSONB,
  ghiChu TEXT
);

-- 21. ChoNgoi
CREATE TABLE ChoNgoi (
  maChoNgoi BIGSERIAL PRIMARY KEY,
  maPhong BIGINT REFERENCES Phong(maPhong),
  tenChoNgoi TEXT,
  loaiChoNgoi TEXT,
  trangThai tinhTrangChoNgoi DEFAULT 'coSan',
  choNgoiTrucTiep BOOLEAN DEFAULT FALSE,
  ghiChu TEXT
);

-- 22. DatChoNgoi
CREATE TABLE DatChoNgoi (
  maDatCho BIGSERIAL PRIMARY KEY,
  maChoNgoi BIGINT REFERENCES ChoNgoi(maChoNgoi),
  maBanDoc BIGINT REFERENCES BanDoc(maBanDoc),
  maNhanVien BIGINT REFERENCES NhanVien(maNhanVien),
  thoiGianBatDau TIMESTAMPTZ NOT NULL,
  thoiGianKetThuc TIMESTAMPTZ NOT NULL,
  trangThaiDatCho tinhTrangDatCho DEFAULT 'kichHoat',
  ngayKhoiTao TIMESTAMPTZ DEFAULT now(),
  thoiDiemHuy TIMESTAMPTZ,
  nhanVienHuy BIGINT REFERENCES NhanVien(maNhanVien)
);

-- 23. DatPhong
CREATE TABLE DatPhong (
  maDatPhong BIGSERIAL PRIMARY KEY,
  maPhong BIGINT REFERENCES Phong(maPhong),
  nguoiToChuc TEXT NOT NULL,
  soDienThoai TEXT NOT NULL,
  thoiGianBatDau TIMESTAMPTZ NOT NULL,
  thoiGianKetThuc TIMESTAMPTZ NOT NULL,
  mucDichSuDung TEXT,
  soNguoiThamDuDuKien INT DEFAULT 0,
  trangThai tinhTrangDatPhong DEFAULT 'kichHoat',
  maNhanVien BIGINT REFERENCES NhanVien(maNhanVien),
  ngayKhoiTao TIMESTAMPTZ DEFAULT now()
);

-- 24. ThietBi
CREATE TABLE ThietBi (
  maThietBi BIGSERIAL PRIMARY KEY,
  maThietBiNoiBo TEXT UNIQUE,
  tenThietBi TEXT,
  loaiThietBi TEXT,
  maPhong BIGINT REFERENCES Phong(maPhong),
  ngayMua DATE,
  hanBaoHanh DATE,
  trangThai TEXT,
  thongTinBoSung JSONB,
  ghiChu TEXT
);

-- 25. ThongBao
CREATE TABLE ThongBao (
  maThongBao BIGSERIAL PRIMARY KEY,
  maBanDoc BIGINT REFERENCES BanDoc(maBanDoc),
  hinhThuc TEXT,
  tieuDe TEXT,
  noiDung TEXT,
  duLieuGoc JSONB,
  thoiGianGui TIMESTAMPTZ,
  trangThai TEXT,
  thamChieu TEXT,
  soLanGui INT DEFAULT 0
);

-- 26. BaiViet
CREATE TABLE BaiViet (
  maBaiViet BIGSERIAL PRIMARY KEY,
  maNhanVien BIGINT REFERENCES NhanVien(maNhanVien) ON DELETE SET NULL,
  tieuDe TEXT NOT NULL,
  noiDung TEXT NOT NULL,
  hinhAnh JSONB,
  ngayDang TIMESTAMPTZ DEFAULT now(),
  ngayCapNhat TIMESTAMPTZ,
  trangThai BOOLEAN DEFAULT TRUE,
  soLuotXem INT DEFAULT 0,
  soLuotChiaSe INT DEFAULT 0,
  ghiChu TEXT
);

-- 27. TuKhoa_BaiViet
CREATE TABLE TuKhoa_BaiViet (
	maBaiViet BIGINT REFERENCES BaiViet(maBaiViet),
  	maTuKhoa BIGINT REFERENCES TuKhoa(maTuKhoa),
  	PRIMARY KEY(maBaiViet, maTuKhoa)
);

-- MẪU ALTER COLUMN
-- ADD COLUMN
ALTER TABLE BaiViet
ADD COLUMN trangThai BOOLEAN DEFAULT TRUE;
-- UPDATE COLUMN
ALTER TABLE BaiViet
ALTER COLUMN noiDung TYPE VARCHAR(5000);
-- UPDATE NAME COLUMN
ALTER TABLE BaiViet
RENAME COLUMN tieuDe TO tieuDeBaiViet;
-- DROP COLUMN
ALTER TABLE BaiViet
DROP COLUMN choPhepChiaSe;
-- ADD CONSTRAINT
ALTER TABLE BaiViet
ADD COLUMN maDanhMuc BIGINT,
ADD CONSTRAINT fk_baiviet_danhmuc FOREIGN KEY (maDanhMuc) REFERENCES DanhMuc(maDanhMuc);
-- RENAME TABLE
ALTER TABLE BaiViet
RENAME TO BaiVietThuVien;
-- DROP TABLE
DROP TABLE IF EXISTS BaiViet CASCADE;


