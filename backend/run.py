import uvicorn
import os

if __name__ == "__main__":
    # Ensure working directory matches backend/ to avoid import issues
    os.environ["PYTHONPATH"] = "."
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
