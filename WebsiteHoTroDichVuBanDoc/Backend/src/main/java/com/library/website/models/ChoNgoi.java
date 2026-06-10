package com.library.website.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "chongoi", schema = "public")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ChoNgoi {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "machongoi")
    private Long maChoNgoi;

    @ManyToOne
    @JoinColumn(name = "maphong")
    private Phong phong;

    @Column(name = "tenchongoi")
    private String tenChoNgoi;

    @Column(name = "loaichongoi")
    private String loaiChoNgoi;

    @Column(name = "trangthai")
    private String trangThai = "coSan";

    @Column(name = "chongoitructiep")
    private Boolean choNgoiTrucTiep = false;

    @Column(name = "ghichu")
    private String ghiChu;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
