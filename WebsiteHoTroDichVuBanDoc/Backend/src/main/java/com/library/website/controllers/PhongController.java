package com.library.website.controllers;

import com.library.website.models.Phong;
import com.library.website.repository.PhongRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/phong")
public class PhongController {

    @Autowired
    private PhongRepository phongRepository;

    @GetMapping("/")
    public ResponseEntity<List<Phong>> getAllRooms() {
        List<Phong> rooms = phongRepository.findAll();
        return ResponseEntity.ok(rooms);
    }
}
