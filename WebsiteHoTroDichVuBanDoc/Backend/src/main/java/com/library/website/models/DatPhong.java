package com.library.website.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "datphong", schema = "public")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DatPhong {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "madatphong")
    private Long maDatPhong;

    @ManyToOne
    @JoinColumn(name = "maphong")
    private Phong phong;

    @Column(name = "nguoitochuc", nullable = false)
    private String nguoiToChuc;

    @Column(name = "sodienthoai", nullable = false)
    private String soDienThoai;

    @Column(name = "thoigianbatdau", nullable = false)
    private LocalDateTime thoiGianBatDau;

    @Column(name = "thoigianketthuc", nullable = false)
    private LocalDateTime thoiGianKetThuc;

    @Column(name = "mucdichsudung")
    private String mucDichSuDung;

    @Column(name = "songuoithamdudukien")
    private Integer soNguoiThamDuDuKien = 0;

    @Column(name = "trangthai")
    private String trangThai = "kichHoat"; // 'kichHoat', 'daHuy', 'hoanThanh'

    @Column(name = "manhanvien")
    private Long maNhanVien;

    @Column(name = "ngaykhoitao")
    private LocalDateTime ngayKhoiTao = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
