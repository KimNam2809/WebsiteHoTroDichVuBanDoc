package com.library.website.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DuyetTheRequest {
    private String trang_thai; // 'daDuyet', 'tuChoi'
    private String ly_do;
}
