package com.library.website.services;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
@Slf4j
public class RAGService {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private final RestTemplate restTemplate;

    @Value("${groq.model}")
    private String modelName;

    public RAGService(RestTemplateBuilder restTemplateBuilder) {
        this.restTemplate = restTemplateBuilder.build();
    }

    /**
     * Lấy vector embedding từ Ollama (nomic-embed-text)
     */
    public List<Double> getOllamaEmbedding(String text) {
        try {
            String ollamaUrl = "http://localhost:11434/api/embeddings";
            Map<String, Object> request = new HashMap<>();
            request.put("model", "nomic-embed-text");
            request.put("prompt", text);

            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.postForObject(ollamaUrl, request, Map.class);
            if (response != null && response.containsKey("embedding")) {
                @SuppressWarnings("unchecked")
                List<Number> rawEmbedding = (List<Number>) response.get("embedding");
                List<Double> embedding = new ArrayList<>();
                for (Number val : rawEmbedding) {
                    embedding.add(val.doubleValue());
                }
                return embedding;
            }
        } catch (Exception e) {
            log.error("Lỗi khi kết nối Ollama Embeddings: {}", e.getMessage());
        }
        return Collections.emptyList();
    }

    /**
     * Gọi RPC match_documents trên Postgres để tìm kiếm ngữ cảnh
     */
    public String queryRAGContext(String userQuery) {
        List<Double> embedding = getOllamaEmbedding(userQuery);
        if (embedding.isEmpty()) {
            return "";
        }

        try {
            // Chuyển List<Double> thành Postgres vector string: [0.1, 0.2, ...]
            StringBuilder vectorBuilder = new StringBuilder("[");
            for (int i = 0; i < embedding.size(); i++) {
                vectorBuilder.append(embedding.get(i));
                if (i < embedding.size() - 1) {
                    vectorBuilder.append(",");
                }
            }
            vectorBuilder.append("]");

            // Gọi RPC match_documents (hoặc match_rag_chunks tùy thuộc CSDL của bạn)
            String sql = "SELECT content, category FROM match_documents(?, 0.35, 5)";
            
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, vectorBuilder.toString());
            StringBuilder contextBuilder = new StringBuilder();
            
            for (Map<String, Object> row : rows) {
                String content = (String) row.get("content");
                String category = (String) row.get("category");
                contextBuilder.append("--- Nguồn: ").append(category).append(" ---\n")
                        .append(content).append("\n\n");
            }
            return contextBuilder.toString().strip();
        } catch (Exception e) {
            log.error("Lỗi truy vấn RAG context từ Postgres: {}", e.getMessage());
        }
        return "";
    }
}
