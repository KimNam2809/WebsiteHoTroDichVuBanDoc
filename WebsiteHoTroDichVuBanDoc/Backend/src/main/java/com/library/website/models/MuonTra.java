package com.library.website.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "muontra", schema = "public")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MuonTra {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "mamuontra")
    private Long maMuonTra;

    @ManyToOne
    @JoinColumn(name = "mabansao")
    private BanSao banSao;

    @ManyToOne
    @JoinColumn(name = "mabandoc")
    private BanDoc banDoc;

    @Column(name = "manhanvien")
    private Long maNhanVien;

    @Column(name = "thoigianmuon")
    private LocalDateTime thoiGianMuon = LocalDateTime.now();

    @Column(name = "ngaytra")
    private LocalDate ngayTra;

    @Column(name = "ngaytrathucte")
    private LocalDateTime ngayTraThucTe;

    @Column(name = "trangthaimuon")
    private String trangThaiMuon = "daMuon"; // 'daMuon', 'daTra', 'quaHan', 'dangChoXacNhan'

    @Column(name = "solangiahan")
    private Short soLanGiaHan = 0;

    @Column(name = "solangiahantoida")
    private Short soLanGiaHanToiDa = 2;

    @Column(name = "tienphat")
    private BigDecimal tienPhat = BigDecimal.ZERO;

    @Column(name = "ghichu")
    private String ghiChu;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
