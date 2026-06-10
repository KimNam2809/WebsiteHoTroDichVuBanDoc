package com.library.website.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "phong", schema = "public")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Phong {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "maphong")
    private Long maPhong;

    @Column(name = "tenphong", nullable = false)
    private String tenPhong;

    @Column(name = "loaiphong")
    private String loaiPhong;

    @Column(name = "succhua")
    private Integer sucChua;

    @Column(name = "vitri")
    private String viTri;

    @Column(name = "trangthai")
    private String trangThai = "moCua";

    @Column(name = "thongtinthietbitaiphong", columnDefinition = "jsonb")
    private String thongTinThietBiTaiPhong;

    @Column(name = "ghichu")
    private String ghiChu;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
