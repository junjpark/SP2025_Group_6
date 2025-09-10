from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

#list of accepted origins
origins = [
    "http://localhost:5173"
]

#allow backend to communicate with specified origins in browser
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

#tells the app to return json object message at root aka http://localhost:8000/
@app.get("/", tags=["root"])
async def read_root():
    return {"message": "Hello world!"}

