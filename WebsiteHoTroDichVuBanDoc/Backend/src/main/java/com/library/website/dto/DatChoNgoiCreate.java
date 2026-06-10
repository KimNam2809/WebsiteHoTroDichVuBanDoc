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
public class DatChoNgoiCreate {
    private Long maChoNgoi;
    private Long maBanDoc;
    private LocalDateTime thoiGianBatDau;
    private LocalDateTime thoiGianKetThuc;
}
