import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time

def test_homepage_loads(driver, base_url):
    """Test Case 1: Navigation to Home page and verification"""
    driver.get(base_url)
    
    # Wait for the Header to load by checking for the "Trang chủ" link
    wait = WebDriverWait(driver, 10)
    home_link = wait.until(EC.presence_of_element_located((By.XPATH, "//a[contains(text(), 'Trang chủ')]")))
    
    assert home_link.is_displayed(), "Home link should be visible"
    
def test_navigation_to_search(driver, base_url):
    """Test Case 2: Navigate to search page"""
    driver.get(base_url)
    
    wait = WebDriverWait(driver, 10)
    # Click on "Danh mục sách"
    search_link = wait.until(EC.element_to_be_clickable((By.XPATH, "//a[contains(text(), 'Danh mục sách')]")))
    search_link.click()
    
    # Verify url changes to /tim_kiem
    wait.until(EC.url_contains("/tim_kiem"))
    assert "/tim_kiem" in driver.current_url

def test_navigation_to_login(driver, base_url):
    """Test Case 3: Navigate to login page"""
    driver.get(base_url)
    
    wait = WebDriverWait(driver, 10)
    
    # The header has a "Đăng nhập" button
    login_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//a[contains(text(), 'Đăng nhập') or contains(@href, '/dang_nhap')]")))
    
    # Use javascript click if normal click is intercepted
    driver.execute_script("arguments[0].click();", login_btn)
    
    # Wait for url to change
    wait.until(EC.url_contains("/dang_nhap"))
    assert "/dang_nhap" in driver.current_url
