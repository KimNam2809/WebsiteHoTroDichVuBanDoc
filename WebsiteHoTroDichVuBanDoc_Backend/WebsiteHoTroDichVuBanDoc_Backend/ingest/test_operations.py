import requests
import time
import uuid

API_URL = "http://127.0.0.1:8000/api/v1/chatbot/chat"
TEST_USER_ID = 7
SESSION_ID = f"final_fix_{int(time.time())}"

def send(msg):
    print(f"\n👱 User: {msg}")
    print("⏳ AI đang xử lý...", end="", flush=True)
    try:
        res = requests.post(API_URL, json={
            "user_id": TEST_USER_ID, "session_id": SESSION_ID, "message": msg
        })
        print(f"\r🤖 AI: {res.json()['reply']}")
    except Exception as e:
        print(f"\n❌ Error: {e}")

def run():
    print("🚀 TEST FINAL FIX (RESERVE & RENEW)")

    # 1. Kiểm tra để biết tên sách chính xác
    send("tôi đang mượn những sách gì?")
    time.sleep(2)

    # 1. Kiểm tra để biết tên sách chính xác
    send("Gia hạn cuốn Nhà Giả Kim.")
    time.sleep(2)

    # 2. Gia hạn (Dùng tên cụ thể để tránh AI hỏi lại)
    # Vì trong log bạn có cuốn này, nên test luôn
    send("Đặt trước cho tôi cuốn Tắt Đèn.")
    time.sleep(2)

if __name__ == "__main__":
    run()