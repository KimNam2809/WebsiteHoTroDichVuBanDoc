import pytest
from selenium import webdriver
from selenium.webdriver.chrome.service import Service as ChromeService
from webdriver_manager.chrome import ChromeDriverManager
import os

@pytest.fixture(scope="session")
def driver():
    """Returns a Selenium WebDriver instance with basic configuration for Next.js app running locally."""
    options = webdriver.ChromeOptions()
    # options.add_argument("--headless") # Commented out to potentially watch it run
    options.add_argument("--start-maximized")
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    driver = webdriver.Chrome(service=ChromeService(ChromeDriverManager().install()), options=options)
    driver.implicitly_wait(10)
    
    yield driver
    
    # Teardown
    driver.quit()

@pytest.fixture(scope="session")
def base_url():
    """Returns the base URL of the Next.js application."""
    return os.getenv("BASE_URL", "http://localhost:3000")
