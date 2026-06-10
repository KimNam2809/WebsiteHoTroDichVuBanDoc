package com.library.website.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "bandoc", schema = "public")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class BanDoc {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "mabandoc")
    private Long maBanDoc;

    @OneToOne
    @JoinColumn(name = "manguoidung", referencedColumnName = "manguoidung")
    private NguoiDung nguoiDung;

    @Column(name = "hoten", nullable = false)
    private String hoTen;

    @Column(name = "ngaysinh", nullable = false)
    private LocalDate ngaySinh;

    @Column(name = "gioitinh", nullable = false)
    private String gioiTinh;

    @Column(name = "cccd", nullable = false)
    private String cccd;

    @Column(name = "diachi", nullable = false)
    private String diaChi;

    @Column(name = "maphuongxa")
    private Long maPhuongXa;

    @Column(name = "nghenghiep")
    private String ngheNghiep;

    // Lưu JSON dưới dạng chuỗi Text/Jsonb
    @Column(name = "thongtinbosung", columnDefinition = "jsonb")
    private String thongTinBoSung;

    @Column(name = "ngaydangky")
    private LocalDateTime ngayDangKy = LocalDateTime.now();

    @Column(name = "solanvangmat")
    private Integer soLanVangMat = 0;

    @Column(name = "ngayhethancamdat")
    private LocalDateTime ngayHetHanCamDat;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
