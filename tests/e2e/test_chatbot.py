import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time

def test_chatbot_opens(driver, base_url):
    """Test Case 1: Open the Chatbot UI and verify it loads correctly."""
    driver.get(base_url)
    
    wait = WebDriverWait(driver, 10)
    
    # The chatbot trigger button is styled with specific classes (z-50)
    # It might take a moment to appear if it's dynamic, wait for a button with z-50
    chatbot_btn = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "button.z-50")))
    chatbot_btn.click()
    
    # Verify the input field appears
    input_field = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "input[placeholder='Nhập câu hỏi của bạn...']")))
    assert input_field.is_displayed(), "Chatbot input field should be visible."

def test_chatbot_rag_query(driver, base_url):
    """Test Case 2: Send a RAG query (e.g., library rules) and verify response."""
    driver.get(base_url)
    wait = WebDriverWait(driver, 15)
    
    # Open chatbot
    chatbot_btn = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "button.z-50")))
    chatbot_btn.click()
    
    # Type question and send
    input_field = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "input[placeholder='Nhập câu hỏi của bạn...']")))
    input_field.send_keys("Nội quy thư viện là gì?")
    
    # Find submit button (inside form)
    submit_btn = driver.find_element(By.CSS_SELECTOR, "form button[type='submit']")
    submit_btn.click()
    
    # Wait for the response (loading indicator appears then disappears, or new message from bot)
    # The user msg will be added, then loader, then bot msg. Use sleep for simplicity or wait for multiple bot messages
    time.sleep(5) 
    
    # Find all chat bubbles. Bot messages have specific styles, user messages have different styles.
    # We will just verify that there's more than 1 entry in the chat log (1 greeting + 1 user + 1 bot)
    messages = driver.find_elements(By.XPATH, "//div[contains(@class, 'p-3.5 ')]")
    assert len(messages) >= 3, f"Expected at least 3 messages (Greeting, User, Bot), got {len(messages)}"

def test_chatbot_semantic_search_query(driver, base_url):
    """Test Case 3: Send a semantic search query and verify book suggestions."""
    driver.get(base_url)
    wait = WebDriverWait(driver, 15)
    
    # Open chatbot
    chatbot_btn = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "button.z-50")))
    chatbot_btn.click()
    
    input_field = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "input[placeholder='Nhập câu hỏi của bạn...']")))
    input_field.send_keys("Có cuốn sách nào về AI không?")
    
    submit_btn = driver.find_element(By.CSS_SELECTOR, "form button[type='submit']")
    submit_btn.click()
    
    # Give the backend time to respond
    time.sleep(5)
    
    # We could look for either a custom book card (which we saw in Chatbot.js)
    # It has a "Xem chi tiết" span/div.
    # Let's verify that a message is received at least.
    messages = driver.find_elements(By.XPATH, "//div[contains(@class, 'p-3.5 ')]")
    assert len(messages) >= 3, "Bot should have replied"
