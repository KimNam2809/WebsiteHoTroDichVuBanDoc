package com.library.website.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "datchongoi", schema = "public")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DatChoNgoi {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "madatcho")
    private Long maDatCho;

    @ManyToOne
    @JoinColumn(name = "machongoi")
    private ChoNgoi choNgoi;

    @ManyToOne
    @JoinColumn(name = "mabandoc")
    private BanDoc banDoc;

    @Column(name = "manhanvien")
    private Long maNhanVien;

    @Column(name = "thoigianbatdau", nullable = false)
    private LocalDateTime thoiGianBatDau;

    @Column(name = "thoigianketthuc", nullable = false)
    private LocalDateTime thoiGianKetThuc;

    @Column(name = "trangthaidatcho")
    private String trangThaiDatCho = "kichHoat";

    @Column(name = "ngaykhoitao")
    private LocalDateTime ngayKhoiTao = LocalDateTime.now();

    @Column(name = "thoidiemhuy")
    private LocalDateTime thoiDiemHuy;

    @Column(name = "nhanvienhuy")
    private Long nhanVienHuy;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
