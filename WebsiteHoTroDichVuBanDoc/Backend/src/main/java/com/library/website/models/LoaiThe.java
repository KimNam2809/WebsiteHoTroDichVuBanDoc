package com.library.website.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "loaithe", schema = "public")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LoaiThe {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "maloaithe")
    private Short maLoaiThe;

    @Column(name = "tenthe", unique = true, nullable = false)
    private String tenThe;

    @Column(name = "mota")
    private String moTa;

    @Column(name = "tailieumuontoida")
    private Integer taiLieuMuonToiDa = 3;

    @Column(name = "songaymuonmacdinh")
    private Integer soNgayMuonMacDinh = 14;

    @Column(name = "lephi")
    private BigDecimal lePhi = BigDecimal.ZERO;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
