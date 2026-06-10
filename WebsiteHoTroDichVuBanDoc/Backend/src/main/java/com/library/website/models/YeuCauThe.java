package com.library.website.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "yeucauthe", schema = "public")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class YeuCauThe {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "mayeucauthe")
    private Long maYeuCauThe;

    @ManyToOne
    @JoinColumn(name = "mabandoc")
    private BanDoc banDoc;

    @ManyToOne
    @JoinColumn(name = "maloaithe")
    private LoaiThe loaiThe;

    @Column(name = "thoigianbatdau")
    private LocalDateTime thoiGianBatDau = LocalDateTime.now();

    @Column(name = "hinhthucyeucau", nullable = false)
    private String hinhThucYeuCau; // 'Online', 'TaiQuay'

    @Column(name = "thongtinbosung", columnDefinition = "jsonb")
    private String thongTinBoSung;

    @Column(name = "lephi")
    private BigDecimal lePhi = BigDecimal.ZERO;

    @Column(name = "trangthaiquytrinh")
    private String trangThaiQuyTrinh = "daYeuCau";

    @Column(name = "manhanvien")
    private Long maNhanVien;

    @Column(name = "thoigianxuly")
    private LocalDateTime thoiGianXuLy;

    @Column(name = "noinhanthe")
    private String noiNhanThe;

    @Column(name = "maphuongxa")
    private Long maPhuongXa;

    @Column(name = "thoigiandukien")
    private LocalDateTime thoiGianDuKien;

    @Column(name = "ghichu")
    private String ghiChu;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
