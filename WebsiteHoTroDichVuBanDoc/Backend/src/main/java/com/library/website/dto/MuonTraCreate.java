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
public class MuonTraCreate {
    private Long maBanSao;
    private Long maBanDoc;
    private Long maNhanVien;
    private LocalDate ngayTra;
}
