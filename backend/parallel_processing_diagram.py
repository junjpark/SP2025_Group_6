"""
Visual representation of the parallel video processing architecture.
This shows how a video is split into 8 chunks and processed in parallel.
"""

PARALLEL_PROCESSING_DIAGRAM = """
╔══════════════════════════════════════════════════════════════════════════════╗
║                     PARALLEL VIDEO LANDMARK PROCESSING                        ║
║                         (8-Way Parallel Chunking)                            ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────────────────┐
│                              Original Video                                   │
│  Total: 1000 frames │ Duration: 33.3 seconds │ FPS: 30                       │
└──────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     │ Split into 8 equal chunks
                                     ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                            Video Chunks                                       │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  Chunk 1: │███████████│ Frames   0-124  (125 frames, 4.2s)                  │
│  Chunk 2: │███████████│ Frames 125-249  (125 frames, 4.2s)                  │
│  Chunk 3: │███████████│ Frames 250-374  (125 frames, 4.2s)                  │
│  Chunk 4: │███████████│ Frames 375-499  (125 frames, 4.2s)                  │
│  Chunk 5: │███████████│ Frames 500-624  (125 frames, 4.2s)                  │
│  Chunk 6: │███████████│ Frames 625-749  (125 frames, 4.2s)                  │
│  Chunk 7: │███████████│ Frames 750-874  (125 frames, 4.2s)                  │
│  Chunk 8: │███████████│ Frames 875-999  (125 frames, 4.2s)                  │
│                                                                               │
└───────────┬───────────────────────────────────────────────────────────────────┘
            │
            │ Distribute to 8 worker processes
            ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                          Worker Processes                                     │
│                    (Running in Parallel on CPU Cores)                         │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│   ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐           │
│   │  Worker 1  │  │  Worker 2  │  │  Worker 3  │  │  Worker 4  │           │
│   │            │  │            │  │            │  │            │           │
│   │ Processing │  │ Processing │  │ Processing │  │ Processing │           │
│   │ Frames     │  │ Frames     │  │ Frames     │  │ Frames     │           │
│   │ 0-124      │  │ 125-249    │  │ 250-374    │  │ 375-499    │           │
│   │            │  │            │  │            │  │            │           │
│   │ ▓▓▓▓▓░░░░  │  │ ▓▓▓▓░░░░░  │  │ ▓▓▓▓▓▓░░░  │  │ ▓▓░░░░░░░  │           │
│   └────────────┘  └────────────┘  └────────────┘  └────────────┘           │
│                                                                               │
│   ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐           │
│   │  Worker 5  │  │  Worker 6  │  │  Worker 7  │  │  Worker 8  │           │
│   │            │  │            │  │            │  │            │           │
│   │ Processing │  │ Processing │  │ Processing │  │ Processing │           │
│   │ Frames     │  │ Frames     │  │ Frames     │  │ Frames     │           │
│   │ 500-624    │  │ 625-749    │  │ 750-874    │  │ 875-999    │           │
│   │            │  │            │  │            │  │            │           │
│   │ ▓▓▓░░░░░░  │  │ ▓▓▓▓▓░░░░  │  │ ▓▓▓▓▓▓▓░░  │  │ ▓▓▓▓░░░░░  │           │
│   └────────────┘  └────────────┘  └────────────┘  └────────────┘           │
│                                                                               │
│   ▓ = Completed    ░ = Remaining                                             │
│                                                                               │
└───────────┬───────────────────────────────────────────────────────────────────┘
            │
            │ Each worker processes its chunk sequentially:
            │ 1. Seek to start frame (once)
            │ 2. Read frames sequentially
            │ 3. Process with MediaPipe Pose
            │ 4. Extract landmarks
            │
            ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                      Landmark Results Collection                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│   Worker 1: ✓ [125 landmark results]                                         │
│   Worker 2: ✓ [125 landmark results]                                         │
│   Worker 3: ✓ [125 landmark results]                                         │
│   Worker 4: ✓ [125 landmark results]                                         │
│   Worker 5: ✓ [125 landmark results]                                         │
│   Worker 6: ✓ [125 landmark results]                                         │
│   Worker 7: ✓ [125 landmark results]                                         │
│   Worker 8: ✓ [125 landmark results]                                         │
│                                                                               │
│   All chunks completed! Merging results...                                   │
│                                                                               │
└───────────┬───────────────────────────────────────────────────────────────────┘
            │
            │ Sort by frame index
            │
            ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                       Final Landmark Results                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  [                                                                            │
│    { frame: 0,   time: 0.00,  landmarks: [...] },                            │
│    { frame: 1,   time: 0.03,  landmarks: [...] },                            │
│    { frame: 2,   time: 0.07,  landmarks: [...] },                            │
│    ...                                                                        │
│    { frame: 998, time: 33.27, landmarks: [...] },                            │
│    { frame: 999, time: 33.30, landmarks: [...] }                             │
│  ]                                                                            │
│                                                                               │
│  Total: 1000 frames with landmarks                                           │
│  Processing time: ~5.2 seconds (Sequential would take ~33 seconds)           │
│  Speedup: 6.3x                                                                │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘


╔══════════════════════════════════════════════════════════════════════════════╗
║                            PERFORMANCE COMPARISON                             ║
╚══════════════════════════════════════════════════════════════════════════════╝

Sequential Processing (Old):
════════════════════════════
│Worker 1│ Processes ALL 1000 frames sequentially
│        │ ████████████████████████████████████ [~33 seconds]
│        │
│ Other  │ (idle - not used)
│ Cores  │
│        │

Parallel Processing (New):
════════════════════════════
│Worker 1│ ████ [~5s]     ┐
│Worker 2│ ████ [~5s]     │
│Worker 3│ ████ [~5s]     │
│Worker 4│ ████ [~5s]     ├─ All workers process simultaneously
│Worker 5│ ████ [~5s]     │   Each handles 125 frames
│Worker 6│ ████ [~5s]     │   Total time ≈ time for 1 chunk
│Worker 7│ ████ [~5s]     │
│Worker 8│ ████ [~5s]     ┘


╔══════════════════════════════════════════════════════════════════════════════╗
║                          TECHNICAL DETAILS                                    ║
╚══════════════════════════════════════════════════════════════════════════════╝

Each Worker Process:
┌─────────────────────────────────────────────────────────────┐
│ 1. Open Video File (read-only)                              │
│    ↓                                                         │
│ 2. Seek to Chunk Start (single seek operation)              │
│    ↓                                                         │
│ 3. Read Frames Sequentially                                 │
│    ├─ Frame N     → Read from disk                          │
│    ├─ Frame N+1   → Read from buffer (fast!)                │
│    ├─ Frame N+2   → Read from buffer (fast!)                │
│    └─ ...                                                    │
│    ↓                                                         │
│ 4. Process Each Frame with MediaPipe Pose                   │
│    ├─ Convert to RGB                                         │
│    ├─ Detect pose landmarks                                  │
│    └─ Extract x, y, z, visibility                           │
│    ↓                                                         │
│ 5. Return Results for Chunk                                 │
└─────────────────────────────────────────────────────────────┘

Key Optimizations:
• Sequential reading (no repeated seeking)
• Process-level parallelism (no GIL constraints)
• Automatic worker count adjustment
• Progress logging per chunk
• Result sorting after collection


╔══════════════════════════════════════════════════════════════════════════════╗
║                         CONFIGURATION OPTIONS                                 ║
╚══════════════════════════════════════════════════════════════════════════════╝

Default Configuration:
  use_parallel=True
  num_workers=8
  
Custom Worker Count:
  num_workers=16    → For long videos on high-core CPUs
  num_workers=4     → For short videos or low-core CPUs
  
Sequential Processing:
  use_parallel=False → Fallback for compatibility

"""

if __name__ == "__main__":
    print(PARALLEL_PROCESSING_DIAGRAM)





