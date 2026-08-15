import uvicorn
import os

if __name__ == "__main__":
    print("=" * 60)
    print("Starting AI Smart Institute Management Backend Server")
    print("Backend API : http://127.0.0.1:8000")
    print("Swagger Docs: http://127.0.0.1:8000/docs")
    print("Portal View : http://127.0.0.1:8000/portal/index.html")
    print("=" * 60)
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
