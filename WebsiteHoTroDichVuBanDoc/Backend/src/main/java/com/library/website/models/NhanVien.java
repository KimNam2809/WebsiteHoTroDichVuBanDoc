package com.library.website.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "nhanvien", schema = "public")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class NhanVien {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "manhanvien")
    private Long maNhanVien;

    @OneToOne
    @JoinColumn(name = "manguoidung", referencedColumnName = "manguoidung")
    private NguoiDung nguoiDung;

    @Column(name = "hoten", nullable = false)
    private String hoTen;

    @Column(name = "manhanviennoibo", unique = true)
    private String maNhanVienNoiBo;

    @Column(name = "phongban")
    private String phongBan;

    @Column(name = "chucvu")
    private String chucVu;

    @Column(name = "ngaytuyendung")
    private LocalDate ngayTuyenDung;

    @Column(name = "diachi", nullable = false)
    private String diaChi;

    @Column(name = "maphuongxa")
    private Long maPhuongXa;

    @Column(name = "ghichu")
    private String ghiChu;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
