package com.library.website.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "thebandoc", schema = "public")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TheBanDoc {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "mathe")
    private Long maThe;

    @ManyToOne
    @JoinColumn(name = "mabandoc")
    private BanDoc banDoc;

    @ManyToOne
    @JoinColumn(name = "maloaithe")
    private LoaiThe loaiThe;

    @Column(name = "sothe", unique = true, nullable = false)
    private String soThe;

    @Column(name = "manhanvien")
    private Long maNhanVien;

    @Column(name = "ngayphathanh")
    private LocalDateTime ngayPhatHanh = LocalDateTime.now();

    @Column(name = "ngayhethan")
    private LocalDate ngayHetHan;

    @Column(name = "phuongthucvanchuyen")
    private String phuongThucVanChuyen;

    @Column(name = "mavanchuyen")
    private Long maVanChuyen;

    @Column(name = "trangthaithe")
    private Boolean trangThaiThe = true;

    @Column(name = "thongtinbosung", columnDefinition = "jsonb")
    private String thongTinBoSung;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
