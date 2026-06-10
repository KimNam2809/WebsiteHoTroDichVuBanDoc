package com.library.website.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "thongbao", schema = "public")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ThongBao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "mathongbao")
    private Long maThongBao;

    @Column(name = "mabandoc")
    private Long maBanDoc;

    @Column(name = "hinhthuc")
    private String hinhThuc; // 'HeThong', 'Email', etc.

    @Column(name = "tieude")
    private String tieuDe;

    @Column(name = "noidung")
    private String noiDung;

    @Column(name = "dulieugoc", columnDefinition = "jsonb")
    private String duLieuGoc;

    @Column(name = "thoigiangui")
    private LocalDateTime thoiGianGui = LocalDateTime.now();

    @Column(name = "trangthai")
    private String trangThai = "chuaXem"; // 'chuaXem', 'daXem'

    @Column(name = "thamchieu")
    private String thamChieu;

    @Column(name = "solangui")
    private Integer soLanGui = 0;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
