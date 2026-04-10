import json
import logging
from typing import Optional

import anthropic

from app.config import settings
from app.utils.chunker import chunk_text

logger = logging.getLogger(__name__)

RFP_ANALYSIS_PROMPT = """You are an expert RFP analyst. Analyze the following RFP document text and extract structured information.

Return a JSON object with exactly these fields:
{
  "client_name": "string - the organization issuing the RFP",
  "scope_summary": "string - 2-3 sentence summary of what is being requested",
  "budget_range": "string - estimated budget range if mentioned, otherwise 'Not specified'",
  "timeline": "string - project timeline/duration",
  "submission_deadline": "string - when proposals are due",
  "evaluation_criteria": [{"criteria": "string", "weight": "string"}],
  "key_requirements": ["string - list of key technical/functional requirements"],
  "compliance_requirements": ["string - regulatory or certification requirements"],
  "red_flags": ["string - risks or concerns identified"],
  "win_strategy_tips": ["string - suggestions for winning this RFP"],
  "estimated_contract_value": "string - estimated total value",
  "complexity_rating": "string - Low/Medium/High/Very High",
  "recommended_proposal_sections": ["string - suggested sections for the proposal"]
}

RFP Document:
"""

CAPABILITY_MATCH_PROMPT = """You are an expert proposal strategist. Analyze the RFP requirements against the company's capabilities.

Compare the RFP document with the capability document and return a JSON object:
{
  "overall_match_score": number (0-100),
  "section_matches": [
    {
      "rfp_requirement": "string",
      "your_capability": "string - matching capability from the company doc",
      "match_score": number (0-100),
      "reusable_text": "string - exact text from capability doc that can be reused",
      "ai_written_response": "string - AI-written proposal response for this section",
      "gap": "none|partial|missing"
    }
  ],
  "gaps": [
    {
      "requirement": "string",
      "mitigation": "string - suggested mitigation strategy"
    }
  ],
  "strengths": ["string"],
  "risks": ["string"],
  "differentiators": ["string"],
  "executive_summary_draft": "string - full executive summary draft",
  "cover_letter_draft": "string - full cover letter draft"
}

RFP Document:
{rfp_text}

Capability Document:
{capability_text}
"""

CHUNK_SUMMARY_PROMPT = """Summarize the following section of an RFP document, preserving all key requirements, deadlines, criteria, and compliance needs:

{chunk_text}
"""


def get_client() -> anthropic.Anthropic:
    api_key = settings.CLAUDE_API_KEY
    if not api_key:
        raise ValueError("CLAUDE_API_KEY is not configured")
    return anthropic.Anthropic(api_key=api_key)


def analyze_rfp(rfp_text: str) -> dict:
    """Engine A: Analyze RFP text and extract structured data."""
    client = get_client()

    # Handle large documents with chunking
    chunks = chunk_text(rfp_text, max_tokens=5000, overlap_words=200)

    if len(chunks) > 1:
        summaries = []
        for i, chunk in enumerate(chunks):
            prompt = CHUNK_SUMMARY_PROMPT.format(chunk_text=chunk)
            response = client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=2000,
                messages=[{"role": "user", "content": prompt}],
            )
            summaries.append(response.content[0].text)
        combined_text = "\n\n".join(summaries)
    else:
        combined_text = rfp_text

    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=4096,
        messages=[{"role": "user", "content": RFP_ANALYSIS_PROMPT + combined_text}],
    )

    result_text = response.content[0].text
    # Extract JSON from response
    try:
        # Try to find JSON in the response
        start = result_text.find("{")
        end = result_text.rfind("}") + 1
        if start >= 0 and end > start:
            result = json.loads(result_text[start:end])
        else:
            result = {"error": "Could not parse AI response", "raw": result_text}
    except json.JSONDecodeError:
        result = {"error": "Invalid JSON in AI response", "raw": result_text}

    return {
        "data": result,
        "model": "claude-sonnet-4-20250514",
        "tokens": response.usage.input_tokens + response.usage.output_tokens,
    }


def capability_match(rfp_text: str, capability_text: str) -> dict:
    """Engine B: Cross-match RFP requirements with company capabilities."""
    client = get_client()

    prompt = CAPABILITY_MATCH_PROMPT.format(
        rfp_text=rfp_text,
        capability_text=capability_text,
    )

    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=8192,
        messages=[{"role": "user", "content": prompt}],
    )

    result_text = response.content[0].text
    try:
        start = result_text.find("{")
        end = result_text.rfind("}") + 1
        if start >= 0 and end > start:
            result = json.loads(result_text[start:end])
        else:
            result = {"error": "Could not parse AI response", "raw": result_text}
    except json.JSONDecodeError:
        result = {"error": "Invalid JSON in AI response", "raw": result_text}

    return {
        "data": result,
        "model": "claude-sonnet-4-20250514",
        "tokens": response.usage.input_tokens + response.usage.output_tokens,
    }
