# SP2025: Group 6 

cory

## Team Members
- **Justin Park**: junjpark02@gmail.com junjpark
- **Julie Baguio**: baguio@wustl.edu julesebags
- **Andy Hoette**: a.h.hoette@wustl.edu AndyHoette
- **Abby Shen**: a.e.shen@wustl.edu aeshen27

## TA
Asher Garvens

## Objectives

# cory

cory is an AI-powered choreography analysis tool that helps dancers and choreographers learn, practice, and refine routines.  

This MVP allows users to upload a dance video, automatically skeletonizes the dancer, and provides tools for leaving and receiving notes directly on the video.  

Key features include:
- **Auto-Naming of Dance Moves** – Detects and labels distinct choreography segments.
- **Flippable View** – Mirror-flip the video or skeleton for easier practice.
- **3D Model Rendering** – Visualize movement from multiple angles.
- **Music Sync** – Aligns the analyzed video with its soundtrack for beat-accurate playback.
- **Similarity Scoring** – Compares a practice video to the original and generates an accuracy score.
- **Learning Mode** – Breaks choreography into manageable sections for step-by-step practice.

cory aims to make learning choreography as interactive and data-driven as possible, bridging creativity and technology for dancers and instructors alike.

**Tech Stack:** PostgreSQL · Python (FastAPI) · React



## How to Run

### Backend Instructions

<code>
cd backend
python -m venv venv
# Mac/Linux:
source venv/bin/activate
# Windows:
# venv\Scripts\activate
pip install -r requirements.txt
python main.py
</code>


### Frontend Instructions
<code>
cd cory
npm install
npm run dev
</code>


