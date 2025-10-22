FROM docker.io/python:3.12

WORKDIR /app

COPY requirements.txt .

RUN apt-get update && apt-get install -y libgl1

RUN pip install -r requirements.txt
