package com.library.website.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "dattruoc", schema = "public")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DatTruoc {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "madattruoc")
    private Long maDatTruoc;

    @ManyToOne
    @JoinColumn(name = "mabansao")
    private BanSao banSao;

    @ManyToOne
    @JoinColumn(name = "mabandoc")
    private BanDoc banDoc;

    @Column(name = "thoidiemdattruoc")
    private LocalDateTime thoiDiemDatTruoc = LocalDateTime.now();

    @Column(name = "trangthaidattruoc")
    private String trangThaiDatTruoc = "kichHoat"; // 'kichHoat', 'daTra', 'daHuy'

    @Column(name = "hinhthucthongbao")
    private String hinhThucThongBao;

    @Column(name = "thoidiemhoanthanh")
    private LocalDateTime thoiDiemHoanThanh;

    @Column(name = "ghichu")
    private String ghiChu;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
