package com.library.website.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/tac-pham-danh-muc")
public class TacPhamDanhMucController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @GetMapping("/{maTacPham}")
    public ResponseEntity<List<Map<String, Object>>> getDanhMucByTacPham(@PathVariable("maTacPham") Long maTacPham) {
        String sql = "SELECT d.madanhmuc, d.tendanhmuc, d.madanhmuccha " +
                     "FROM danhmuc d " +
                     "JOIN tacpham_danhmuc td ON d.madanhmuc = td.madanhmuc " +
                     "WHERE td.matacpham = ?";
        List<Map<String, Object>> list = jdbcTemplate.queryForList(sql, maTacPham);
        return ResponseEntity.ok(list);
    }
}
