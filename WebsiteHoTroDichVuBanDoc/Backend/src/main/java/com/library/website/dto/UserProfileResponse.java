package com.library.website.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileResponse {
    private String hoten;
    private String email;
    private String vaitro;
    private Long id; // manguoidung
    private Long manguoidung; // duplicate of id for FastAPI model compatibility
    private String anhdaidien;
    private String sodienthoai;

    // Dành cho Bạn đọc
    private Long maBanDoc;
    private String sothe;
    private String tenthe;
    private LocalDate ngayhethan;
    private String trangthaithe;
    private Integer tailieumuontoida;

    // Dành cho Nhân viên
    private Long maNhanVien;
    private String manhanviennoibo;
    private String phongban;
    private String chucvu;
    private LocalDate ngaytuyendung;

    // Yêu cầu làm thẻ mới nhất (nếu có)
    private Long ma_yeu_cau_moi_nhat;
    private String trang_thai_yeu_cau;
}
