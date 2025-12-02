#!/usr/bin/env python3
"""
Test script for parallel video landmark processing.
Tests the implementation with different worker counts and compares performance.
"""
import time
import sys
import os
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

from app.pose_estimation import process_video_for_landmarks


def test_parallel_processing(video_path: str):
    """Test parallel processing with different configurations."""
    
    if not os.path.exists(video_path):
        print(f"Error: Video file not found: {video_path}")
        print("Please provide a valid video file path as argument")
        return
    
    print("=" * 80)
    print(f"Testing Parallel Processing for Video: {video_path}")
    print("=" * 80)
    
    # Test configurations
    test_configs = [
        {"name": "Sequential", "use_parallel": False, "num_workers": None},
        {"name": "Parallel (4 workers)", "use_parallel": True, "num_workers": 4},
        {"name": "Parallel (8 workers)", "use_parallel": True, "num_workers": 8},
        {"name": "Parallel (auto)", "use_parallel": True, "num_workers": None},
    ]
    
    results = []
    
    for config in test_configs:
        print(f"\n{'=' * 80}")
        print(f"Test: {config['name']}")
        print(f"{'=' * 80}")
        
        start_time = time.time()
        
        try:
            landmarks = process_video_for_landmarks(
                video_path=video_path,
                video_sample_rate=1,  # Process every frame
                use_parallel=config['use_parallel'],
                num_workers=config['num_workers'],
                model_complexity=1  # Full model
            )
            
            elapsed_time = time.time() - start_time
            
            result = {
                "config": config['name'],
                "time": elapsed_time,
                "frames": len(landmarks),
                "frames_with_landmarks": sum(1 for l in landmarks if l['landmarks'] is not None),
                "success": True
            }
            
            print(f"\n✓ Success!")
            print(f"  Time taken: {elapsed_time:.2f} seconds")
            print(f"  Total frames processed: {len(landmarks)}")
            print(f"  Frames with landmarks: {result['frames_with_landmarks']}")
            print(f"  Processing rate: {len(landmarks) / elapsed_time:.1f} fps")
            
        except Exception as e:
            print(f"\n✗ Failed: {e}")
            result = {
                "config": config['name'],
                "time": None,
                "frames": 0,
                "frames_with_landmarks": 0,
                "success": False,
                "error": str(e)
            }
        
        results.append(result)
    
    # Print summary
    print(f"\n{'=' * 80}")
    print("SUMMARY")
    print(f"{'=' * 80}")
    
    baseline_time = None
    
    for result in results:
        if result['success']:
            speedup = ""
            if baseline_time is None:
                baseline_time = result['time']
            elif baseline_time > 0:
                speedup = f" (Speedup: {baseline_time / result['time']:.2f}x)"
            
            print(f"{result['config']:25} | {result['time']:>8.2f}s | "
                  f"{result['frames']:>6} frames{speedup}")
        else:
            print(f"{result['config']:25} | FAILED")
    
    # Recommendations
    print(f"\n{'=' * 80}")
    print("RECOMMENDATIONS")
    print(f"{'=' * 80}")
    
    if len([r for r in results if r['success']]) >= 2:
        parallel_results = [r for r in results if r['success'] and r['config'] != "Sequential"]
        if parallel_results and baseline_time:
            best = min(parallel_results, key=lambda x: x['time'])
            speedup = baseline_time / best['time']
            
            if speedup >= 3:
                print(f"✓ Parallel processing provides excellent speedup ({speedup:.1f}x)")
                print(f"✓ Recommended configuration: {best['config']}")
            elif speedup >= 2:
                print(f"✓ Parallel processing provides good speedup ({speedup:.1f}x)")
                print(f"✓ Recommended configuration: {best['config']}")
            else:
                print(f"⚠ Parallel processing provides modest speedup ({speedup:.1f}x)")
                print(f"⚠ Consider using sequential processing for short videos")
    
    print(f"\n{'=' * 80}")


def test_chunk_distribution(video_path: str, num_workers: int = 8):
    """Test how video is split into chunks."""
    import cv2
    
    print(f"\n{'=' * 80}")
    print(f"Chunk Distribution Analysis (num_workers={num_workers})")
    print(f"{'=' * 80}")
    
    cap = cv2.VideoCapture(video_path)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    duration = total_frames / fps if fps > 0 else 0
    cap.release()
    
    print(f"\nVideo Information:")
    print(f"  Total frames: {total_frames}")
    print(f"  FPS: {fps:.2f}")
    print(f"  Duration: {duration:.2f} seconds")
    
    frames_per_chunk = max(1, total_frames // num_workers)
    
    print(f"\nChunk Distribution:")
    print(f"  Workers: {num_workers}")
    print(f"  Frames per chunk: {frames_per_chunk}")
    print(f"  Duration per chunk: {frames_per_chunk / fps:.2f} seconds")
    
    print(f"\n  {'Chunk':<8} {'Start Frame':<15} {'End Frame':<15} {'Frames':<10} {'Duration':<10}")
    print(f"  {'-' * 70}")
    
    for i in range(num_workers):
        start_frame = i * frames_per_chunk
        end_frame = total_frames if i == num_workers - 1 else (i + 1) * frames_per_chunk
        
        if start_frame < total_frames:
            chunk_frames = end_frame - start_frame
            chunk_duration = chunk_frames / fps if fps > 0 else 0
            
            print(f"  {i + 1:<8} {start_frame:<15} {end_frame:<15} "
                  f"{chunk_frames:<10} {chunk_duration:.2f}s")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python test_parallel_processing.py <video_path>")
        print("\nExample:")
        print("  python test_parallel_processing.py uploads/sample_video.mp4")
        sys.exit(1)
    
    video_path = sys.argv[1]
    
    # First, analyze chunk distribution
    test_chunk_distribution(video_path)
    
    # Then run performance tests
    test_parallel_processing(video_path)
    
    print("\n✓ All tests completed!")





