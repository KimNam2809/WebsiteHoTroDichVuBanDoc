package com.library.website.controllers;

import com.library.website.dto.ChatRequest;
import com.library.website.dto.ChatResponse;
import com.library.website.services.LibraryBrainService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/chatbot")
public class ChatbotController {

    @Autowired
    private LibraryBrainService chatbotService;

    @PostMapping("/chat")
    public ResponseEntity<ChatResponse> chat(@RequestBody ChatRequest request) {
        String sessionId = request.getSession_id() != null && !request.getSession_id().isEmpty()
                ? request.getSession_id()
                : UUID.randomUUID().toString();

        ChatResponse response = chatbotService.processChat(
                request.getMessage(),
                request.getUser_id(),
                sessionId
        );

        return ResponseEntity.ok(response);
    }
}
