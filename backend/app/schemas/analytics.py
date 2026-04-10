from typing import List, Optional

from pydantic import BaseModel


class AnalyticsOverview(BaseModel):
    total_rfps: int
    active_proposals: int
    win_rate: float
    avg_proposal_time_days: float
    pipeline_value: float
    won_count: int
    lost_count: int


class QuarterlyItem(BaseModel):
    quarter: str
    won: int
    lost: int
    value: float


class QuarterlyData(BaseModel):
    quarters: List[QuarterlyItem]


class GapItem(BaseModel):
    capability: str
    frequency: int
    impact: str


class GapAnalyticsResponse(BaseModel):
    gaps: List[GapItem]
