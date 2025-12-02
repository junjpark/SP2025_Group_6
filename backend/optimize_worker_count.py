#!/usr/bin/env python3
"""
Script to determine optimal worker count for your specific hardware.
Tests different worker counts and measures performance.
"""
import time
import multiprocessing as mp
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

from app.pose_estimation import process_video_for_landmarks


def get_system_info():
    """Get information about the system."""
    cpu_count_logical = mp.cpu_count()
    try:
        cpu_count_physical = mp.cpu_count() // 2  # Rough estimate
    except:
        cpu_count_physical = cpu_count_logical
    
    print("=" * 80)
    print("SYSTEM INFORMATION")
    print("=" * 80)
    print(f"Logical CPU cores:  {cpu_count_logical}")
    print(f"Physical CPU cores (estimate): {cpu_count_physical}")
    print(f"\nRecommended worker counts to test:")
    print(f"  - Conservative: {max(1, cpu_count_physical - 1)}")
    print(f"  - Balanced:     {cpu_count_logical}")
    print(f"  - Aggressive:   {cpu_count_logical * 2}")
    print()


def test_worker_counts(video_path: str, test_counts=None, sample_rate=2):
    """
    Test different worker counts to find optimal.
    
    Args:
        video_path: Path to test video
        test_counts: List of worker counts to test (None = auto-generate)
        sample_rate: Process every Nth frame (higher = faster testing)
    """
    if test_counts is None:
        cpu_count = mp.cpu_count()
        test_counts = [1, 2, 4, 8, 12, 16, cpu_count, cpu_count * 2]
        test_counts = sorted(set([c for c in test_counts if c <= cpu_count * 2]))
    
    print("=" * 80)
    print(f"TESTING WORKER COUNTS WITH VIDEO: {video_path}")
    print(f"Sample rate: {sample_rate} (processing every {sample_rate}th frame for speed)")
    print("=" * 80)
    
    results = []
    
    for num_workers in test_counts:
        print(f"\nTesting with {num_workers} workers...")
        
        start_time = time.time()
        
        try:
            landmarks = process_video_for_landmarks(
                video_path=video_path,
                video_sample_rate=sample_rate,
                use_parallel=True,
                num_workers=num_workers,
                model_complexity=1  # Full model
            )
            
            elapsed = time.time() - start_time
            frames = len(landmarks)
            fps = frames / elapsed if elapsed > 0 else 0
            
            results.append({
                'workers': num_workers,
                'time': elapsed,
                'frames': frames,
                'fps': fps,
                'success': True
            })
            
            print(f"  ✓ Completed in {elapsed:.2f}s ({fps:.1f} fps)")
            
        except Exception as e:
            print(f"  ✗ Failed: {e}")
            results.append({
                'workers': num_workers,
                'time': float('inf'),
                'frames': 0,
                'fps': 0,
                'success': False
            })
    
    # Print summary
    print("\n" + "=" * 80)
    print("RESULTS SUMMARY")
    print("=" * 80)
    print(f"{'Workers':<10} {'Time (s)':<12} {'FPS':<12} {'Speedup':<12} {'Status'}")
    print("-" * 80)
    
    baseline_time = results[0]['time'] if results and results[0]['success'] else None
    best_result = None
    
    for r in results:
        if r['success']:
            speedup = baseline_time / r['time'] if baseline_time and baseline_time > 0 else 1.0
            status = "✓"
            
            if best_result is None or r['time'] < best_result['time']:
                best_result = r
                status = "✓ BEST"
            
            print(f"{r['workers']:<10} {r['time']:<12.2f} {r['fps']:<12.1f} "
                  f"{speedup:<12.2f}x {status}")
        else:
            print(f"{r['workers']:<10} {'FAILED':<12} {'-':<12} {'-':<12} ✗")
    
    # Recommendations
    print("\n" + "=" * 80)
    print("RECOMMENDATIONS")
    print("=" * 80)
    
    if best_result:
        print(f"\n✓ OPTIMAL WORKER COUNT: {best_result['workers']}")
        print(f"  - Processing time: {best_result['time']:.2f}s")
        print(f"  - Processing speed: {best_result['fps']:.1f} fps")
        
        if baseline_time and baseline_time > 0:
            speedup = baseline_time / best_result['time']
            print(f"  - Speedup vs sequential: {speedup:.2f}x")
        
        print(f"\nTo use this configuration, set in your API call:")
        print(f"  num_workers={best_result['workers']}")
        
        # Check if we're CPU bound
        cpu_count = mp.cpu_count()
        if best_result['workers'] >= cpu_count:
            print(f"\n⚠ Your optimal worker count ({best_result['workers']}) is at/near CPU limit.")
            print("  Consider these additional optimizations:")
            print("  1. Use model_complexity=0 (lite model) instead of 1")
            print("  2. Increase sample_rate (process fewer frames)")
            print("  3. Consider GPU acceleration if available")
    
    return results


