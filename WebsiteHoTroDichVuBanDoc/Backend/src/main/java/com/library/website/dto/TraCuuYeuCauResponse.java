package com.library.website.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TraCuuYeuCauResponse {
    private Long ma_yeu_cau;
    private String ho_ten;
    private String cccd;
    private String sdt;
    private String ten_loai_the;
    private LocalDateTime ngay_dang_ky;
    private String trang_thai;
    private String ly_do_tu_choi;
    private String sothe;
    private String anh_the_url;
    private Boolean giao_hang;
}
