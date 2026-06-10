package com.library.website.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "bansao", schema = "public")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class BanSao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "mabansao")
    private Long maBanSao;

    @ManyToOne
    @JoinColumn(name = "matacpham")
    private TacPham tacPham;

    @Column(name = "mabansaonoibo", unique = true)
    private String maBanSaoNoiBo;

    @Column(name = "vitri")
    private String viTri;

    @Column(name = "vitrikengan")
    private String viTriKeNgan;

    @Column(name = "dinhdangbansao")
    private String dinhdangBanSao;

    @Column(name = "ngaymua")
    private LocalDate ngayMua;

    @Column(name = "trangthaivatly")
    private String trangThaiVatLy;

    @Column(name = "trangthaichomuon")
    private Boolean trangThaiChoMuon = true;

    @Column(name = "ngaynhap")
    private LocalDateTime ngayNhap = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
