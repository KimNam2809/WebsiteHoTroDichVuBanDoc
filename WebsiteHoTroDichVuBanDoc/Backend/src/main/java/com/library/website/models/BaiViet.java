package com.library.website.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "baiviet", schema = "public")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class BaiViet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "mabaiviet")
    private Long maBaiViet;

    @Column(name = "manhanvien")
    private Long maNhanVien;

    @Column(name = "tieude", nullable = false)
    private String tieuDe;

    @Column(name = "noidung", nullable = false)
    private String noiDung;

    @Column(name = "anhdaidien")
    private String anhDaiDien;

    @Column(name = "ngaydang")
    private LocalDateTime ngayDang = LocalDateTime.now();

    @Column(name = "ngaycapnhat")
    private LocalDateTime ngayCapNhat;

    @Column(name = "trangthai")
    private Boolean trangThai = true;

    @Column(name = "soluotxem")
    private Integer soLuotXem = 0;

    @Column(name = "soluotchiase")
    private Integer soLuotChiaSe = 0;

    @Column(name = "ghichu")
    private String ghiChu;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
