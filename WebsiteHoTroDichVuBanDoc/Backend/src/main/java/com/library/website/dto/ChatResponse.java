package com.library.website.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ChatResponse {
    private String reply;
    private String session_id;
    private Map<String, Object> action; // Chứa thông tin điều hướng 'navigate' hoặc 'show_books'
}
