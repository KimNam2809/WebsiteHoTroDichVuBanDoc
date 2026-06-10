package com.library.website.controllers;

import com.library.website.models.ChoNgoi;
import com.library.website.repository.ChoNgoiRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/cho-ngoi")
public class ChoNgoiController {

    @Autowired
    private ChoNgoiRepository choNgoiRepository;

    @GetMapping("/")
    public ResponseEntity<List<ChoNgoi>> getAllSeats() {
        List<ChoNgoi> seats = choNgoiRepository.findAll();
        return ResponseEntity.ok(seats);
    }
}
