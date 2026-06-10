package com.library.website.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MuonTraItemResponse {
    private Long maMuonTra;
    private Long maBanSao;
    private LocalDateTime ngayMuon;
    private LocalDate ngayTraDuKien;
    private LocalDateTime ngayTraThucTe;
    private String trangThai;
    private BigDecimal tienPhat;
    private String maBanSaoNoiBo;
    private String tenTacPham;
    private String anhBia;
    private String nguoiMuon;
    private String anhDocGia;
    private String soThe;
}