def estimate_processing_time(video_duration_seconds: float, workers: int, sample_rate: int = 1):
    """
    Estimate processing time based on benchmarks.
    
    Args:
        video_duration_seconds: Video length in seconds
        workers: Number of parallel workers
        sample_rate: Frame sampling rate
    """
    # Rough benchmark: ~3x real-time for sequential processing with full model
    sequential_factor = 3.0
    
    # Parallel efficiency (not perfect scaling)
    parallel_efficiency = {
        1: 1.0,
        2: 1.8,
        4: 3.2,
        8: 5.5,
        12: 7.0,
        16: 8.0,
        24: 9.0
    }
    
    # Get closest efficiency factor
    efficiency = parallel_efficiency.get(workers, workers * 0.65)
    
    # Account for sample rate
    effective_duration = video_duration_seconds / sample_rate
    
    # Calculate estimated time
    sequential_time = effective_duration * sequential_factor
    parallel_time = sequential_time / efficiency
    
    return parallel_time


if __name__ == "__main__":
    import os
    
    print("\n" + "=" * 80)
    print("PARALLEL PROCESSING OPTIMIZATION TOOL")
    print("=" * 80)
    print()
    
    get_system_info()
    
    if len(sys.argv) < 2:
        print("\nUsage: python optimize_worker_count.py <video_path> [sample_rate]")
        print("\nExamples:")
        print('  python optimize_worker_count.py uploads/video.mp4')
        print('  python optimize_worker_count.py "path with spaces/video.mp4"')
        print('  python optimize_worker_count.py uploads/video.mp4 2  # Faster testing')
        print("\nNote: This script will test multiple worker counts.")
        print("      Use sample_rate > 1 for faster testing (e.g., 2 = every other frame)")
        print("\n⚠ IMPORTANT: If your path has spaces, wrap it in quotes!")
        sys.exit(1)
    
    # Try to handle case where path wasn't quoted (common mistake)
    if len(sys.argv) > 3:
        # User probably forgot quotes, try to reconstruct the path
        print("\n⚠ Warning: Detected multiple arguments. Did you forget to quote the path?")
        print("   If your filename has spaces, please wrap it in quotes.\n")
        print("   Attempting to reconstruct path...")
        
        # Find where numeric sample_rate might be (if provided)
        last_arg_idx = len(sys.argv) - 1
        sample_rate = 2  # default
        
        # Check if last argument is a number (sample_rate)
        try:
            sample_rate = int(sys.argv[-1])
            last_arg_idx = len(sys.argv) - 2
        except ValueError:
            pass
        
        # Reconstruct path from all args except sample_rate
        video_path = ' '.join(sys.argv[1:last_arg_idx + 1])
        print(f"   Reconstructed path: {video_path}\n")
    else:
        video_path = sys.argv[1]
        try:
            sample_rate = int(sys.argv[2]) if len(sys.argv) > 2 else 2
        except ValueError:
            print(f"\n✗ Error: Invalid sample_rate '{sys.argv[2]}'. Must be a number.")
            print("   Usage: python optimize_worker_count.py <video_path> [sample_rate]")
            sys.exit(1)
    
    if not os.path.exists(video_path):
        print(f"Error: Video file not found: {video_path}")
        sys.exit(1)
    
    # Get video info
    import cv2
    cap = cv2.VideoCapture(video_path)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    duration = total_frames / fps if fps > 0 else 0
    cap.release()
    
    print(f"Video: {video_path}")
    print(f"  Duration: {duration:.1f} seconds ({total_frames} frames @ {fps:.1f} fps)")
    print(f"  Frames to process: {total_frames // sample_rate}")
    print()
    
    # Generate test counts based on CPU
    cpu_count = mp.cpu_count()
    test_counts = [1, 4, 8, 12, 16, cpu_count]
    if cpu_count > 16:
        test_counts.append(cpu_count)
    test_counts = sorted(set([c for c in test_counts if c <= cpu_count * 2]))
    
    results = test_worker_counts(video_path, test_counts, sample_rate)
    
    print("\n" + "=" * 80)
    print("NEXT STEPS")
    print("=" * 80)
    print("\n1. Update your backend code or API calls with the optimal worker count")
    print("2. For full production test, run again with sample_rate=1")
    print("3. Consider model_complexity=0 if speed is critical")
    print("\n✓ Optimization complete!")

