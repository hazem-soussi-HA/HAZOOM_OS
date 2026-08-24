from __future__ import annotations

import asyncio
import pytest
from mimo_browser.config import BrowserConfig, BrowserMode, Priority, TaskContext
from mimo_browser.intelligence import Action, PlanningEngine, Step, StepResult
from mimo_browser.browser_engine import ContentExtractor, PageAnalysis
from mimo_browser.memory import MemoryStore


def test_config_defaults():
    config = BrowserConfig()
    assert config.headless is True
    assert config.timeout_ms == 30_000
    assert config.viewport_width == 1920


def test_config_to_dict():
    config = BrowserConfig()
    d = config.to_dict()
    assert "headless" in d
    assert "viewport" in d
    assert d["viewport"]["width"] == 1920


def test_task_context():
    ctx = TaskContext(goal="test goal", mode=BrowserMode.SEARCH)
    assert ctx.goal == "test goal"
    assert ctx.mode == BrowserMode.SEARCH
    ctx.record("navigate", {"url": "test.com"})
    assert len(ctx.history) == 1
    ctx.add_constraint("no ads")
    assert "no ads" in ctx.constraints


def test_step_creation():
    step = Step(action=Action.NAVIGATE, url="https://example.com")
    assert step.action == Action.NAVIGATE
    assert step.url == "https://example.com"


def test_step_result():
    ok = StepResult(success=True, data="test")
    assert ok.ok
    fail = StepResult(success=False, error="failed")
    assert not fail.ok


@pytest.mark.asyncio
async def test_planning_engine():
    engine = PlanningEngine()
    ctx = TaskContext(goal="search for python", mode=BrowserMode.SEARCH)
    steps = await engine.plan(ctx)
    assert len(steps) > 0
    assert any(s.action == Action.NAVIGATE for s in steps)


def test_content_extractor():
    html = "<html><head><title>Test</title></head><body><h1>Hello</h1><p>World</p></body></html>"
    text = ContentExtractor.extract_text(html)
    assert "Hello" in text
    assert "World" in text


def test_content_extractor_links():
    html = '<html><body><a href="https://example.com">Link</a></body></html>'
    links = ContentExtractor.extract_links(html)
    assert len(links) == 1
    assert links[0]["url"] == "https://example.com"


def test_page_analysis_estimate():
    html = "<html><body><h1>Search Results</h1></body></html>"
    page_type = PageAnalysis.estimate_page_type(html)
    assert page_type == "search_results"


def test_memory_store():
    store = MemoryStore(path="/tmp/test_mimo_memory")
    key = store.remember({"test": "data"}, tags=["test"])
    assert key is not None
    results = store.recall("test")
    assert len(results) > 0
    stats = store.get_stats()
    assert stats["episodic_memories"] > 0
    store.clear()
    assert store.get_stats()["episodic_memories"] == 0


def test_procedure_learning():
    store = MemoryStore(path="/tmp/test_mimo_procs")
    store.learn_procedure("search_and_extract", ["navigate", "search", "extract"])
    proc = store.get_procedure("search_and_extract")
    assert proc is not None
    assert len(proc) == 3
    store.clear()
