"""
LangGraph Pipeline — Orchestrates the 3-agent resume processing workflow.

Parser → Normalizer → Matcher

Each node receives and returns the full state dict.
"""

from typing import Any

# Lazy-loaded compiled graph
_compiled_graph = None


def _get_graph():
    """Build and compile the LangGraph state graph lazily."""
    global _compiled_graph
    if _compiled_graph is None:
        from langgraph.graph import StateGraph, END
        from agents.parser_agent import parser_agent
        from agents.normalizer_agent import normalizer_agent
        from agents.matcher_agent import matcher_agent

        workflow = StateGraph(dict)
        workflow.add_node("parser", parser_agent)
        workflow.add_node("normalizer", normalizer_agent)
        workflow.add_node("matcher", matcher_agent)

        workflow.set_entry_point("parser")
        workflow.add_edge("parser", "normalizer")
        workflow.add_edge("normalizer", "matcher")
        workflow.add_edge("matcher", END)

        _compiled_graph = workflow.compile()
    return _compiled_graph


async def run_pipeline(
    file_bytes: bytes,
    file_name: str,
    job_id: str = "senior_fullstack",
) -> dict[str, Any]:
    """
    Execute the full resume processing pipeline.

    Args:
        file_bytes: Raw bytes of the uploaded resume file
        file_name: Original filename (for extension detection)
        job_id: Which job description to match against

    Returns:
        Final state dict with parsed_data, match_score, etc.
    """
    initial_state = {
        "file_bytes": file_bytes,
        "file_name": file_name,
        "job_id": job_id,
        "agent_trace": [],
    }

    graph = _get_graph()

    # LangGraph invoke is synchronous, run in thread
    import asyncio
    result = await asyncio.to_thread(graph.invoke, initial_state)

    return result

