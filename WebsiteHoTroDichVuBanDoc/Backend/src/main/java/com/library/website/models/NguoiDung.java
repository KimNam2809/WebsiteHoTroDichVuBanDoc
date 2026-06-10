package com.library.website.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "nguoidung", schema = "public")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class NguoiDung {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "manguoidung")
    private Long maNguoiDung;

    @Column(name = "tendangnhap", unique = true, nullable = false)
    private String tenDangNhap;

    @Column(name = "email", unique = true)
    private String email;

    @Column(name = "sodienthoai")
    private String soDienThoai;

    @Column(name = "matkhau", nullable = false)
    private String matKhau;

    @Column(name = "vaitro", nullable = false)
    private String vaiTro; // 'nguoiDung', 'nhanVien'

    @Column(name = "trangthai")
    private Boolean trangThai = true;

    @Column(name = "ngaytao")
    private LocalDateTime ngayTao = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
