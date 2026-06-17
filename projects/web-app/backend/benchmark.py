"""
Benchmark script for the Hazoom Unified Intelligent Model
"""

import time
import statistics
from unified_intelligent_model import create_unified_model

def benchmark_model_initialization():
    """Benchmark model initialization time"""
    print("Benchmarking model initialization...")

    start_time = time.time()
    model = create_unified_model("balanced", "friendly")
    init_time = time.time() - start_time

    print(".3f")
    return model, init_time

def benchmark_response_times(model, num_tests=100):
    """Benchmark response times for multiple queries"""
    print(f"Benchmarking response times for {num_tests} queries...")

    test_messages = [
        "Hello, how are you?",
        "I need help with my project",
        "What do you think about artificial intelligence?",
        "I'm having trouble with my goals",
        "Can you help me achieve success?",
        "I achieved my goal!",
        "I'm feeling stressed",
        "How can I improve my productivity?",
        "Tell me about the universe",
        "What is freedom?"
    ]

    response_times = []

    for i in range(num_tests):
        msg = test_messages[i % len(test_messages)]
        user_id = f"bench_user_{i % 10}"

        start_time = time.time()
        result = model.process_input(msg, user_id)
        response_time = time.time() - start_time

        response_times.append(response_time)

    avg_time = statistics.mean(response_times)
    min_time = min(response_times)
    max_time = max(response_times)
    std_dev = statistics.stdev(response_times)

    print(".3f")
    print(".3f")
    print(".3f")
    print(".3f")

    return response_times

def benchmark_memory_usage():
    """Benchmark memory usage"""
    import psutil
    import os

    process = psutil.Process(os.getpid())
    memory_before = process.memory_info().rss / 1024 / 1024  # MB

    model = create_unified_model("balanced", "friendly")

    memory_after = process.memory_info().rss / 1024 / 1024  # MB
    memory_used = memory_after - memory_before

    print(".2f")
    print(".2f")

    return memory_used

def run_full_benchmark():
    """Run complete benchmark suite"""
    print("=== Hazoom Unified Model Performance Benchmark ===\n")

    # Memory benchmark
    memory_used = benchmark_memory_usage()
    print()

    # Initialization benchmark
    model, init_time = benchmark_model_initialization()
    print()

    # Response time benchmark
    response_times = benchmark_response_times(model, 50)
    print()

    # Performance metrics
    metrics = model.get_performance_metrics()
    print("=== Model Performance Metrics ===")
    for key, value in metrics.items():
        print(f"{key}: {value}")

    print("\n=== Benchmark Complete ===")

    return {
        "memory_used": memory_used,
        "init_time": init_time,
        "response_times": response_times,
        "metrics": metrics
    }

if __name__ == "__main__":
    run_full_benchmark()